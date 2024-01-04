
## 1. 安装

```bash
sudo apt-get install nginx
```

## 2. 配置

```bash
sudo nano /etc/nginx/nginx.conf
```

```bash
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
events {
    worker_connections 768;
    # multi_accept on;
}
http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" ' '$status $body_bytes_sent "$http_referer"''$http_user_agent" "$http_x_forwarded_for"';
    access_log  /var/log/nginx/access.log  main;
    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;
    # server_tokens off;
    # server_names_hash_bucket_size 64;
    # server_name_in_redirect off;
    include /etc/nginx/mime.types;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
    include /etc/nginx/snippets/*;
    gzip on;
}
```

## 3. 启动

```bash
sudo service nginx start
```

## 4. 停止

```bash
sudo service nginx stop
```

## 5. 重启

```bash
sudo service nginx restart
```

## 6. 状态

```bash
sudo service nginx status
```

## 7. 重载

```bash
sudo service nginx reload
```

## 8. 验证

```bash
curl -I localhost
```

## 9. 访问

```bash
http://localhost