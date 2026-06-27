#!/usr/bin/env python3
"""Set Render env vars for Omix Store services"""
import os, json, subprocess, sys
from dotenv import load_dotenv

load_dotenv("/home/oliver/omix/.env")

RENDER_KEY = os.environ.get("RENDER_API_KEY", "")
FRONTEND_ID = "srv-d8i6ah8jo6nc73cvc460"
API_ID = "srv-d8ijdpe47okc739etglg"

def set_env_var(service_id, key, value):
    """Set an env var on a Render service"""
    cmd = [
        "curl", "-s", "-X", "PUT",
        f"https://api.render.com/v1/services/{service_id}/env-vars/{key}",
        "-H", f"Authorization: Bearer {RENDER_KEY}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"value": value})
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    try:
        data = json.loads(result.stdout)
        if data.get("key") == key:
            return "OK"
        return data.get("message", "unknown")[:60]
    except:
        return result.stdout[:60]

# Frontend VITE_ vars (baked at build time)
frontend_vars = {
    "VITE_PAYSTACK_PUBLIC_KEY": os.getenv("VITE_PAYSTACK_PUBLIC_KEY", ""),
    "VITE_SUPABASE_ANON_KEY": os.getenv("VITE_SUPABASE_ANON_KEY", ""),
    "VITE_SUPABASE_URL": os.getenv("VITE_SUPABASE_URL", ""),
    "VITE_FRONTEND_URL": os.getenv("VITE_FRONTEND_URL", ""),
    "VITE_VAPID_PUBLIC_KEY": os.getenv("VITE_VAPID_PUBLIC_KEY", ""),
    "VITE_PUSH_FUNCTION_URL": os.getenv("VITE_PUSH_FUNCTION_URL", ""),
    "VITE_GA_MEASUREMENT_ID": os.getenv("VITE_GA_MEASUREMENT_ID", ""),
    "VITE_OPENCODE_API_URL": os.getenv("VITE_OPENCODE_API_URL", ""),
    "VITE_OPENCODE_API_KEY": os.getenv("VITE_OPENCODE_API_KEY", ""),
}

# Backend vars
backend_vars = {
    "SUPABASE_URL": os.getenv("VITE_SUPABASE_URL", ""),
    "VAPID_PRIVATE_KEY": os.getenv("VAPID_PRIVATE_KEY", ""),
    "VITE_OPENCODE_API_KEY": os.getenv("VITE_OPENCODE_API_KEY", ""),
}

print("Setting FRONTEND env vars...")
for key, value in frontend_vars.items():
    if not value:
        print(f"  SKIP {key} (empty)")
        continue
    result = set_env_var(FRONTEND_ID, key, value)
    print(f"  {key}: {result}")

print("\nSetting BACKEND env vars...")
for key, value in backend_vars.items():
    if not value:
        print(f"  SKIP {key} (empty)")
        continue
    result = set_env_var(API_ID, key, value)
    print(f"  {key}: {result}")

print("\nDone!")
