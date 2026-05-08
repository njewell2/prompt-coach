#!/bin/bash
set -e
cd "$(dirname "$0")"
kill $(lsof -ti :5000) 2>/dev/null && echo "Stopped existing server on :5000" || true
# Activate venv if present
if [ -f .venv/bin/activate ]; then
  source .venv/bin/activate
fi
AWS_PROFILE=ailab USE_BEDROCK=1 PORT=8080 python3 backend/app.py
