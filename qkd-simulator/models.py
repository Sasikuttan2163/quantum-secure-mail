from pydantic import BaseModel
from typing import List, Optional

class StatusResponse(BaseModel):
    source_KME_ID: str
    target_KME_ID: str
    master_SAE_ID: str
    slave_SAE_ID: str
    key_size: int
    stored_key_count: int
    max_key_count: int
    max_key_per_request: int
    max_key_size: int
    min_key_size: int
    max_SAE_ID_count: int

class KeyRequest(BaseModel):
    number: Optional[int] = 1
    size: Optional[int] = 1024

class KeyContainer(BaseModel):
    key_ID: str
    key: str

class KeyResponse(BaseModel):
    keys: List[KeyContainer]

class KeyID(BaseModel):
    key_ID: str

class KeyIDsRequest(BaseModel):
    key_IDs: List[KeyID]