#!/bin/bash
DOMAIN="ec21rnc-agent.com"
EMAIL="sean@ec21rnc.com"
DIR="/home/gpuadmin/ec21rnc-web-hub"

echo "=== 1. 기존 컨테이너 정리 ==="
sudo docker rm -f nginx-temp 2>/dev/null
sudo docker rm -f ec21rnc-hub-proxy 2>/dev/null
sudo docker rm -f ec21rnc-certbot 2>/dev/null

echo "=== 2. 임시 nginx 띄우기 (포트 80) ==="
sudo docker run -d --name nginx-temp -p 80:80 -v $DIR/nginx-temp.conf:/etc/nginx/nginx.conf:ro -v $DIR/html:/usr/share/nginx/html:ro -v $DIR/certbot/www:/var/www/certbot:ro nginx:latest

echo "=== 3. 5초 대기 ==="
sleep 5

echo "=== 4. SSL 인증서 발급 ==="
sudo certbot certonly --webroot --webroot-path=$DIR/certbot/www --email $EMAIL --agree-tos --no-eff-email --force-renewal -d $DOMAIN

echo "=== 5. 임시 nginx 정리 ==="
sudo docker rm -f nginx-temp

echo "=== 6. docker compose 올리기 ==="
cd $DIR
sudo docker compose up -d

echo "=== 완료! ==="
