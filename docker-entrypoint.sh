#!/bin/sh
set -e

mkdir -p /app/uploads/generated-images
chown -R nodejs:nodejs /app/uploads

exec su-exec nodejs "$@"
