import os
import sys
import time
import uuid
import json
import logging
import threading
from typing import Dict, Any

import docker
import pynvml
import socketio
import requests
from dotenv import load_dotenv

# Optional: suppress insecure warnings if we ignore SSL
import urllib3
urllib3.disable_warnings((urllib3.exceptions.InsecureRequestWarning))

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
COORDINATOR_URL = os.getenv("COORDINATOR_URL", "http://localhost:3001")
PROVIDER_WALLET = os.getenv("PROVIDER_WALLET", "OXSFACAMCJQLRHFQIYGG4X7SBGRWUBEAFRWK62B64ICEQ7XBZSU2BXKHE4") # demo wallet

# WARNING TO PROVIDER
MAX_SAFE_TEMP_C = int(os.getenv("MAX_SAFE_TEMP_C", "85"))
logger.warning(f"⚠️ SAFETY NOTICE: This daemon will automatically execute AI workloads on your GPU.")
logger.warning(f"⚠️ We will monitor your GPU temperature and attempt to kill workloads if it exceeds {MAX_SAFE_TEMP_C}°C to prevent hardware damage.")

sio = socketio.Client(reconnection=True, reconnection_attempts=0, reconnection_delay=1, reconnection_delay_max=5)

try:
    docker_client = docker.from_env()
    DOCKER_AVAILABLE = True
    logger.info("Docker client initialized successfully.")
except Exception as e:
    logger.warning(f"Failed to initialize Docker client. Is the Docker daemon running? Running in DRY-RUN mode.")
    DOCKER_AVAILABLE = False
    docker_client = None

try:
    pynvml.nvmlInit()
    device_count = pynvml.nvmlDeviceGetCount()
    logger.info(f"NVML initialized. Found {device_count} NVIDIA GPUs.")
except Exception as e:
    logger.error(f"Failed to initialize NVML (NVIDIA Management Library). Are NVIDIA drivers installed? Error: {e}")
    # We might still want to run in a dummy mode, but for this project, NVML is required.
    device_count = 0

active_jobs: Dict[str, Any] = {}

def get_gpu_telemetry():
    """Fetches real hardware telemetry from NVML."""
    if device_count == 0:
        return {
            "gpu_model": "Unknown (NVML Error)",
            "vram_gb": 0,
            "utilization_gpu": 0,
            "temperature_gpu": 0,
            "pcie_gen": "Unknown",
            "pcie_lanes": 0
        }
    
    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0) # Monitor the primary GPU for now
        name = pynvml.nvmlDeviceGetName(handle)
        
        mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        vram_gb = round(mem_info.total / (1024**3), 2)
        
        utilization = pynvml.nvmlDeviceGetUtilizationRates(handle)
        temperature = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
        
        # We can simulate CUDA/Tensor cores based on the model if needed, 
        # as NVML doesn't expose raw core counts directly in standard API
        
        return {
            "gpu_model": name,
            "vram_gb": vram_gb,
            "utilization_gpu": utilization.gpu, # Percentage
            "temperature_gpu": temperature,
            "pcie_gen": "Gen4", # Placeholder
            "pcie_lanes": 16
        }
    except Exception as e:
        logger.error(f"Error fetching telemetry: {e}")
        return {}

def send_heartbeat():
    """Continuously sends hardware telemetry to the coordinator."""
    while True:
        try:
            telemetry = get_gpu_telemetry()
            
            # Check for thermal throttling
            temp_c = telemetry.get("temperature_gpu", 0)
            if temp_c > MAX_SAFE_TEMP_C:
                logger.critical(f"🔥 GPU TEMPERATURE EXCEEDED {MAX_SAFE_TEMP_C}°C (Currently {temp_c}°C). THERMAL EMERGENCY.")
                logger.critical("Killing all active containers to protect hardware!")
                kill_all_jobs()
            
            payload = {
                "wallet": PROVIDER_WALLET,
                "gpu_model": telemetry.get("gpu_model", "Unknown"),
                "vram_gb": telemetry.get("vram_gb", 0),
                "price_per_minute": float(os.getenv("PRICE_PER_MIN", "0.01")),
                "status": "busy" if active_jobs else "available",
                "utilization_gpu": telemetry.get("utilization_gpu", 0),
                "temperature_gpu": temp_c,
                "uptime_score": 100,
                "bench_score": 25.5, # Placeholder TFLOPS
                "ping_latency": 15
            }
            
            response = requests.post(f"{COORDINATOR_URL}/heartbeat", json=payload, timeout=5)
            # logger.debug(f"Heartbeat sent. Response: {response.status_code}")
            
        except Exception as e:
            logger.error(f"Heartbeat failed: {e}")
            
        time.sleep(10) # Send heartbeat every 10 seconds

def kill_all_jobs():
    """Emergency stop for all running workloads."""
    for job_id, job_info in list(active_jobs.items()):
        try:
            container = job_info.get("container")
            if container:
                logger.info(f"Stopping container for job {job_id}...")
                container.stop(timeout=5)
                container.remove(force=True)
            del active_jobs[job_id]
        except Exception as e:
            logger.error(f"Failed to kill job {job_id}: {e}")

