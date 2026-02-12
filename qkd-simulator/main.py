from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import StatusResponse, KeyResponse, KeyRequest, KeyIDsRequest
from store_keys import key_store, generate_key, load_keys, save_keys
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load keys on startup, save on shutdown"""
    # Startup
    logger.info("="*60)
    logger.info("QKD KME Simulator Starting...")
    logger.info("Loading persistent key storage...")
    load_keys()
    logger.info("="*60)
    yield
    # Shutdown
    logger.info("Saving keys before shutdown...")
    save_keys()
    logger.info("QKD KME Simulator Shutting Down...")


app = FastAPI(title="QKD KME Simulator", version="1.0", lifespan=lifespan)

# add CORS
origins = ["*"]
methods = ["*"]
headers = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = methods,
    allow_headers = headers
)

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

    logger.info(f"Generating {num_keys} key(s) of size {key_size} for slave SAE: {slave_SAE_ID}")
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
        logger.info(f"Generated and stored key: {key_id}")

    # Save keys to persistent storage
    save_keys()
    logger.info(f"Total keys in store: {len(key_store)}")
    return {
        "keys": response_keys
    }

# Retrieve Key with key ID for slave SAE
@app.post("/api/v1/keys/{master_SAE_ID}/dec_keys", response_model=KeyResponse)
async def get_key_with_ids(master_SAE_ID: str, request: KeyIDsRequest):
    logger.info(f"Decryption key request from master SAE: {master_SAE_ID}")
    logger.info(f"Requested key IDs: {[k.key_ID for k in request.key_IDs]}")
    logger.info(f"Available keys in store: {list(key_store.keys())}")
    
    response_keys = []

    for key_object in request.key_IDs:
        k_id = key_object.key_ID

        if k_id in key_store:
            # Retrieve but DON'T remove - allow re-decryption of same message
            key_data = key_store[k_id]
            keyRequest = {
                "key_ID": k_id,
                "key": key_data["key"]
            }
            response_keys.append(keyRequest)
            
            # Mark as used for tracking (optional)
            if "used_count" not in key_data:
                key_data["used_count"] = 0
            key_data["used_count"] += 1
            
            logger.info(f"Retrieved key: {k_id} (used {key_data['used_count']} time(s))")
        else:
            logger.warning(f"Key not found: {k_id}")
    
    if not response_keys:
        logger.error(f"No matching keys found. Requested: {[k.key_ID for k in request.key_IDs]}, Available: {list(key_store.keys())}")
        raise HTTPException(status_code=404, detail="No matching keys found")
    
    # Save updated key store after marking usage
    save_keys()
    logger.info(f"Returning {len(response_keys)} key(s)")
    logger.info(f"Total keys in store: {len(key_store)}")
    return {
        "keys": response_keys
    }