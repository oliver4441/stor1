#!/usr/bin/env python3
"""Update omix-store MCP config in Hermes"""
import json, subprocess, os, re

# Read Render API key from file
with open("/tmp/render-token.txt") as f:
    RENDER_KEY = f.read().strip()

# Read local .env for Supabase values
from dotenv import load_dotenv
load_dotenv("/home/oliver/omix/.env")

supabase_url = os.getenv("VITE_SUPABASE_URL", "")
supabase_anon = os.getenv("VITE_SUPABASE_ANON_KEY", "")
paystack_pk = os.getenv("VITE_PAYSTACK_PUBLIC_KEY", "")
project_ref = supabase_url.replace("https://", "").replace(".supabase.co", "")

# Get service key from Render backend env vars
auth_header = f"Authorization: Bearer *** r = subprocess.run(
    ["curl", "-s", "https://api.render.com/v1/services/srv-d8ijdpe47okc739etglg/env-vars",
     "-H", auth_header],
    capture_output=True, text=True, timeout=15
)
backend_envs = {}
try:
    data = json.loads(r.stdout)
    if isinstance(data, list):
        for v in data:
            ev = v.get("envVar", v) if isinstance(v, dict) else {}
            if isinstance(ev, dict):
                backend_envs[ev.get("key", "")] = ev.get("value", "")
except:
    pass

supabase_service = backend_envs.get("SUPABASE_SERVICE_KEY", supabase_anon)
paystack_secret = backend_envs.get("PAYSTACK_SECRET_KEY", "")

print(f"Supabase URL: {supabase_url}")
print(f"Project ref: {project_ref}")
print(f"Anon key: {len(supabase_anon)} chars")
print(f"Service key: {len(supabase_service)} chars")
print(f"Paystack PK: {len(paystack_pk)} chars")
print(f"Paystack SK: {len(paystack_secret)} chars")

# Now update the Hermes config.yaml
config_path = os.path.expanduser("~/.hermes/config.yaml")
with open(config_path, "r") as f:
    content = f.read()

# Update omix-store MCP env vars
# Parse the YAML manually (it's nested, so regex carefully)

# Update SUPABASE_PAT - keep existing since it might still work
# Update SUPABASE_PROJECT_REF
content = re.sub(
    r'SUPABASE_PROJECT_REF:.*',
    f'SUPABASE_PROJECT_REF: {project_ref}',
    content
)

# Update SUPABASE_URL
content = re.sub(
    r'SUPABASE_URL: https://[^\n]+',
    f'SUPABASE_URL: {supabase_url}',
    content
)

# Update SUPABASE_SERVICE_KEY
content = re.sub(
    r'SUPABASE_SERVICE_KEY: [^\n]+',
    f'SUPABASE_SERVICE_KEY: {supabase_service}',
    content
)

# Update RENDER_API_KEY
content = re.sub(
    r'RENDER_API_KEY: \'[^\']*\'',
    f'RENDER_API_KEY: \'{RENDER_KEY}\'',
    content
)
content = re.sub(
    r'RENDER_API_KEY: ""',
    f'RENDER_API_KEY: \'{RENDER_KEY}\'',
    content
)

# Update RENDER_FRONTEND_SERVICE_ID
content = re.sub(
    r'RENDER_FRONTEND_SERVICE_ID: \'[^\']*\'',
    "RENDER_FRONTEND_SERVICE_ID: 'srv-d8i6ah8jo6nc73cvc460'",
    content
)
content = re.sub(
    r'RENDER_FRONTEND_SERVICE_ID: ""',
    "RENDER_FRONTEND_SERVICE_ID: 'srv-d8i6ah8jo6nc73cvc460'",
    content
)

# Update RENDER_BACKEND_SERVICE_ID
content = re.sub(
    r'RENDER_BACKEND_SERVICE_ID: \'[^\']*\'',
    "RENDER_BACKEND_SERVICE_ID: 'srv-d8ijdpe47okc739etglg'",
    content
)
content = re.sub(
    r'RENDER_BACKEND_SERVICE_ID: ""',
    "RENDER_BACKEND_SERVICE_ID: 'srv-d8ijdpe47okc739etglg'",
    content
)

# Update Paystack keys in paystack MCP
content = re.sub(
    r'PAYSTACK_SECRET_KEY: [^\n]+',
    f'PAYSTACK_SECRET_KEY: {paystack_secret}',
    content
)
content = re.sub(
    r'PAYSTACK_PUBLIC_KEY: [^\n]+',
    f'PAYSTACK_PUBLIC_KEY: {paystack_pk}',
    content
)

with open(config_path, "w") as f:
    f.write(content)

print("\nConfig updated successfully!")