def stream_container_logs(job_id, container):
    """Streams stdout/stderr from the container to Socket.IO."""
    try:
        # Stream logs blockingly
        for log_line in container.logs(stream=True, follow=True):
            if log_line:
                line_str = log_line.decode('utf-8').strip()
                sio.emit('provider_log', {
                    "job_id": job_id,
                    "log": line_str
                })
    except Exception as e:
        logger.error(f"Log streaming error for {job_id}: {e}")
    finally:
        logger.info(f"Log stream ended for job {job_id}")
        
        # When logs finish, assume job is done (unless it crashed)
        try:
            container.reload()
            exit_code = container.attrs['State']['ExitCode']
            logger.info(f"Container {job_id} exited with code {exit_code}")
            
            sio.emit('job_complete', {
                "job_id": job_id,
                "exit_code": exit_code
            })
            
            # Cleanup
            container.remove(force=True)
            if job_id in active_jobs:
                del active_jobs[job_id]
                
        except Exception as cleanup_err:
             logger.error(f"Error evaluating container completion: {cleanup_err}")

@sio.event
def connect():
    logger.info("🟢 Connected to Coordinator over Socket.IO")
    logger.info(f"Listening for events on room: start_job_{PROVIDER_WALLET}")

@sio.event
def disconnect():
    logger.warning("🔴 Disconnected from Coordinator")

