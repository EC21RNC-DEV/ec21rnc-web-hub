#!/bin/bash

# EC21RNC Agent SSL 인증서 설정 스크립트 (DNS 인증 방식)

DOMAIN="ec21rnc-agent.com"
EMAIL="sean@ec21rnc.com" # 실제 이메일로 수정

echo "🚀 DNS 인증 방식으로 HTTPS 설정을 시작합니다..."
echo "📧 사용할 이메일: $EMAIL"
echo "🌐 도메인: *.$DOMAIN 및 $DOMAIN"
echo ""

# 1. Certbot 실행 (수동 DNS 인증)
echo "🔐 SSL 인증서 발급을 시도합니다. 화면의 안내를 따라주세요."
echo "   잠시 후 DNS에 추가해야 할 TXT 레코드가 표시됩니다."
echo ""
sleep 3

sudo certbot certonly \
  --manual \
  --preferred-challenges=dns \
  --email "$EMAIL" \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --agree-tos \
  -d "$DOMAIN" \
  -d "*.$DOMAIN"

# 2. 결과 확인 및 안내
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo ""
    echo "🎉 SSL 인증서 발급 성공!"
    echo "   이제 docker-compose.yml 파일의 주석을 풀고 Nginx를 시작하세요."
    echo ""
    echo "   1. /home/gpuadmin/ec21rnc-web-hub/docker-compose.yml 열기"
    echo "   2. 'services.proxy' 섹션의 주석 해제"
    echo "   3. 'volumes'에서 '/etc/letsencrypt:/etc/letsencrypt:ro' 주석 해제"
    echo "   4. 터미널에서 'docker-compose up -d' 실행"
    echo ""
else
    echo ""
    echo "❌ SSL 인증서 발급 실패."
    echo "   DNS TXT 레코드 설정이 올바른지 확인 후 다시 시도해주세요."
fi
