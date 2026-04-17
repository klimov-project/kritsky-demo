#!/usr/bin/env bash

set -euo pipefail

DOMAIN="${1:-ege.kritsky.academy}"
EMAIL="${2:-}"

if [[ -z "$EMAIL" ]]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 ege.kritsky.academy admin@example.com"
    exit 1
fi

echo "Starting services required for SSL..."
docker compose up -d db backend frontend

echo "Creating temporary certificate so nginx can start on 443..."
docker compose run --rm --entrypoint sh certbot -c "
set -e
mkdir -p /etc/letsencrypt/live/$DOMAIN
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
  -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
  -subj '/CN=$DOMAIN'
"

echo "Starting nginx..."
docker compose up -d nginx

echo "Removing temporary certificate files before requesting Let's Encrypt..."
docker compose run --rm --entrypoint sh certbot -c "
set -e
rm -rf /etc/letsencrypt/live/$DOMAIN
rm -rf /etc/letsencrypt/archive/$DOMAIN
rm -f /etc/letsencrypt/renewal/$DOMAIN.conf
"

echo "Requesting Let's Encrypt certificate for $DOMAIN..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email

echo "Reloading nginx with the issued certificate..."
docker compose exec nginx nginx -s reload

echo "Done. SSL is configured for https://$DOMAIN"
