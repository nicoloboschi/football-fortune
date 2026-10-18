#!/bin/sh
# Start the game server and a Cloudflare quick tunnel; prints the public URL.
# The URL changes every time this runs. The save lives in state.json, so it is kept.
cd "$(dirname "$0")"
pkill -f "football-fortune/server.py" 2>/dev/null; pkill -f "cloudflared tunnel --url http://localhost:8787" 2>/dev/null
nohup python3 "$PWD/server.py" 8787 > server.log 2>&1 &
nohup cloudflared tunnel --url http://localhost:8787 --no-autoupdate > tunnel.log 2>&1 &
for i in $(seq 1 30); do
  url=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | head -1)
  [ -n "$url" ] && { echo "$url"; exit 0; }
  sleep 1
done
echo "tunnel did not start, see tunnel.log"; exit 1
