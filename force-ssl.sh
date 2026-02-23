#!/bin/bash

echo "🔥 포트 80 강제 해제 및 SSL 인증서 발급"
echo "=========================================="
echo ""

# 1. 현재 문제 확인
echo "1️⃣ 현재 포트 80 상태 확인:"
echo "─────────────────────────"
echo "netstat 결과:"
sudo netstat -tlnp | grep :80 || echo "netstat에서 포트 80 없음"
echo ""
echo "ss 결과:"
sudo ss -tlnp | grep :80 || echo "ss에서 포트 80 없음"
echo ""
echo "fuser 결과:"
sudo fuser 80/tcp 2>/dev/null || echo "fuser에서 포트 80 없음"
echo ""

# 2. 현재 도메인 응답 확인
echo "2️⃣ 현재 도메인 응답:"
echo "─────────────────────────"
curl -s http://ec21rnc-agent.com | head -5
echo ""

# 3. 기존 컨테이너 완전 정리
echo "3️⃣ 기존 컨테이너 정리:"
echo "─────────────────────────"
docker stop nginx-temp nginx-test ec21rnc-nginx 2>/dev/null || true
docker rm nginx-temp nginx-test ec21rnc-nginx 2>/dev/null || true
docker-compose down 2>/dev/null || true
echo "컨테이너 정리 완료"
echo ""

# 4. 포트 80 강제 해제
echo "4️⃣ 포트 80 강제 해제:"
echo "─────────────────────────"
echo "포트 80을 사용하는 모든 프로세스 강제 종료..."
sudo fuser -k 80/tcp 2>/dev/null || echo "종료할 프로세스 없음"

# 잠시 대기
sleep 3

# 5. 포트 80 재확인
echo ""
echo "5️⃣ 포트 80 해제 확인:"
echo "─────────────────────────"
if sudo netstat -tlnp | grep :80; then
    echo "❌ 여전히 포트 80이 사용 중!"
    echo "수동으로 프로세스를 찾아 종료해야 합니다."
    exit 1
else
    echo "✅ 포트 80이 완전히 비었습니다!"
fi

# 6. 즉시 nginx 컨테이너 시작
echo ""
echo "6️⃣ 즉시 Nginx 컨테이너 시작:"
echo "─────────────────────────"

cat > quick-nginx.conf << 'EOF'
server {
    listen 80;
    server_name ec21rnc-agent.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri $uri/ =404;
    }
    
    location / {
        return 200 "Nginx OK - Ready for SSL";
        add_header Content-Type text/plain;
    }
}
EOF

mkdir -p certbot/www

# nginx 컨테이너 즉시 시작 (다른 서비스가 포트를 점유하기 전에)
docker run -d \
  --name nginx-ssl \
  -p 80:80 \
  --restart=unless-stopped \
  -v $(pwd)/quick-nginx.conf:/etc/nginx/conf.d/default.conf \
  -v $(pwd)/certbot/www:/var/www/certbot \
  nginx:alpine

# 잠시 대기
sleep 5

# 7. 접속 테스트
echo ""
echo "7️⃣ 접속 테스트:"
echo "─────────────────────────"

LOCAL_TEST=$(curl -s --max-time 5 http://localhost 2>/dev/null || echo "FAILED")
echo "로컬: $LOCAL_TEST"

DOMAIN_TEST=$(curl -s --max-time 5 http://ec21rnc-agent.com 2>/dev/null || echo "FAILED")  
echo "도메인: $DOMAIN_TEST"

# 8. ACME Challenge 테스트
echo ""
echo "8️⃣ ACME Challenge 경로 테스트:"
echo "─────────────────────────"

# 테스트 파일 생성
echo "test-acme-challenge" > certbot/www/test-file
ACME_TEST=$(curl -s --max-time 5 http://ec21rnc-agent.com/.well-known/acme-challenge/test-file 2>/dev/null || echo "FAILED")
echo "ACME 경로: $ACME_TEST"
rm -f certbot/www/test-file

# 9. SSL 인증서 발급
if [[ "$DOMAIN_TEST" == *"Nginx OK"* && "$ACME_TEST" == "test-acme-challenge" ]]; then
    echo ""
    echo "🎉 모든 테스트 통과! SSL 인증서 발급 시작..."
    echo "─────────────────────────"
    
    docker run --rm \
      -v $(pwd)/certbot/conf:/etc/letsencrypt \
      -v $(pwd)/certbot/www:/var/www/certbot \
      certbot/certbot certonly \
      --webroot \
      --webroot-path=/var/www/certbot \
      --email sean@ec21rnc.com \
      --agree-tos \
      --no-eff-email \
      --verbose \
      -d ec21rnc-agent.com
    
    # 결과 확인
    if [ -f "certbot/conf/live/ec21rnc-agent.com/fullchain.pem" ]; then
        echo ""
        echo "🎉 SSL 인증서 발급 성공!"
        echo "이제 최종 설정을 진행합니다..."
        
        # 임시 컨테이너 정리
        docker stop nginx-ssl && docker rm nginx-ssl
        rm quick-nginx.conf
        
        # 최종 docker-compose 실행
        docker-compose up -d
        
        echo "✅ HTTPS 서비스 시작 완료!"
        echo "🌐 https://ec21rnc-agent.com 에서 확인하세요."
    else
        echo "❌ SSL 인증서 발급 실패"
        docker logs nginx-ssl
    fi
else
    echo ""
    echo "❌ 테스트 실패!"
    echo "nginx 컨테이너 로그:"
    docker logs nginx-ssl
    echo ""
    echo "다른 웹서버가 여전히 간섭하고 있습니다."
fi
