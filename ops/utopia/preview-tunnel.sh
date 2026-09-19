#!/usr/bin/env bash
set -euo pipefail
# Foreground tunnel to the production container. Stop with Ctrl-C.
# Resolve the current container address again after a future deployment.
if lsof -nP -iTCP:3849 -sTCP:LISTEN >/dev/null 2>&1; then
  echo 'Port 3849 is already occupied; inspect the existing listener before starting another tunnel.' >&2
  exit 1
fi
app_ip="$(ssh -o BatchMode=yes -o ConnectTimeout=10 utopia 'sudo -n docker inspect hamster-storage-app --format "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"')"
if [[ ! "$app_ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo 'Could not resolve exactly one application container address.' >&2
  exit 1
fi
echo 'Production preview: http://127.0.0.1:3849/#mcp (SSH tunnel; not a local test database)'
exec ssh -N -o BatchMode=yes -o ConnectTimeout=10 -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -L "127.0.0.1:3849:$app_ip:3847" utopia
