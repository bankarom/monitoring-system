#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 IMPROX MONITORING SYSTEM: CLEAN VPS DEPLOYMENT"
echo "=========================================================="

# 1. Wipe old PM2 processes
echo "🧹 Wiping old PM2 processes..."
pm2 delete all || true

# 2. Setup directory
APP_DIR="/root/improx-monitor"
mkdir -p $APP_DIR

# 3. Pull latest code from GitHub
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/bankarom/monitoring-system.git $APP_DIR
else
    echo "🔄 Updating existing repository..."
    cd $APP_DIR
    git fetch origin main
    git reset --hard origin/main
fi

cd $APP_DIR

# 4. Backend Setup & Prisma Deploy
echo "⚙️ Setting up Backend API..."
cd $APP_DIR/backend
npm install --production=false
npx prisma generate
npx prisma db push
npm run build

# 5. Frontend Setup & Build
echo "📊 Setting up Frontend Dashboard..."
cd $APP_DIR/frontend
npm install
npm run build

# 6. PM2 Launch
echo "🚀 Launching services via PM2..."
cd $APP_DIR
pm2 start deploy/ecosystem.config.js
pm2 save

# 7. Nginx Setup
echo "🌐 Configuring Nginx reverse proxy..."
cp deploy/nginx.conf /etc/nginx/sites-available/improx-monitor.conf
ln -sf /etc/nginx/sites-available/improx-monitor.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "=========================================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "📡 Admin Web Dashboard: http://200.141.2.53"
echo "🔌 Backend API: http://200.141.2.53:4000"
echo "=========================================================="