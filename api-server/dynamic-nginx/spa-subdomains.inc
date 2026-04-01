# Auto-generated subdomain server blocks

# openwebui → openwebui.ec21rnc-agent.com → 172.17.0.1:8598
server {
    listen 443 ssl http2;
    server_name openwebui.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8598/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# emerics-news → emerics-news.ec21rnc-agent.com → 172.17.0.1:8501
server {
    listen 443 ssl http2;
    server_name emerics-news.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8501/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# emerics-opinion → emerics-opinion.ec21rnc-agent.com → 172.17.0.1:8519
server {
    listen 443 ssl http2;
    server_name emerics-opinion.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8519/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# emerics-monthly → emerics-monthly.ec21rnc-agent.com → 172.17.0.1:8533
server {
    listen 443 ssl http2;
    server_name emerics-monthly.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8533/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# emerics-trend → emerics-trend.ec21rnc-agent.com → 172.17.0.1:8555
server {
    listen 443 ssl http2;
    server_name emerics-trend.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8555/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# aif-newsletter → aif-newsletter.ec21rnc-agent.com → app_newsletter:8503
server {
    listen 443 ssl http2;
    server_name aif-newsletter.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://app_newsletter:8503/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# emerics-inspection → emerics-inspection.ec21rnc-agent.com → emerics-inspection-app:8542
server {
    listen 443 ssl http2;
    server_name emerics-inspection.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://emerics-inspection-app:8542/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# gip-daily → gip-daily.ec21rnc-agent.com → 172.17.0.1:8525
server {
    listen 443 ssl http2;
    server_name gip-daily.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8525/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# nuclear-bid → nuclear-bid.ec21rnc-agent.com → 172.17.0.1:8513
server {
    listen 443 ssl http2;
    server_name nuclear-bid.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8513/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# globecorpo-auto → globecorpo-auto.ec21rnc-agent.com → 172.17.0.1:8509
server {
    listen 443 ssl http2;
    server_name globecorpo-auto.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8509/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# cifc-issues → cifc-issues.ec21rnc-agent.com → 172.17.0.1:8540
server {
    listen 443 ssl http2;
    server_name cifc-issues.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8540/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# cifc-bidding → cifc-bidding.ec21rnc-agent.com → 172.17.0.1:8541
server {
    listen 443 ssl http2;
    server_name cifc-bidding.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8541/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# agri-export → agri-export.ec21rnc-agent.com → 172.17.0.1:8518
server {
    listen 443 ssl http2;
    server_name agri-export.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8518/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# issue-clustering → issue-clustering.ec21rnc-agent.com → app_issue_curation:8591
server {
    listen 443 ssl http2;
    server_name issue-clustering.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://app_issue_curation:8591/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# csf-tools → csf-tools.ec21rnc-agent.com → 172.17.0.1:8508
server {
    listen 443 ssl http2;
    server_name csf-tools.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8508/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# ai-tools → ai-tools.ec21rnc-agent.com → 172.17.0.1:8515
server {
    listen 443 ssl http2;
    server_name ai-tools.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8515/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# interview-translator → interview-translator.ec21rnc-agent.com → 172.17.0.1:8504
server {
    listen 443 ssl http2;
    server_name interview-translator.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8504/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# report-verification → report-verification.ec21rnc-agent.com → 172.17.0.1:8590
server {
    listen 443 ssl http2;
    server_name report-verification.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8590/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# article-extractor → article-extractor.ec21rnc-agent.com → 172.17.0.1:8592
server {
    listen 443 ssl http2;
    server_name article-extractor.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8592/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# prompt-hub → prompt-hub.ec21rnc-agent.com → 172.17.0.1:8599
server {
    listen 443 ssl http2;
    server_name prompt-hub.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8599/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# pdf-converter → pdf-converter.ec21rnc-agent.com → app_pdf_to_html:8593
server {
    listen 443 ssl http2;
    server_name pdf-converter.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://app_pdf_to_html:8593/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# agri-custom-market → agri-custom-market.ec21rnc-agent.com → 172.17.0.1:8511
server {
    listen 443 ssl http2;
    server_name agri-custom-market.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8511/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# agri-custom-compete → agri-custom-compete.ec21rnc-agent.com → 172.17.0.1:8514
server {
    listen 443 ssl http2;
    server_name agri-custom-compete.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8514/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# pet-market → pet-market.ec21rnc-agent.com → 172.17.0.1:8522
server {
    listen 443 ssl http2;
    server_name pet-market.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8522/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# pet-compete → pet-compete.ec21rnc-agent.com → 172.17.0.1:8524
server {
    listen 443 ssl http2;
    server_name pet-compete.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8524/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# kocca-law → kocca-law.ec21rnc-agent.com → 172.17.0.1:8516
server {
    listen 443 ssl http2;
    server_name kocca-law.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8516/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# kocca-content → kocca-content.ec21rnc-agent.com → 172.17.0.1:8517
server {
    listen 443 ssl http2;
    server_name kocca-content.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8517/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# kocca-overseas → kocca-overseas.ec21rnc-agent.com → 172.17.0.1:8520
server {
    listen 443 ssl http2;
    server_name kocca-overseas.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8520/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# kocca-domestic → kocca-domestic.ec21rnc-agent.com → 172.17.0.1:8521
server {
    listen 443 ssl http2;
    server_name kocca-domestic.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8521/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# ㅇㅇㅇㅇ → ㅇㅇㅇㅇ.ec21rnc-agent.com → 172.17.0.1:8530
server {
    listen 443 ssl http2;
    server_name ㅇㅇㅇㅇ.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8530/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# sdada → sdada.ec21rnc-agent.com → 172.17.0.1:8511
server {
    listen 443 ssl http2;
    server_name sdada.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:8511/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# ㅌㅀㅌㅌ → ㅌㅀㅌㅀㅌ.ec21rnc-agent.com → 172.17.0.1:7777
server {
    listen 443 ssl http2;
    server_name ㅌㅀㅌㅀㅌ.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:7777/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}

# vhjghg → ghuujghjg.ec21rnc-agent.com → 172.17.0.1:5555
server {
    listen 443 ssl http2;
    server_name ghuujghjg.ec21rnc-agent.com;

    ssl_certificate /etc/letsencrypt/live/ec21rnc-agent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec21rnc-agent.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://172.17.0.1:5555/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
}
