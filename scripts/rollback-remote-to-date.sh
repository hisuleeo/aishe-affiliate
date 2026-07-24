#!/bin/bash
set -euo pipefail

# Usage:
#   bash scripts/rollback-remote-to-date.sh "2026-07-16 23:59:59"
# Optional env overrides:
#   KEY_PATH, REMOTE_USER, REMOTE_HOST, REMOTE_APP_DIR

TARGET_DATETIME="${1:-}"
if [[ -z "$TARGET_DATETIME" ]]; then
  echo "Usage: bash scripts/rollback-remote-to-date.sh \"YYYY-MM-DD HH:MM:SS\""
  exit 1
fi

KEY_PATH="${KEY_PATH:-$HOME/Downloads/Ainen3435.pem}"
REMOTE_USER="${REMOTE_USER:-ec2-user}"
REMOTE_HOST="${REMOTE_HOST:-54.81.59.13}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/home/ec2-user/aishe-affiliate}"

SSH_OPTS=(-i "$KEY_PATH" -o StrictHostKeyChecking=accept-new)

echo "[1/6] Sunucudaki commitleri tarih araliginda buluyorum: $TARGET_DATETIME"
TARGET_COMMIT=$(ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" "
  cd $REMOTE_APP_DIR
  git rev-list -n 1 --before='$TARGET_DATETIME' main
")

if [[ -z "$TARGET_COMMIT" ]]; then
  echo "Hata: Belirtilen tarih icin uygun commit bulunamadi."
  exit 2
fi

echo "Hedef commit: $TARGET_COMMIT"

echo "[2/6] Guvenlik amacli backup branch olusturuyorum"
ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" "
  cd $REMOTE_APP_DIR
  git fetch origin
  BACKUP_BRANCH=backup/pre-rollback-\$(date +%Y%m%d-%H%M%S)
  git branch \"\$BACKUP_BRANCH\" HEAD || true
  echo \"Backup branch: \$BACKUP_BRANCH\"
"

echo "[3/6] Hedef commit'e geciyorum"
ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" "
  cd $REMOTE_APP_DIR
  git checkout -f $TARGET_COMMIT
  git clean -fd
"

echo "[4/6] Build islemleri"
ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" "
  cd $REMOTE_APP_DIR
  npm ci
  npm run build
  cd frontend
  npm ci
  npm run build
"

echo "[5/6] Prisma generate + PM2 restart"
ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" "
  cd $REMOTE_APP_DIR
  npx prisma generate
  pm2 restart aishe-backend || true
  pm2 restart frontend || true
"

echo "[6/6] Dogrulama"
ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" "
  cd $REMOTE_APP_DIR
  echo \"Current HEAD:\" && git --no-pager log -1 --oneline
  echo \"PM2 Status:\" && pm2 list
"

echo "Rollback tamamlandi."
