#!/bin/bash

echo "🕵️ 네트워크 라우팅 문제 진단"
echo "==============================="
echo ""

# 1. 서버 환경 확인
echo "1️⃣ 서버 환경 정보:"
echo "─────────────────────"
echo "OS: $(lsb_release -d 2>/dev/null | cut -f2 || uname -s)"
echo "Kernel: $(uname -r)"
echo "Hostname: $(hostname)"
echo "IP Address: $(ip route get 1.1.1.1 | grep -oP 'src \K\S+')"
echo ""

# 2. 네트워크 인터페이스 확인
echo "2️⃣ 네트워크 인터페이스:"
echo "─────────────────────"
ip addr show | grep -E "(inet |inet6)"
echo ""

# 3. 라우팅 테이블 확인
echo "3️⃣ 라우팅 테이블:"
echo "─────────────────────"
ip route
echo ""

# 4. iptables 규칙 확인
echo "4️⃣ iptables NAT 규칙:"
echo "─────────────────────"
sudo iptables -t nat -L -n | head -20
echo ""

# 5. Docker 네트워크 확인
echo "5️⃣ Docker 네트워크:"
echo "─────────────────────"
docker network ls
echo ""
echo "Docker0 interface:"
ip addr show docker0 2>/dev/null || echo "docker0 없음"
echo ""

# 6. 프로세스 상세 분석
echo "6️⃣ 웹서버 관련 프로세스:"
echo "─────────────────────"
ps aux | grep -E "(nginx|apache|httpd|lighttpd|caddy)" | grep -v grep
echo ""

# 7. 시스템 서비스 확인
echo "7️⃣ 웹서버 시스템 서비스:"
echo "─────────────────────"
systemctl list-units --type=service --state=active | grep -E "(web|http|nginx|apache)"
echo ""

# 8. 포트 리스닝 상세 분석
echo "8️⃣ 모든 리스닝 포트:"
echo "─────────────────────"
sudo ss -tulpn | grep LISTEN | head -20
echo ""

# 9. 클라우드/가상화 환경 확인
echo "9️⃣ 클라우드 환경 확인:"
echo "─────────────────────"
if [ -f /sys/hypervisor/uuid ]; then
    echo "가상화 환경: $(cat /sys/hypervisor/uuid)"
elif [ -d /proc/xen ]; then
    echo "Xen 가상화 환경"
elif grep -q "Microsoft" /proc/version 2>/dev/null; then
    echo "WSL 환경"
elif curl -s --max-time 2 169.254.169.254/latest/meta-data/ > /dev/null 2>&1; then
    echo "AWS EC2 환경"
elif curl -s --max-time 2 metadata.google.internal > /dev/null 2>&1; then
    echo "Google Cloud 환경"
else
    echo "물리 서버 또는 미확인 환경"
fi
echo ""

# 10. 외부 접속 테스트 (다양한 방법)
echo "🔟 외부 접속 테스트:"
echo "─────────────────────"

echo "a) 로컬호스트 테스트:"
curl -s --max-time 3 http://localhost 2>/dev/null | head -3 || echo "연결 실패"

echo ""
echo "b) 내부 IP 테스트:"
INTERNAL_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+')
curl -s --max-time 3 http://$INTERNAL_IP 2>/dev/null | head -3 || echo "연결 실패"

echo ""
echo "c) 도메인 테스트:"
curl -s --max-time 3 http://ec21rnc-agent.com 2>/dev/null | head -3 || echo "연결 실패"

echo ""
echo "d) 직접 IP 테스트:"
curl -s --max-time 3 http://203.242.139.254 2>/dev/null | head -3 || echo "연결 실패"

echo ""

# 11. 특수 포트 테스트
echo "1️⃣1️⃣ 다른 포트로 nginx 테스트:"
echo "─────────────────────"

# 포트 8080으로 임시 nginx 실행
cat > test-8080.conf << 'EOF'
server {
    listen 8080;
    server_name _;
    
    location / {
        return 200 "Port 8080 Test OK";
        add_header Content-Type text/plain;
    }
}
EOF

docker run -d --name nginx-8080-test -p 8080:8080 \
  -v $(pwd)/test-8080.conf:/etc/nginx/conf.d/default.conf \
  nginx:alpine

sleep 3

echo "포트 8080 테스트:"
curl -s --max-time 3 http://localhost:8080 || echo "8080 실패"
curl -s --max-time 3 http://ec21rnc-agent.com:8080 || echo "8080 도메인 실패"

# 정리
docker stop nginx-8080-test && docker rm nginx-8080-test
rm test-8080.conf

echo ""

# 12. 문제 진단 결과
echo "🎯 문제 진단 결과:"
echo "─────────────────────"

LOCAL_FAIL=$(curl -s --max-time 3 http://localhost 2>/dev/null || echo "FAIL")
DOMAIN_SUCCESS=$(curl -s --max-time 3 http://ec21rnc-agent.com 2>/dev/null || echo "FAIL")

if [[ "$LOCAL_FAIL" == "FAIL" && "$DOMAIN_SUCCESS" != "FAIL" ]]; then
    echo "🔍 문제 유형: 외부 라우팅/프록시 문제"
    echo ""
    echo "가능한 원인:"
    echo "1. 🌐 클라우드 로드밸런서 (ALB, GLB 등)"
    echo "2. 🛡️ 방화벽/프록시 서버"
    echo "3. 📡 ISP 레벨 포트 포워딩"
    echo "4. 🔄 리버스 프록시 설정"
    echo ""
    echo "해결 방안:"
    echo "A) DNS Challenge로 SSL 인증서 발급"
    echo "B) 다른 포트(8080) 사용 후 포트포워딩"
    echo "C) 클라우드 설정 확인"
elif [[ "$LOCAL_FAIL" == "FAIL" && "$DOMAIN_SUCCESS" == "FAIL" ]]; then
    echo "🔍 문제 유형: 포트 80 완전 차단"
    echo ""
    echo "해결 방안: 방화벽 설정 재확인"
else
    echo "🔍 문제 유형: 기타"
fi

echo ""
echo "💡 추천 해결책:"
echo "1. DNS Challenge 사용 (포트 80 불필요)"
echo "2. 포트 8080 + 포트포워딩"
echo "3. 클라우드 인프라 설정 확인"
