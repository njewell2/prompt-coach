import os
import boto3
from anthropic import AnthropicBedrock, Anthropic

BEDROCK_REGION    = os.environ.get("AWS_REGION",  "us-east-1")
BEDROCK_PROFILE   = os.environ.get("AWS_PROFILE", "showcase-dma")
USE_BEDROCK_FLAG  = os.environ.get("USE_BEDROCK") == "1"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

BEDROCK_SONNET = "us.anthropic.claude-sonnet-4-20250514-v1:0"
DIRECT_SONNET  = "claude-sonnet-4-5-20241022"


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
    if use_bedrock():
        session = boto3.Session(profile_name=BEDROCK_PROFILE)
        creds = session.get_credentials().get_frozen_credentials()
        return AnthropicBedrock(
            aws_region=BEDROCK_REGION,
            aws_access_key=creds.access_key,
            aws_secret_key=creds.secret_key,
            aws_session_token=creds.token,
        )
    return Anthropic()


def model_id() -> str:
    return BEDROCK_SONNET if use_bedrock() else DIRECT_SONNET
