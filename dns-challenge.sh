#!/bin/bash

echo "🔐 DNS Challenge로 SSL 인증서 발급"
echo "포트 80 문제를 완전히 우회합니다!"
echo "===================================="
echo ""

DOMAIN="ec21rnc-agent.com"
EMAIL="sean@ec21rnc.com"

# 1. 현재 상황 확인
echo "1️⃣ 현재 상황:"
echo "─────────────────"
echo "도메인: $DOMAIN"
echo "이메일: $EMAIL"
echo "방법: DNS-01 Challenge (포트 80/443 불필요)"
echo ""

# 2. DNS Challenge 설명
echo "2️⃣ DNS Challenge란?"
echo "─────────────────"
echo "• HTTP Challenge: 포트 80에서 파일 확인 (문제 있음)"
echo "• DNS Challenge: DNS TXT 레코드로 도메인 소유권 확인 ✅"
echo "• 장점: 포트 80/443 없어도 SSL 인증서 발급 가능"
echo ""

# 3. 수동 DNS Challenge 방법
echo "3️⃣ 수동 DNS Challenge 진행:"
echo "─────────────────"

# 기존 컨테이너 정리
docker stop nginx-ssl nginx-temp 2>/dev/null || true
docker rm nginx-ssl nginx-temp 2>/dev/null || true

mkdir -p certbot/conf certbot/www

echo "DNS Challenge로 인증서 발급 시작..."
echo ""

# DNS Challenge 실행
docker run --rm -it \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --manual \
  --preferred-challenges dns \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --manual-public-ip-logging-ok \
  -d $DOMAIN

# 결과 확인
echo ""
echo "4️⃣ 인증서 발급 결과 확인:"
echo "─────────────────"

if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "🎉 SSL 인증서 발급 성공!"
    echo ""
    echo "인증서 위치:"
    echo "- 인증서: certbot/conf/live/$DOMAIN/fullchain.pem"
    echo "- 개인키: certbot/conf/live/$DOMAIN/privkey.pem"
    echo ""
    
    # 인증서 정보 확인
    echo "인증서 정보:"
    openssl x509 -in certbot/conf/live/$DOMAIN/fullchain.pem -text -noout | grep -E "(Subject:|Not After)"
    echo ""
    
    echo "5️⃣ 이제 HTTPS 서비스 시작:"
    echo "─────────────────"
    
    # nginx.conf에서 www 제거 (이미 했지만 확실히)
    if [ -f "nginx.conf.backup" ]; then
        echo "기존 백업에서 복원..."
        cp nginx.conf.backup nginx.conf
    fi
    
    # www 제거
    sed -i 's/ www\.ec21rnc-agent\.com//g' nginx.conf
    
    # docker-compose로 최종 서비스 시작
    echo "HTTPS 서비스 시작 중..."
    docker-compose up -d
    
    sleep 10
    
    # HTTPS 테스트
    echo ""
    echo "6️⃣ HTTPS 접속 테스트:"
    echo "─────────────────"
    
    if curl -s --max-time 10 https://$DOMAIN >/dev/null 2>&1; then
        echo "✅ HTTPS 접속 성공!"
        echo ""
        echo "🎉 완료! 다음 URL들을 확인하세요:"
        echo "────────────────────────────"
        echo "🏠 메인: https://$DOMAIN"
        echo "🤖 OpenWeb UI: https://$DOMAIN/openwebui/"
        echo "📰 EMERiCs 뉴스: https://$DOMAIN/emerics-news/"
        echo ""
        echo "✅ 모든 웹앱이 HTTPS로 보안 접속됩니다!"
    else
        echo "⚠️ HTTPS 접속 테스트 실패"
        echo "컨테이너 상태 확인:"
        docker-compose ps
        echo ""
        echo "nginx 로그:"
        docker-compose logs nginx | tail -10
    fi
    
else
    echo "❌ SSL 인증서 발급 실패"
    echo ""
    echo "가능한 원인:"
    echo "1. DNS TXT 레코드 설정 오류"
    echo "2. DNS 전파 지연"
    echo "3. 도메인 소유권 확인 실패"
    echo ""
    echo "해결 방법:"
    echo "1. 가비아에서 TXT 레코드 정확히 설정했는지 확인"
    echo "2. DNS 전파 확인: https://dnschecker.org"
    echo "3. 몇 분 후 다시 시도"
fi
