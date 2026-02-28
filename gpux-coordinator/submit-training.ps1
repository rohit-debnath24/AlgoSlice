$body = @{
    renter_wallet    = "HACKATHON_DEMO_RENTER"
    gpu_id           = "e5030d84-9782-4e91-a7b7-5713d63fc4e8"
    minutes          = 60
    escrow_tx_hash   = "train_tx_lavita_$(Get-Random)"
    image            = "python:3.11-slim"
    dataset_source   = "lavita/medical-qa-shared-task-v1-toy"
    script           = @"
import subprocess, sys

# Install dependencies
subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'datasets', 'transformers', 'torch'], check=True)

from datasets import load_dataset

DATASET = 'lavita/medical-qa-shared-task-v1-toy'
print(f'[gpux] Loading dataset: {DATASET}')
ds = load_dataset(DATASET)
print(f'[gpux] Dataset loaded successfully!')
print(f'[gpux] Splits: {list(ds.keys())}')

# Show first entry
for split in ds:
    first = ds[split][0]
    print(f'\n[gpux] --- First row from [{split}] ---')
    for k, v in first.items():
        print(f'  {k}: {str(v)[:120]}')
    print(f'[gpux] Total rows in [{split}]: {len(ds[split])}')

print('\n[gpux] ✅ Training data verified and ready.')
print('[gpux] In a real job, fine-tuning would begin here...')
"@
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod -Uri "http://localhost:3001/rent" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$result | ConvertTo-Json -Depth 5
