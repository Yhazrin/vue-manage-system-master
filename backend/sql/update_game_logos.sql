-- 批量更新游戏的图片路径
-- 请根据实际情况修改游戏名称和对应的图片路径

-- 注意：运行此脚本前，请确保games表已添加image_url字段
-- 可以先运行 add_game_with_logo.sql 脚本

-- 更新APEX英雄的图片路径
UPDATE games SET image_url = '/logo/APEX英雄.png' WHERE name = 'APEX英雄';

-- 更新DOTA2的图片路径
UPDATE games SET image_url = '/logo/DOTA2.png' WHERE name = 'DOTA2';

-- 更新PUBG的图片路径
UPDATE games SET image_url = '/logo/PUBG.png' WHERE name = 'PUBG';

-- 更新csgo的图片路径
UPDATE games SET image_url = '/logo/CSGO.png' WHERE name = 'csgo';

-- 更新原神的图片路径
UPDATE games SET image_url = '/logo/原神.png' WHERE name = '原神';

-- 更新和平精英的图片路径
UPDATE games SET image_url = '/logo/和平精英.png' WHERE name = '和平精英';

-- 更新炉石传说的图片路径
UPDATE games SET image_url = '/logo/炉石传说.png' WHERE name = '炉石传说';

-- 更新王者荣耀的图片路径
UPDATE games SET image_url = '/logo/王者荣耀.png' WHERE name = '王者荣耀';

-- 更新瓦罗兰特的图片路径
UPDATE games SET image_url = '/logo/瓦罗兰特.png' WHERE name = '瓦罗兰特';

-- 更新英雄联盟的图片路径
UPDATE games SET image_url = '/logo/英雄联盟.png' WHERE name = '英雄联盟';

-- 确认更新结果
SELECT id, name, image_url FROM games;