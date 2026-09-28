#!/bin/bash
# ==============================================================================
# PicPoster Initial VPS Setup Script (Ubuntu 20.04 / 22.04 / 24.04 LTS)
# Installs Node.js 20 LTS, Nginx, PM2, Certbot, and configures UFW firewall
# Run as root or with sudo: sudo bash setup-vps.sh
# ==============================================================================

set -e

echo "══════════════════════════════════════════════════════════════"
echo "  🚀 PicPoster VPS Environment Initializer"
echo "══════════════════════════════════════════════════════════════"

# 1. Update system packages
echo "📦 Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git ufw build-essential libvips-dev

# 2. Install Node.js 20.x LTS
echo "📦 Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# 3. Install PM2 process manager
echo "📦 Installing PM2..."
npm install -g pm2
pm2 startup systemd -u $(logname 2>/dev/null || echo $SUDO_USER || echo "root") --hp /home/$(logname 2>/dev/null || echo $SUDO_USER || echo "root") || true

# 4. Install Nginx & Certbot
echo "📦 Installing Nginx & Certbot..."
apt-get install -y nginx certbot python3-certbot-nginx

# 5. Configure UFW Firewall
echo "🛡️ Configuring Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "✅ VPS base installation complete!"
echo "Next steps:"
echo "1. Clone your repository to /var/www/picposter"
echo "2. Copy backend/.env.example to backend/.env and configure secrets"
echo "3. Copy nginx/picposter.conf to /etc/nginx/sites-available/picposter.conf and update domain"
echo "4. Run 'sudo certbot --nginx -d yourdomain.com' to provision free SSL"
echo "5. Run './deploy.sh' to build and start the application"
