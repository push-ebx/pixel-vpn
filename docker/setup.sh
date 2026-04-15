#!/bin/bash
# Pixel VPN Server Setup
# Run on your VPS to generate keys and configure xray

set -e

echo "=== Pixel VPN Server Setup ==="

# Generate x25519 keypair using xray
echo ""
echo "Generating Reality keys..."

# Pull xray image first
docker pull ghcr.io/xtls/xray-core:latest

KEYS=$(docker run --rm ghcr.io/xtls/xray-core:latest xray x25519)
PRIVATE_KEY=$(echo "$KEYS" | grep "Private" | awk '{print $3}')
PUBLIC_KEY=$(echo "$KEYS" | grep "Public" | awk '{print $3}')

# Generate UUID
UUID=$(docker run --rm ghcr.io/xtls/xray-core:latest xray uuid)

echo ""
echo "Generated credentials:"
echo "  UUID:        $UUID"
echo "  Private Key: $PRIVATE_KEY"
echo "  Public Key:  $PUBLIC_KEY"

# Update config
sed -i "s/CHANGE-ME-UUID/$UUID/g" xray/config.json
sed -i "s/CHANGE-ME-PRIVATE-KEY/$PRIVATE_KEY/g" xray/config.json

echo ""
echo "Config updated. Starting server..."
docker compose up -d

SERVER_IP=$(curl -s ifconfig.me)
echo ""
echo "=== Server is running ==="
echo ""
echo "VLESS link for the client:"
echo "vless://${UUID}@${SERVER_IP}:443?type=tcp&security=reality&fp=chrome&pbk=${PUBLIC_KEY}&sni=www.google.com&flow=xtls-rprx-vision#PixelVPN-Server"
echo ""
echo "Copy the link above and import it in the Pixel VPN client."
