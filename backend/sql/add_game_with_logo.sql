-- 修改games表结构，添加image_url字段
ALTER TABLE games ADD COLUMN image_url VARCHAR(255) AFTER name;

-- 插入新游戏：三角洲行动
INSERT INTO games (name, image_url) VALUES (
  '三角洲行动',
  '/logo/三角洲行动.png'
);

-- 可选：更新现有游戏的图片路径
-- 请根据实际情况取消注释并修改以下语句
-- UPDATE games SET image_url = '/logo/APEX英雄.png' WHERE name = 'APEX英雄';
-- UPDATE games SET image_url = '/logo/DOTA2.png' WHERE name = 'DOTA2';
-- UPDATE games SET image_url = '/logo/PUBG.png' WHERE name = 'PUBG';
-- UPDATE games SET image_url = '/logo/CSGO.png' WHERE name = 'csgo';
-- UPDATE games SET image_url = '/logo/原神.png' WHERE name = '原神';
-- UPDATE games SET image_url = '/logo/和平精英.png' WHERE name = '和平精英';
-- UPDATE games SET image_url = '/logo/炉石传说.png' WHERE name = '炉石传说';
-- UPDATE games SET image_url = '/logo/王者荣耀.png' WHERE name = '王者荣耀';
-- UPDATE games SET image_url = '/logo/瓦罗兰特.png' WHERE name = '瓦罗兰特';
-- UPDATE games SET image_url = '/logo/英雄联盟.png' WHERE name = '英雄联盟';