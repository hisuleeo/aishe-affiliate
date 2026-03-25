#!/bin/bash
set -e

echo "🚀 Frontend deployment başlıyor..."

# Build
echo "📦 Building frontend..."
cd /Users/apple/Downloads/referal/frontend
npm run build

# Deploy .next folder
echo "📤 Deploying .next to EC2..."
rsync -avz --delete -e "ssh -i ~/Downloads/Ainen3435.pem" \
  /Users/apple/Downloads/referal/frontend/.next/ \
  ec2-user@54.81.59.13:~/aishe-affiliate/frontend/.next/

# Copy public folder to standalone
echo "📁 Copying public folder to standalone..."
ssh -i ~/Downloads/Ainen3435.pem ec2-user@54.81.59.13 \
  'cp -r aishe-affiliate/frontend/public aishe-affiliate/frontend/.next/standalone/frontend/'

# Copy static folder to standalone
echo "📁 Copying static folder to standalone..."
ssh -i ~/Downloads/Ainen3435.pem ec2-user@54.81.59.13 \
  'cp -r aishe-affiliate/frontend/.next/static aishe-affiliate/frontend/.next/standalone/frontend/.next/'

# Restart frontend
echo "🔄 Restarting frontend..."
ssh -i ~/Downloads/Ainen3435.pem ec2-user@54.81.59.13 'pm2 restart frontend'

echo "✅ Frontend deployment tamamlandı!"
echo "🌐 https://app.aishe.pro"
