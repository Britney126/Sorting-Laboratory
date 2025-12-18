# 排序算法实验室 - 部署指南

## 本地开发域名访问

### 方法1：修改hosts文件
1. 以管理员身份打开记事本
2. 打开文件：`C:\Windows\System32\drivers\etc\hosts`
3. 添加一行：`127.0.0.1 yourdomain.com`
4. 保存文件
5. 重启浏览器，访问 `http://yourdomain.com:3000`

### 方法2：使用本地DNS
```bash
# 安装dnsmasq（需要WSL或Linux环境）
echo "address=/yourdomain.com/127.0.0.1" >> /etc/dnsmasq.conf
```

## 生产环境部署

### 1. 静态部署（推荐用于简单网站）
适用于：Vercel、Netlify、GitHub Pages、阿里云OSS等

```bash
# 构建生产版本
npm run build

# 本地预览
npm run preview
```

### 2. 服务器部署
适用于：云服务器、VPS等

#### Nginx配置示例
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API代理配置
    location /api/ {
        proxy_pass https://dashscope.aliyuncs.com;
        proxy_set_header Host $host;
        proxy_set_header Authorization "Bearer YOUR_API_KEY";
    }
}
```

#### Apache配置示例
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /path/to/dist
    
    <Directory /path/to/dist>
        AllowOverride All
        Require all granted
    </Directory>
    
    # SPA路由支持
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</VirtualHost>
```

### 3. 容器化部署
创建Dockerfile：
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 环境变量配置

### 生产环境需要设置：
- `VITE_QWEN_API_KEY`: 您的QwenAI API密钥

### 不同平台的设置方式：
- **Vercel**: 在项目设置中添加Environment Variables
- **Netlify**: 在Site settings → Environment variables中添加
- **服务器**: 在nginx/apache配置或系统环境变量中设置

## HTTPS配置
推荐使用Let's Encrypt免费SSL证书：
```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com
```

## 域名解析
在您的域名提供商处添加DNS记录：
- A记录：`yourdomain.com` → 您的服务器IP
- 可选：CNAME记录：`www` → `yourdomain.com`