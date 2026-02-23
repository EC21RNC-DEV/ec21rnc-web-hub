#!/bin/bash

# 포트 80 대신 8080을 사용한 임시 해결책
DOMAIN="ec21rnc-agent.com"
EMAIL="sean@ec21rnc.com"
PORT="8080"

echo "🚀 포트 8080을 사용한 임시 SSL 설정..."
echo "📧 이메일: $EMAIL"
echo "🌐 도메인: $DOMAIN"
echo "🔌 포트: $PORT"
echo ""

# 1. 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리..."
docker stop simple-test 2>/dev/null && docker rm simple-test 2>/dev/null
docker stop nginx-temp 2>/dev/null && docker rm nginx-temp 2>/dev/null
docker-compose down 2>/dev/null || true

# 2. 포트 8080으로 테스트 서버 시작
echo "🔧 포트 8080으로 테스트 서버 시작..."

cat > nginx-8080.conf << 'EOF'
server {
    listen 80;
    server_name ec21rnc-agent.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 "🎉 포트 8080 테스트 성공! ec21rnc-agent.com:8080 접속 중";
        add_header Content-Type text/plain;
    }
}
EOF

mkdir -p certbot/www

docker run -d \
  --name nginx-8080-test \
  -p 8080:80 \
  -v $(pwd)/nginx-8080.conf:/etc/nginx/conf.d/default.conf \
  -v $(pwd)/certbot/www:/var/www/certbot \
  nginx:alpine

sleep 3

# 3. 테스트
echo "🧪 포트 8080 테스트..."
echo "─────────────────────"

LOCAL_8080=$(curl -s --max-time 5 http://localhost:8080 2>/dev/null || echo "FAILED")
echo "로컬 (localhost:8080): $LOCAL_8080"

DOMAIN_8080=$(curl -s --max-time 5 http://$DOMAIN:8080 2>/dev/null || echo "FAILED")
echo "도메인 ($DOMAIN:8080): $DOMAIN_8080"

IP_8080=$(curl -s --max-time 5 http://203.242.139.254:8080 2>/dev/null || echo "FAILED")
echo "IP (203.242.139.254:8080): $IP_8080"

echo ""

# 4. Host 헤더 테스트
echo "🌐 Host 헤더 테스트 (포트 80 우회)..."
echo "─────────────────────"

# 기존 포트 80 컨테이너가 있다면 사용
if docker ps | grep -q "simple-test"; then
    HOST_TEST=$(curl -s --max-time 5 -H "Host: $DOMAIN" http://203.242.139.254 2>/dev/null || echo "FAILED")
    echo "Host 헤더 테스트: $HOST_TEST"
fi

echo ""

# 5. 결과 분석
echo "📊 결과 분석:"
echo "─────────────────────"

if [[ "$DOMAIN_8080" == *"포트 8080 테스트 성공"* ]]; then
    echo "✅ 포트 8080: 정상 - 네트워크 우회 성공!"
    echo ""
    echo "🎯 해결책:"
    echo "1. 임시로 포트 8080 사용: https://$DOMAIN:8080"
    echo "2. 또는 ISP/네트워크 관리자에게 포트 80 차단 문의"
    echo "3. 또는 CDN(CloudFlare) 사용"
elif [[ "$LOCAL_8080" == *"포트 8080 테스트 성공"* ]]; then
    echo "⚠️ 로컬은 정상, 도메인 접속 실패"
    echo "→ DNS나 방화벽 문제"
else
    echo "❌ 모든 테스트 실패"
    echo "→ 서버 설정 문제"
fi

# 6. 외부 테스트 가이드
echo ""
echo "🌍 외부 테스트 방법:"
echo "─────────────────────"
echo "1. 휴대폰으로 http://$DOMAIN:8080 접속"
echo "2. 다른 네트워크에서 접속"
echo "3. 온라인 도구: https://httpstatus.io/ 에서 http://$DOMAIN:8080 테스트"

# 7. SSL 인증서 발급 (8080 포트로는 불가능하므로 안내만)
echo ""
echo "⚠️ SSL 인증서 관련:"
echo "─────────────────────"
echo "- Let's Encrypt는 포트 80만 지원"
echo "- 포트 80 문제 해결 후 SSL 가능"
echo "- 또는 DNS 검증 방식 사용 필요"

echo ""
echo "🧹 테스트 컨테이너 정리 중..."
docker stop nginx-8080-test && docker rm nginx-8080-test
rm nginx-8080.conf
