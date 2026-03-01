import os
import base64
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCreateTxn, StateSchema, wait_for_confirmation
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
MNEMONIC = os.getenv("ALGORAND_MNEMONIC")

if not MNEMONIC:
    print("❌ Error: ALGORAND_MNEMONIC not found in .env file.")
    print("Please create a .env file with: ALGORAND_MNEMONIC=\"your 25 word mnemonic\"")
    exit(1)

secret_key = mnemonic.to_private_key(MNEMONIC)
sender_address = account.address_from_private_key(secret_key)

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def compile_program(client, source_code):
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

print(f"🚀 Deploying EscrowContract from: {sender_address}")

# 1. Read TEAL files
with open("EscrowContract.approval.teal", "r") as f:
    approval_source = f.read()

with open("EscrowContract.clear.teal", "r") as f:
    clear_source = f.read()

# 2. Compile TEAL to Binary
approval_binary = compile_program(algod_client, approval_source)
clear_binary = compile_program(algod_client, clear_source)

# 3. Create Application
params = algod_client.suggested_params()

# Puya generates state schema requirements in the ARC-56/ARC-32 metadata, 
# but for a basic MVP we can use simple schemas or check the .arc56.json.
# This contract has no Global State besides the 'coordinator' which is set in __init__ (stored in Global State).
global_schema = StateSchema(num_uints=1, num_byte_slices=1) # 1 for coordinator address + maybe more
local_schema = StateSchema(num_uints=0, num_byte_slices=0)

txn = ApplicationCreateTxn(
    sender=sender_address,
    sp=params,
    on_complete=0, # NoOp
    approval_program=approval_binary,
    clear_program=clear_binary,
    global_schema=global_schema,
    local_schema=local_schema
)

# 4. Sign and Send
signed_txn = txn.sign(secret_key)
txid = algod_client.send_transaction(signed_txn)
print(f"Sent transaction with ID: {txid}")

# 5. Wait for confirmation
confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
app_id = confirmed_txn['application-index']

print(f"✅ Contract Deployed Successfully!")
print(f"App ID: {app_id}")
print(f"View on AlgoExplorer: https://testnet.algoexplorer.io/application/{app_id}")

# Save App ID for the backend
with open("../gpux-coordinator/.env", "a") as f:
    f.write(f"\nALGORAND_APP_ID={app_id}")
print("\nApp ID saved to Coordinator .env")
