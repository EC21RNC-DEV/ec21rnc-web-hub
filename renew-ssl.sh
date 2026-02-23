#!/bin/bash
# SSL 인증서 갱신 스크립트 (서버에서 1회 실행)

DOMAIN="ec21rnc-agent.com"
EMAIL="sean@ec21rnc.com"

echo "=== SSL 인증서 갱신 시작 ==="

# 1. 기존 인증서 갱신 시도
echo "1. certbot renew 시도..."
sudo certbot renew --force-renewal

# 갱신 실패 시 재발급
if [ $? -ne 0 ]; then
    echo "2. 갱신 실패 → 재발급 시도..."
    sudo certbot certonly \
        --webroot \
        --webroot-path=$(pwd)/certbot/www \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d $DOMAIN
fi

# 2. 인증서 확인
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo ""
    echo "=== 인증서 정보 ==="
    openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -noout -dates
    echo ""
    echo "=== 성공! docker compose 재시작 ==="
    docker compose restart proxy
    echo "완료! https://$DOMAIN 에서 확인하세요."
else
    echo "인증서 발급 실패. dns-challenge.sh를 시도하세요."
fi
