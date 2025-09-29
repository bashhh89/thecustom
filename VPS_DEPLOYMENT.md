# VPS Deployment Guide - SOW Workbench

This guide will help you deploy the SOW Workbench application on a VPS for production use.

## Prerequisites

- **VPS Server** (Ubuntu 20.04+ recommended)
- **Domain Name** (pointed to your VPS IP)
- **SSH Access** to your VPS
- **PostgreSQL** database (local or hosted)
- **SSL Certificate** (Let's Encrypt for free)

## 1. Server Setup

### Install Node.js and pnpm

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm
```

### Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE sow_workbench_prod;
CREATE USER your_db_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sow_workbench_prod TO your_db_user;
\q
```

### Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Install nginx (Reverse Proxy)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## 2. Application Setup

### Clone and Setup

```bash
# Clone your repository
git clone your-repo-url
cd sow-workbench

# Install dependencies
pnpm install

# Build the application
pnpm build
```

### Configure Environment Variables

#### Edit API Production Environment

```bash
nano apps/api/.env.production
```

Update with your actual values:
```env
DATABASE_URL="postgresql://your_db_user:your_secure_password@localhost:5432/sow_workbench_prod"
OPENROUTER_API_KEY="your-openrouter-api-key"
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

#### Edit Frontend Production Environment

```bash
nano apps/web/.env.production
```

Update with your actual values:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=http://localhost:8080
NODE_ENV=production
```

#### Configure PM2

Edit the PM2 ecosystem file:
```bash
nano ecosystem.production.config.js
```

Update with your VPS details:
```javascript
module.exports = {
  apps: [
    // ... config
  ],
  deploy: {
    production: {
      user: 'your-server-user',
      host: 'your-vps-ip-or-domain',
      // ... update paths and repo URL
    }
  }
};
```

## 3. Nginx Configuration

Create nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/sow-workbench
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (from Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/sow-workbench /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Database Migration

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Seed the database (optional)
pnpx --filter db seed
```

## 5. Start the Application

```bash
# Start with PM2
pm2 start ecosystem.production.config.js --env production

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your-user --hp /home/your-user
```

## 6. Monitoring & Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status

# PM2 logs
pm2 logs sow-workbench-api
pm2 logs sow-workbench-web

# Restart applications
pm2 restart sow-workbench-api
pm2 restart sow-workbench-web
```

### Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS, PostgreSQL
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432/tcp  # If PostgreSQL needs external access
sudo ufw --force enable
```

### Updates and Backups

Create a backup script:

```bash
# Create backup directory
mkdir ~/backups

# Backup database
pg_dump -U your_db_user -h localhost sow_workbench_prod > ~/backups/sow_workbench_$(date +%Y%m%d_%H%M%S).sql

# Backup application data
tar -czf ~/backups/app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/your/app
```

## 7. Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 8080, 80, 443 are available
2. **Database connection**: Check DATABASE_URL and PostgreSQL user permissions
3. **SSL issues**: Ensure firewall allows HTTPS traffic
4. **Memory issues**: Monitor with `pm2 monit` and adjust memory limits

### Logs Location

- **Application logs**: `./logs/` directory
- **Nginx logs**: `/var/log/nginx/`
- **PostgreSQL logs**: `/var/log/postgresql/`
- **PM2 logs**: `~/.pm2/logs/`

## 8. Production Features Enabled

- **Process Management**: PM2 automatic restarts
- **SSL/TLS**: Let's Encrypt certificates
- **Reverse Proxy**: Nginx for performance and security
- **Compression**: Gzipped responses
- **Security Headers**: XSS protection, content security policy
- **Database Persistence**: All data stored in PostgreSQL
- **Automatic Backups**: Database and application backups

## 9. Final Steps

1. **Update DNS**: Point your domain to VPS IP
2. **Test Application**: Access https://yourdomain.com
3. **Monitor**: Set up system monitoring and alerts
4. **Backups**: Schedule regular database backups
5. **Update SSL**: Auto-renew with `certbot renew`

Your SOW Workbench is now production-ready and persistent! 🚀
