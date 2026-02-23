#!/bin/bash

# =================================================================
# SSL 인증서 초기 발급 스크립트
# =================================================================

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 도메인 설정 (실제 도메인으로 변경하세요)
DOMAIN="ec21rnc-agent.com"
EMAIL="sean@ec21rnc.com"  # 실제 이메일로 변경하세요

echo -e "${GREEN}=== SSL 인증서 초기 발급 시작 ===${NC}"

# 1. 필요한 디렉토리 생성
echo -e "${YELLOW}1. 필요한 디렉토리 생성...${NC}"
mkdir -p ./certbot/www
mkdir -p ./html

# 2. 기본 HTML 페이지 생성 (없는 경우)
if [ ! -f "./html/index.html" ]; then
    echo -e "${YELLOW}2. 기본 HTML 페이지 생성...${NC}"
    cat > ./html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>EC21RNC Agent Hub</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>EC21RNC Agent Hub</h1>
    <p>서비스가 준비되었습니다.</p>
</body>
</html>
EOF
fi

# 3. 임시 nginx 설정으로 HTTP 서버만 실행
echo -e "${YELLOW}3. 임시 HTTP 서버 설정...${NC}"
cat > ./nginx-temp.conf << EOF
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name ${DOMAIN};

        location ~ /.well-known/acme-challenge/ {
            allow all;
            root /var/www/certbot;
        }

        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
}
EOF

# 4. 임시 docker-compose로 HTTP 서버 실행
echo -e "${YELLOW}4. 임시 HTTP 서버 실행...${NC}"
cat > ./docker-compose-temp.yml << EOF
version: '3.8'
services:
  nginx-temp:
    image: nginx:latest
    container_name: nginx-temp
    ports:
      - "80:80"
    volumes:
      - ./nginx-temp.conf:/etc/nginx/nginx.conf:ro
      - ./html:/usr/share/nginx/html:ro
      - ./certbot/www:/var/www/certbot:ro
EOF

docker-compose -f docker-compose-temp.yml up -d

# 5. SSL 인증서 발급
echo -e "${YELLOW}5. SSL 인증서 발급 중...${NC}"
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email ${EMAIL} \
  --agree-tos \
  --no-eff-email \
  --domains ${DOMAIN}

# 6. 임시 컨테이너 정리
echo -e "${YELLOW}6. 임시 설정 정리...${NC}"
docker-compose -f docker-compose-temp.yml down
rm nginx-temp.conf docker-compose-temp.yml

# 7. 최종 설정으로 실행
echo -e "${YELLOW}7. 최종 설정으로 서비스 실행...${NC}"
docker-compose up -d

echo -e "${GREEN}=== SSL 인증서 발급 완료! ===${NC}"
echo -e "${GREEN}HTTPS://${DOMAIN} 으로 접속 가능합니다.${NC}"
echo -e "${YELLOW}참고: certbot은 자동으로 12시간마다 인증서 갱신을 확인합니다.${NC}"
