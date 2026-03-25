#!/bin/bash
# Demo kullanıcısı için affiliate link oluştur

ssh -i ~/Downloads/Ainen3435.pem ec2-user@54.81.59.13 << 'EOF'
cd aishe-affiliate
docker exec -i $(docker ps -q -f name=postgres) psql -U postgres -d aishe << 'SQL'
-- 1. Demo user ID'yi bul
\set demo_user_id (SELECT id FROM users WHERE username = 'aishedemo')

-- 2. Active program ID'yi bul
\set program_id (SELECT id FROM programs WHERE status = 'active' LIMIT 1)

-- 3. Affiliate link oluştur (varsa skip et)
INSERT INTO affiliate_links (affiliate_id, program_id, code, target_url, created_at)
SELECT 
  :'demo_user_id'::uuid, 
  :'program_id'::uuid, 
  'aishedemo',
  'https://app.aishe.pro/?ref=aishedemo',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM affiliate_links WHERE code = 'aishedemo'
);

SELECT 'Demo affiliate link created!' as status;
SQL
EOF
