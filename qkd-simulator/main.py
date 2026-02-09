from fastapi import FastAPI, HTTPException
from models import StatusResponse, KeyResponse, KeyRequest, KeyIDsRequest
from store_keys import key_store, generate_key

app = FastAPI(title="QKD KME Simulator", version="1.0")

# Get Status
@app.get("/api/v1/keys/{slave_SAE_ID}/status", response_model=StatusResponse)
async def getStatus(slave_SAE_ID: str):
    return {
        "source_KME_ID": "KME_SIMULATOR_001",
        "target_KME_ID": "KME_SIMULATOR_002",
        "master_SAE_ID": "MASTER_SAE",
        "slave_SAE_ID": slave_SAE_ID,
        "key_size": 256,
        "stored_key_count": 1000,
        "max_key_count": 10000,
        "max_key_per_request": 10,
        "max_key_size": 512,
        "min_key_size": 128,
        "max_SAE_ID_count": 0
    }

# Get Key for Master SAE
@app.post("/api/v1/keys/{slave_SAE_ID}/enc_keys", response_model=KeyResponse)
async def get_key(slave_SAE_ID: str, request: KeyRequest):
    num_keys = request.number if request.number else 1
    key_size = request.size if request.size else 256

    response_keys = []

    for _ in range(num_keys):
        key_id, key = generate_key(key_size)
        keyRequest = {
            "key_ID": key_id,
            "key": key
        }

        key_store[key_id] = {
            "key": key,
            "slave_sae": slave_SAE_ID
        }

        response_keys.append(keyRequest)

    return {
        "keys": response_keys
    }

# Retrieve Key with key ID for slave SAE
@app.post("/api/v1/keys/{master_SAE_ID}/dec_keys", response_model=KeyResponse)
async def get_key_with_ids(master_SAE_ID: str, request: KeyIDsRequest):
    response_keys = []

    for key_object in request.key_IDs:
        k_id = key_object.key_ID

        if k_id in key_store:
            key_data = key_store.pop(k_id)
            keyRequest = {
                "key_ID": k_id,
                "key": key_data["key"]
            }
            response_keys.append(keyRequest)
        else:
            pass
    
    if not response_keys:
        raise HTTPException(status_code=404, detail="No matching keys found")
    
    return {
        "keys": response_keys
    }