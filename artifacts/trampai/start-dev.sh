#!/bin/sh
export NODE_OPTIONS="--dns-result-order=ipv4first"
export EXPO_PACKAGER_PROXY_URL="https://$REPLIT_EXPO_DEV_DOMAIN"
export EXPO_PUBLIC_DOMAIN="$REPLIT_DEV_DOMAIN"
export EXPO_PUBLIC_REPL_ID="$REPL_ID"
export REACT_NATIVE_PACKAGER_HOSTNAME="$REPLIT_DEV_DOMAIN"
exec pnpm exec expo start --localhost --port "$PORT"
