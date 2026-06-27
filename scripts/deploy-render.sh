#!/usr/bin/env bash
set -e
RENDER_KEY="${RENDER_API_KEY}"

echo "Triggering frontend deploy..."
curl -s -X POST "https://api.render.com/v1/services/srv-d8i6ah8jo6nc73cvc460/deploys" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json"

echo ""
echo "Triggering backend deploy..."
curl -s -X POST "https://api.render.com/v1/services/srv-d8ijdpe47okc739etglg/deploys" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json"
echo ""
