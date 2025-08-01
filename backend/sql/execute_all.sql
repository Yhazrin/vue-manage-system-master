-- 执行此脚本以应用所有数据库更改

-- 3. 更新其他游戏的logo路径
UPDATE games SET image_url = '/logo/APEX英雄.png' WHERE name = 'APEX英雄';
UPDATE games SET image_url = '/logo/CSGO.png' WHERE name = 'CSGO';
UPDATE games SET image_url = '/logo/DOTA2.png' WHERE name = 'DOTA2';
UPDATE games SET image_url = '/logo/原神.png' WHERE name = '原神';
UPDATE games SET image_url = '/logo/和平精英.png' WHERE name = '和平精英';
UPDATE games SET image_url = '/logo/守望先锋2.png' WHERE name = '守望先锋2';
UPDATE games SET image_url = '/logo/炉石传说.png' WHERE name = '炉石传说';
UPDATE games SET image_url = '/logo/王者荣耀.png' WHERE name = '王者荣耀';
UPDATE games SET image_url = '/logo/绝地求生.png' WHERE name = '绝地求生';
UPDATE games SET image_url = '/logo/英雄联盟.png' WHERE name = '英雄联盟';

-- 4. 确认更新结果
SELECT id, name, image_url FROM games;