@sio.on(f"start_job_{PROVIDER_WALLET}")
def on_start_job(data):
    job_id = data.get("job_id")
    image = data.get("image", "python:3.10-slim")
    script_content = data.get("script", "print('No script provided')")
    dataset_source = data.get("dataset_source", "")
    
    logger.info(f"🚀 Received START_JOB event! Job ID: {job_id}")
    logger.info(f"Requested Image: {image}")
    
    if job_id in active_jobs:
        logger.warning(f"Job {job_id} is already running.")
        return
        
    # 1. Prepare Workspace
    workspace_dir = os.path.join(os.getcwd(), "workspaces", job_id)
    os.makedirs(workspace_dir, exist_ok=True)
    
    script_path = os.path.join(workspace_dir, "run.py")
    with open(script_path, "w", encoding='utf-8', newline='\n') as f:
        f.write(script_content)
    
    logger.info(f"Script written ({len(script_content)} bytes). Preview: {script_content[:100].strip()!r}")
    sio.emit('provider_log', {"job_id": job_id, "log": f"[SYSTEM] Script written to disk ({len(script_content)} bytes). Running natively..."})
        
    env_vars = {}
    
    # 2. Download Dataset if specified
    if dataset_source:
        env_vars["DATASET_SOURCE"] = dataset_source
        logger.info(f"Downloading dataset from {dataset_source}...")
        sio.emit('provider_log', {"job_id": job_id, "log": f"⬇️ Downloading dataset from {dataset_source}..."})

        dataset_dir = os.path.join(workspace_dir, "dataset")
        os.makedirs(dataset_dir, exist_ok=True)

        try:
            if dataset_source.startswith("http"):
                # Handle direct URL downloads
                filename = dataset_source.split("/")[-1] or "data.bin"
                filepath = os.path.join(dataset_dir, filename)
                response = requests.get(dataset_source, stream=True, verify=False, timeout=30)
                response.raise_for_status()
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                sio.emit('provider_log', {"job_id": job_id, "log": f"✅ Dataset downloaded to {filepath}"})
                
                # Expose the local path to the container
                env_vars["DATASET_LOCAL_PATH"] = f"/workspace/dataset/{filename}"
                
            elif dataset_source.startswith("hf://"):
                # Handle HuggingFace Dataset identifiers
                hf_repo = dataset_source.replace("hf://", "")
                sio.emit('provider_log', {"job_id": job_id, "log": f"🤗 Attempting to fetch HuggingFace dataset: {hf_repo}"})
                # We would ideally use the `huggingface_hub` package here, but for now we write a script that does it inside the container.
                # Just flag it so the runner script knows it's an HF repo
                env_vars["HF_DATASET"] = hf_repo
                sio.emit('provider_log', {"job_id": job_id, "log": f"✅ HuggingFace dataset {hf_repo} targeted for in-container hydration."})

        except Exception as e:
            logger.error(f"Dataset download failed: {e}")
            sio.emit('provider_log', {"job_id": job_id, "log": f"❌ Dataset download failed: {str(e)}"})
            sio.emit('job_complete', {"job_id": job_id, "exit_code": 1})
            return

    # 3. Pull image (this blocks, ideally done async but fine for now)
    try:
        logger.info(f"Pulling Docker image {image}...")
        docker_client.images.pull(image)
    except Exception as e:
        logger.error(f"Failed to pull image {image}: {e}")
        sio.emit('provider_log', {"job_id": job_id, "log": f"[SYSTEM ERROR] Failed to pull image {image}: {str(e)}"})
        return

    # 3. Start Container
    logger.info(f"Starting Docker container...")
    try:
        if not DOCKER_AVAILABLE:
            import subprocess
            logger.warning(f"HOST EXECUTION MODE: Simulating Docker by natively running Python on GPU.")
            sio.emit('provider_log', {"job_id": job_id, "log": f"[SYSTEM] Docker unavailable. Falling back to native Windows OS execution for testing."})
            
            try:
                # Execute it natively
                process = subprocess.Popen(
                    [sys.executable, script_path], # Using sys.executable allows us to run in current venv
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    env={**os.environ, **env_vars},
                    cwd=workspace_dir,
                    text=True,
                    bufsize=1,
                    encoding='utf-8',
                    errors='replace'
                )
                
                active_jobs[job_id] = {
                    "process": process,
                    "status": "running"
                }
                
                def stream_process():
                    try:
                        for line in iter(process.stdout.readline, ''):
                            if line:
                                stripped = line.strip()
                                sio.emit('provider_log', {"job_id": job_id, "log": stripped})
                                # Detect machine-readable metric lines: [METRIC] epoch=N loss=X accuracy=Y
                                if stripped.startswith('[METRIC]'):
                                    try:
                                        parts = dict(kv.split('=') for kv in stripped[len('[METRIC]'):].split())
                                        sio.emit('metric_update', {
                                            "job_id": job_id,
                                            "epoch": int(parts.get('epoch', 0)),
                                            "loss": float(parts.get('loss', 0)),
                                            "accuracy": float(parts.get('accuracy', 0))
                                        })
                                    except Exception as me:
                                        logger.warning(f"Failed to parse metric line: {stripped} — {me}")
                        process.wait()
                        exit_code = process.returncode
                        
                        pdf_path = os.path.join(workspace_dir, "trained_data.pdf")
                        if os.path.exists(pdf_path):
                            try:
                                import base64
                                with open(pdf_path, 'rb') as f:
                                    pdf_data = base64.b64encode(f.read()).decode('utf-8')
                                sio.emit('job_result_file', {"job_id": job_id, "filename": "trained_data.pdf", "data": pdf_data})
                                sio.emit('provider_log', {"job_id": job_id, "log": "✅ Trained data compiled into PDF and securely transmitted."})
                            except Exception as e:
                                logger.error(f"Error transmitting PDF: {e}")
                                
                        sio.emit('provider_log', {"job_id": job_id, "log": f"[SYSTEM] Native execution completed with code {exit_code}."})
                        sio.emit('job_complete', {
                            "job_id": job_id,
                            "exit_code": exit_code
                        })
                    except Exception as e:
                        logger.error(f"Process streaming error: {e}")
                        sio.emit('provider_log', {"job_id": job_id, "log": f"❌ Native streaming err: {e}"})
                    finally:
                        if job_id in active_jobs:
                            del active_jobs[job_id]
                
                threading.Thread(target=stream_process).start()
                return
            except Exception as e:
                logger.error(f"Failed to start native process: {e}")
                sio.emit('provider_log', {"job_id": job_id, "log": f"[SYSTEM ERROR] {str(e)}"})
                return

        # Note: In production you MUST use device_requests to pass GPUs
        # Here we attempt to map all GPUs using --gpus all equivalent
        
        device_requests = [
            docker.types.DeviceRequest(count=-1, capabilities=[['gpu']])
        ]
        
        container = docker_client.containers.run(
            image,
            command=["python", "/workspace/run.py"],
            volumes={
                workspace_dir: {'bind': '/workspace', 'mode': 'rw'}
            },
            environment=env_vars,
            working_dir="/workspace",
            detach=True,
            device_requests=device_requests, # Grant GPU access!
            remove=False # we want to check exit code later
        )
        
        active_jobs[job_id] = {
            "container": container,
            "status": "running"
        }
        
        # 4. Start log streaming thread
        log_thread = threading.Thread(target=stream_container_logs, args=(job_id, container))
        log_thread.daemon = True
        log_thread.start()
        
    except Exception as e:
        logger.error(f"Failed to start container for job {job_id}: {e}")
        sio.emit('provider_log', {"job_id": job_id, "log": f"[SYSTEM ERROR] Container failed to start: {str(e)}"})
        
@sio.on(f"stop_job_{PROVIDER_WALLET}")
def on_stop_job(data):
    job_id = data.get("job_id")
    logger.warning(f"🛑 Received STOP_JOB event for {job_id}")
    
    if job_id in active_jobs:
        try:
            container = active_jobs[job_id]["container"]
            container.stop(timeout=5)
            container.remove(force=True)
            del active_jobs[job_id]
            logger.info(f"Job {job_id} force stopped.")
        except Exception as e:
            logger.error(f"Error stopping job {job_id}: {e}")

if __name__ == "__main__":
    logger.info("=== GPUX PROVIDER DAEMON ===")
    
    # Start Heartbeat thread
    hb_thread = threading.Thread(target=send_heartbeat)
    hb_thread.daemon = True
    hb_thread.start()
    
    # Connect Socket.IO
    logger.info(f"Connecting to Coordinator at {COORDINATOR_URL}...")
    try:
         sio.connect(COORDINATOR_URL)
         sio.wait()
    except Exception as e:
         logger.error(f"Socket.IO connection failed: {e}")
         time.sleep(5)
