import os
import time
import boto3
from anthropic import AnthropicBedrock, Anthropic

BEDROCK_REGION    = os.environ.get("AWS_REGION",  "us-east-1")
BEDROCK_PROFILE   = os.environ.get("AWS_PROFILE", "showcase-dma")
USE_BEDROCK_FLAG  = os.environ.get("USE_BEDROCK") == "1"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

BEDROCK_SONNET = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
BEDROCK_HAIKU  = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
DIRECT_SONNET  = "claude-sonnet-4-5-20241022"
DIRECT_HAIKU   = "claude-haiku-4-5-20251001"

_CLIENT_TTL_SEC = 50 * 60
_client_cache: dict = {"client": None, "created": 0.0}


def use_bedrock() -> bool:
    if USE_BEDROCK_FLAG:
        return True
    if ANTHROPIC_API_KEY:
        return False
    try:
        boto3.Session(profile_name=BEDROCK_PROFILE).get_credentials()
        return True
    except Exception:
        return False


def get_client():
    now = time.time()
    cached = _client_cache["client"]
    if cached is not None and now - _client_cache["created"] < _CLIENT_TTL_SEC:
        return cached

    if use_bedrock():
        session = boto3.Session(profile_name=BEDROCK_PROFILE)
        creds = session.get_credentials().get_frozen_credentials()
        client = AnthropicBedrock(
            aws_region=BEDROCK_REGION,
            aws_access_key=creds.access_key,
            aws_secret_key=creds.secret_key,
            aws_session_token=creds.token,
        )
    else:
        client = Anthropic()

    _client_cache["client"] = client
    _client_cache["created"] = now
    return client


def model_id(tier: str = "default") -> str:
    bedrock = use_bedrock()
    if tier == "fast":
        return BEDROCK_HAIKU if bedrock else DIRECT_HAIKU
    return BEDROCK_SONNET if bedrock else DIRECT_SONNET
