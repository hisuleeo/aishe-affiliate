-- Demo kullanıcısının ID'sini al ve affiliate link ekle
DO $$
DECLARE
    demo_user_id uuid;
    program_id uuid;
    affiliate_link_id uuid;
BEGIN
    -- Demo kullanıcısını bul
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@aishe.pro' OR email = 'demo@aishe.local';
    
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'Demo user not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Demo user found: %', demo_user_id;
    
    -- Program var mı kontrol et
    SELECT id INTO program_id FROM programs WHERE name = 'AISHE Affiliate Program' LIMIT 1;
    
    IF program_id IS NULL THEN
        -- Program oluştur
        INSERT INTO programs (id, name, status, attribution_window_days, cookie_ttl_days, default_currency, created_at)
        VALUES (gen_random_uuid(), 'AISHE Affiliate Program', 'active', 30, 30, 'USD', NOW())
        RETURNING id INTO program_id;
        
        RAISE NOTICE 'Program created: %', program_id;
    ELSE
        RAISE NOTICE 'Program found: %', program_id;
    END IF;
    
    -- Mevcut affiliate link var mı kontrol et
    SELECT id INTO affiliate_link_id FROM affiliate_links 
    WHERE affiliate_id = demo_user_id AND program_id = program_id;
    
    IF affiliate_link_id IS NOT NULL THEN
        RAISE NOTICE 'Affiliate link already exists!';
        -- Linki göster
        SELECT CONCAT('https://home.aishe.pro?ref=', code) as affiliate_url 
        FROM affiliate_links WHERE id = affiliate_link_id;
        RETURN;
    END IF;
    
    -- Yeni affiliate link oluştur
    INSERT INTO affiliate_links (id, affiliate_id, program_id, code, target_url, created_at)
    VALUES (
        gen_random_uuid(),
        demo_user_id,
        program_id,
        COALESCE((SELECT username FROM users WHERE id = demo_user_id), 'demo'),
        'https://home.aishe.pro',
        NOW()
    )
    RETURNING id INTO affiliate_link_id;
    
    RAISE NOTICE '✅ Affiliate link created successfully!';
    RAISE NOTICE 'Link ID: %', affiliate_link_id;
    
    -- Oluşturulan linki göster
    RAISE NOTICE 'Full URL: https://home.aishe.pro?ref=%', (SELECT code FROM affiliate_links WHERE id = affiliate_link_id);
END $$;

-- Sonucu göster
SELECT 
    u.email,
    u.username,
    al.code as affiliate_code,
    CONCAT('https://home.aishe.pro?ref=', al.code) as affiliate_url,
    al.target_url,
    al.created_at
FROM affiliate_links al
JOIN users u ON u.id = al.affiliate_id
WHERE u.email IN ('demo@aishe.pro', 'demo@aishe.local')
ORDER BY al.created_at DESC
LIMIT 1;
