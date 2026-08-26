#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 IMPROX MONITORING SYSTEM: CLEAN VPS DEPLOYMENT"
echo "=========================================================="

APP_DIR="/root/improx-monitor"
cd $APP_DIR

# 1. Open Firewall Ports
echo "🛡️ Configuring Firewall Ports (80, 443, 4000, 5000)..."
which ufw && ufw allow 80/tcp || true
which ufw && ufw allow 443/tcp || true
which ufw && ufw allow 4000/tcp || true
which ufw && ufw allow 5000/tcp || true
which ufw && ufw reload || true
iptables -I INPUT -p tcp --dport 80 -j ACCEPT || true
iptables -I INPUT -p tcp --dport 443 -j ACCEPT || true
iptables -I INPUT -p tcp --dport 4000 -j ACCEPT || true
iptables -I INPUT -p tcp --dport 5000 -j ACCEPT || true

# 2. Grant Nginx read permissions on /root
chmod 755 /root
chmod -R 755 $APP_DIR

# 3. Ensure PostgreSQL is active
echo "🐘 Configuring PostgreSQL database..."
apt-get update -y
apt-get install -y postgresql postgresql-contrib nginx
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" || true
sudo -u postgres psql -c "CREATE DATABASE improx_monitor;" || true

# 4. Backend Setup & Prisma
echo "⚙️ Setting up Backend API..."
cd $APP_DIR/backend

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

mkdir -p $APP_DIR/backend/uploads/screenshots
chmod -R 777 $APP_DIR/backend/uploads

npm install --production=false
npx prisma generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/improx_monitor?schema=public" npx prisma db push --accept-data-loss
npm run build

# 5. Frontend Setup
echo "📊 Setting up Frontend Dashboard..."
cd $APP_DIR/frontend
npm install
npm run build
chmod -R 755 $APP_DIR/frontend/dist

# 6. PM2 Launch
echo "🚀 Launching backend via PM2..."
cd $APP_DIR
pm2 delete all || true
pm2 start deploy/ecosystem.config.js
pm2 save

# 7. Nginx Setup
echo "🌐 Configuring Nginx reverse proxy..."
cp deploy/nginx.conf /etc/nginx/sites-available/improx-monitor.conf
ln -sf /etc/nginx/sites-available/improx-monitor.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "=========================================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "📡 Admin Web Dashboard: http://200.141.2.53"
echo "🔌 Backend API: http://200.141.2.53:4000"
echo "🔑 Default Admin: admin@improx.com / Admin@123456"
echo "=========================================================="