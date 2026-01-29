#!/bin/sh
# Docker entrypoint script for Fleetbase Console
# Generates runtime configuration from environment variables

# Generate fleetbase.config.json from environment variables
cat > /usr/share/nginx/html/fleetbase.config.json << EOF
{
    "API_HOST": "${API_HOST:-http://localhost:8000}",
    "SOCKETCLUSTER_HOST": "${SOCKETCLUSTER_HOST:-}",
    "SOCKETCLUSTER_PATH": "${SOCKETCLUSTER_PATH:-/socketcluster/}",
    "SOCKETCLUSTER_SECURE": ${SOCKETCLUSTER_SECURE:-true},
    "SOCKETCLUSTER_PORT": ${SOCKETCLUSTER_PORT:-443}
}
EOF

echo "Generated fleetbase.config.json:"
cat /usr/share/nginx/html/fleetbase.config.json

# Start nginx
exec nginx -g 'daemon off;'
