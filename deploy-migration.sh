#!/bin/bash
set -e

echo "🚀 Production migration ve backfill başlıyor..."

# Prisma schema deploy
echo "📦 Deploying schema..."
rsync -avz -e "ssh -i ~/Downloads/Ainen3435.pem" \
  /Users/apple/Downloads/referal/prisma/ \
  ec2-user@54.81.59.13:~/aishe-affiliate/prisma/

# Migration çalıştır
echo "🔧 Running migration..."
ssh -i ~/Downloads/Ainen3435.pem ec2-user@54.81.59.13 << 'EOF'
cd aishe-affiliate
npx prisma migrate deploy
npx prisma generate
EOF

# Backfill script çalıştır
echo "🔄 Running backfill..."
ssh -i ~/Downloads/Ainen3435.pem ec2-user@54.81.59.13 << 'EOF'
cd aishe-affiliate
npx ts-node prisma/backfill-conversions.ts
EOF

echo "✅ Migration ve backfill tamamlandı!"
