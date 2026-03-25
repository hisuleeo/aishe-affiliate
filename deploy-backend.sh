#!/bin/bash
set -e

echo "🚀 Backend deployment başlıyor..."

# Build
echo "📦 Building backend..."
cd /Users/apple/Downloads/referal
npm run build

# Deploy dist and src
echo "📤 Deploying to EC2..."
rsync -avz --delete -e "ssh -i ~/Downloads/Ainen3435.pem" \
  /Users/apple/Downloads/referal/dist/ \
  ec2-user@54.81.59.13:~/aishe-affiliate/dist/

rsync -avz --delete -e "ssh -i ~/Downloads/Ainen3435.pem" --exclude node_modules \
  /Users/apple/Downloads/referal/src/ \
  ec2-user@54.81.59.13:~/aishe-affiliate/src/

# Prisma generate
echo "🔧 Running prisma generate..."
ssh -i ~/Downloads/Ainen3435.pem ec2-user@54.81.59.13 \
  'cd aishe-affiliate && npx prisma generate'

# Restart backend
echo "🔄 Restarting backend..."
ssh -i ~/Downloads/Ainen3435.pem ec2-user@54.81.59.13 'pm2 restart aishe-backend'

echo "✅ Backend deployment tamamlandı!"
echo "🌐 https://api.aishe.pro"
