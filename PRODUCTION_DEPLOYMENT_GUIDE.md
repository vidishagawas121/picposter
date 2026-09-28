# 🚀 PicPoster Production Deployment Guide (PuTTY / Linux VPS)
**Target Domain:** `https://picposter.fouriseindia.com`

---

## 📋 Architecture Overview
- **Domain:** `picposter.fouriseindia.com`
- **Reverse Proxy & Web Server:** Nginx (ports 80/443 with Let's Encrypt SSL)
- **Frontend Dashboard:** React + Vite SPA (compiled to `/var/www/picposter/frontend/dist` and served statically by Nginx)
- **Backend API:** Node.js Express (managed on port 5000 by PM2 cluster mode)
- **Database:** MongoDB Atlas (Mongoose connection pool & auto-reconnect)
- **SMS Gateway:** Fast2SMS (OTP & SMS notifications)

---

## 🖥️ Complete Step-by-Step VPS Deployment via PuTTY

### 1. Connect via PuTTY
1. Enter your **VPS Public IP Address** in PuTTY under *Host Name*.
2. Port: `22` (SSH).
3. Log in as `root` (or your sudo user).

---

### 2. Prepare the Server
Run the system setup script to install Node.js 20, PM2, Nginx, Certbot, and image processing libraries:
```bash
# Update and install system dependencies
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw build-essential libvips-dev nginx certbot python3-certbot-nginx

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 process manager
sudo npm install -g pm2

# Configure Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

### 3. Clone the Codebase
```bash
cd /var/www
sudo git clone https://github.com/vidishagawas121/picposter.git picposter
sudo chown -R $USER:$USER /var/www/picposter
cd /var/www/picposter
```

---

### 4. Create Production Environment Configuration
Create the `backend/.env` file:
```bash
nano backend/.env
```

Paste your production secrets:
```env
PORT=5000
NODE_ENV=production
API_BASE_URL=https://picposter.fouriseindia.com
TRUST_PROXY=1

MONGO_URI=mongodb+srv://fouriseindia3_db_user:9PdnocaRKTcm59Kb@cluster0.ep0jvpf.mongodb.net/picposter_db?retryWrites=true&w=majority&appName=Cluster0
DNS_SERVERS=8.8.8.8,1.1.1.1

JWT_ACCESS_SECRET=picposter_super_secret_jwt_access_key_2026
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=picposter_super_secret_jwt_refresh_key_2026
JWT_REFRESH_EXPIRY=30d

CORS_ORIGIN=https://picposter.fouriseindia.com
CORS_ALLOWED_ORIGINS=https://picposter.fouriseindia.com

SMS_PROVIDER=FAST2SMS
FAST2SMS_API_KEY=fOJXfUd3gle5WND07GxznTc8VLsfD5cNfk43s6fdivbvZOBSN8uSJ7sjrprv
FAST2SMS_API_URL=https://www.fast2sms.com/dev/bulkV2
FAST2SMS_OTP_ID=45f33d9f8a
FAST2SMS_ENTITY_ID=1201178894876676977
SMS_SENDER_ID=FOURIS

ADMIN_MOBILES=+919876543210
LOG_LEVEL=info
```
*(Save with `Ctrl + O`, `Enter`, exit with `Ctrl + X`)*

---

### 5. Build & Launch Application
Run the deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

Ensure PM2 auto-starts on VPS reboots:
```bash
pm2 save
pm2 startup
```

---

### 6. Configure Nginx & Let's Encrypt SSL
1. Link Nginx site configuration:
```bash
sudo cp /var/www/picposter/nginx/picposter.conf /etc/nginx/sites-available/picposter.conf
sudo ln -s /etc/nginx/sites-available/picposter.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

2. Point DNS:
   - Ensure `picposter.fouriseindia.com` (A record) points to your VPS IP.

3. Issue free SSL Certificate with Certbot:
```bash
sudo certbot --nginx -d picposter.fouriseindia.com
```

---

## 🔄 Deploying Future Code Updates
Whenever you push changes to GitHub, run this single command in PuTTY:
```bash
cd /var/www/picposter && ./deploy.sh
```
*`deploy.sh` automatically pulls code, builds frontend assets, installs packages, and reloads PM2 with zero downtime.*

---

## 📊 Monitoring & Useful PM2 Commands

| Command | Description |
|---|---|
| `pm2 logs picposter-backend` | View live server logs & request history |
| `pm2 status` | Check status of backend instances |
| `pm2 monit` | Real-time terminal CPU/Memory monitor |
| `pm2 reload picposter-backend` | Graceful zero-downtime reload |
| `pm2 restart picposter-backend` | Hard restart |
