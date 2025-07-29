-- 游戏陪玩平台基础数据插入脚本

-- 1. 插入游戏数据
INSERT INTO `games` (`id`, `name`) VALUES
(1, '王者荣耀'),
(2, '英雄联盟'),
(3, '和平精英'),
(4, '原神'),
(5, 'CSGO'),
(6, 'DOTA2'),
(7, '绝地求生'),
(8, '炉石传说'),
(9, '守望先锋2'),
(10, 'APEX英雄');

-- 2. 插入平台配置
INSERT INTO `platform_config` (`commission_rate`) VALUES (15.00);

-- 3. 插入礼物数据
INSERT INTO `gifts` (`id`, `name`, `price`, `image_url`) VALUES
(1, '小心心', 1.00, '/uploads/gifts/heart.png'),
(2, '玫瑰花', 5.00, '/uploads/gifts/rose.png'),
(3, '棒棒糖', 10.00, '/uploads/gifts/candy.png'),
(4, '巧克力', 20.00, '/uploads/gifts/chocolate.png'),
(5, '蛋糕', 50.00, '/uploads/gifts/cake.png'),
(6, '钻石', 100.00, '/uploads/gifts/diamond.png'),
(7, '皇冠', 200.00, '/uploads/gifts/crown.png'),
(8, '跑车', 500.00, '/uploads/gifts/car.png'),
(9, '城堡', 1000.00, '/uploads/gifts/castle.png'),
(10, '火箭', 2000.00, '/uploads/gifts/rocket.png');

-- 4. 插入管理员账户（密码：admin123）
INSERT INTO `managers` (`name`, `passwd`, `phone_num`, `status`, `authority`, `role`) VALUES
('超级管理员', '$2b$10$0HhFsowf3IVeW59L8p9OZO6S.bn2zIoKj.fS5PFdeegUw18ZmlcKC', '13800000001', 1, 1, 'manager'),
('普通管理员', '$2b$10$0HhFsowf3IVeW59L8p9OZO6S.bn2zIoKj.fS5PFdeegUw18ZmlcKC', '13800000002', 1, 2, 'manager');

-- 5. 插入测试用户（密码：user123）
INSERT INTO `users` (`name`, `passwd`, `status`, `phone_num`, `role`) VALUES
('测试用户1', '$2b$10$I4kTTmaTAVhTvmkRlOcbQOh4l7qgbfL0QEhw00WJ6t2HxHytLVkam', 1, '13900000001', 'user'),
('测试用户2', '$2b$10$I4kTTmaTAVhTvmkRlOcbQOh4l7qgbfL0QEhw00WJ6t2HxHytLVkam', 1, '13900000002', 'user'),
('测试用户3', '$2b$10$I4kTTmaTAVhTvmkRlOcbQOh4l7qgbfL0QEhw00WJ6t2HxHytLVkam', 1, '13900000003', 'user'),
('测试用户4', '$2b$10$I4kTTmaTAVhTvmkRlOcbQOh4l7qgbfL0QEhw00WJ6t2HxHytLVkam', 1, '13900000004', 'user'),
('测试用户5', '$2b$10$I4kTTmaTAVhTvmkRlOcbQOh4l7qgbfL0QEhw00WJ6t2HxHytLVkam', 1, '13900000005', 'user');

-- 6. 插入测试陪玩（密码：player123）
INSERT INTO `players` (`name`, `passwd`, `phone_num`, `status`, `game_id`, `money`, `profit`, `intro`, `role`) VALUES
('王者小姐姐', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000001', 1, 1, 500.00, 1200.00, '王者荣耀资深玩家，擅长打野和辅助，声音甜美，陪玩经验丰富~', 'player'),
('LOL大神', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000002', 1, 2, 800.00, 2500.00, '英雄联盟钻石段位，主玩ADC和中单，技术过硬，带你上分！', 'player'),
('吃鸡女神', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000003', 1, 3, 300.00, 800.00, '和平精英高手，枪法精准，战术意识强，带你轻松吃鸡！', 'player'),
('原神向导', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000004', 1, 4, 600.00, 1500.00, '原神资深玩家，熟悉所有角色和玩法，带你探索提瓦特大陆！', 'player'),
('CSGO高手', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000005', 1, 5, 400.00, 1000.00, 'CSGO竞技高手，枪法犀利，战术配合默契，带你冲击更高段位！', 'player'),
('DOTA传奇', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000006', 1, 6, 700.00, 2000.00, 'DOTA2资深玩家，操作细腻，意识超群，各种英雄都能carry！', 'player'),
('绝地求生王', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000007', 1, 7, 350.00, 900.00, '绝地求生老玩家，生存能力强，带你体验刺激战场！', 'player'),
('炉石大师', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000008', 1, 8, 250.00, 600.00, '炉石传说卡牌大师，各种套牌玩法精通，带你享受策略乐趣！', 'player'),
('守望先锋', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000009', 1, 9, 450.00, 1100.00, '守望先锋2高手，各种英雄都能玩，团队配合意识强！', 'player'),
('APEX传说', '$2b$10$ispIEQg2GXn.DpOo/qzOt.3IivRrK3CUjt59Ybe0btWUCmKNuZ/h2', '13700000010', 1, 10, 550.00, 1300.00, 'APEX英雄顶级玩家，各种传说角色精通，带你冲击顶级段位！', 'player');

-- 7. 插入服务数据
INSERT INTO `services` (`player_id`, `game_id`, `price`, `hours`) VALUES
(1, 1, 25.00, 1), -- 王者小姐姐 - 王者荣耀 25元/小时
(1, 1, 45.00, 2), -- 王者小姐姐 - 王者荣耀 45元/2小时
(2, 2, 30.00, 1), -- LOL大神 - 英雄联盟 30元/小时
(2, 2, 55.00, 2), -- LOL大神 - 英雄联盟 55元/2小时
(3, 3, 20.00, 1), -- 吃鸡女神 - 和平精英 20元/小时
(3, 3, 35.00, 2), -- 吃鸡女神 - 和平精英 35元/2小时
(4, 4, 28.00, 1), -- 原神向导 - 原神 28元/小时
(4, 4, 50.00, 2), -- 原神向导 - 原神 50元/2小时
(5, 5, 35.00, 1), -- CSGO高手 - CSGO 35元/小时
(5, 5, 65.00, 2), -- CSGO高手 - CSGO 65元/2小时
(6, 6, 40.00, 1), -- DOTA传奇 - DOTA2 40元/小时
(6, 6, 75.00, 2), -- DOTA传奇 - DOTA2 75元/2小时
(7, 7, 22.00, 1), -- 绝地求生王 - 绝地求生 22元/小时
(7, 7, 40.00, 2), -- 绝地求生王 - 绝地求生 40元/2小时
(8, 8, 18.00, 1), -- 炉石大师 - 炉石传说 18元/小时
(8, 8, 32.00, 2), -- 炉石大师 - 炉石传说 32元/2小时
(9, 9, 26.00, 1), -- 守望先锋 - 守望先锋2 26元/小时
(9, 9, 48.00, 2), -- 守望先锋 - 守望先锋2 48元/2小时
(10, 10, 32.00, 1), -- APEX传说 - APEX英雄 32元/小时
(10, 10, 60.00, 2); -- APEX传说 - APEX英雄 60元/2小时

-- 8. 插入一些测试订单
INSERT INTO `orders` (`order_id`, `user_id`, `player_id`, `game_id`, `service_id`, `status`, `amount`) VALUES
('ORD20241231001', 1, 1, 1, 1, '已完成', 25.00),
('ORD20241231002', 2, 2, 2, 3, '已完成', 30.00),
('ORD20241231003', 3, 3, 3, 5, '进行中', 20.00),
('ORD20241231004', 4, 4, 4, 7, '已完成', 28.00),
('ORD20241231005', 5, 5, 5, 9, '进行中', 35.00),
('ORD20241231006', 1, 6, 6, 11, '已完成', 40.00),
('ORD20241231007', 2, 7, 7, 13, '已完成', 22.00),
('ORD20241231008', 3, 8, 8, 15, '已取消', 18.00);

-- 9. 插入一些评论数据
INSERT INTO `comments` (`user_id`, `player_id`, `order_id`, `content`, `rating`) VALUES
(1, 1, 'ORD20241231001', '小姐姐声音很甜，技术也不错，下次还会找她！', 5),
(2, 2, 'ORD20241231002', 'LOL大神确实厉害，带我上了一个段位，很满意！', 5),
(4, 4, 'ORD20241231004', '原神向导很专业，教会了我很多技巧，推荐！', 4),
(1, 6, 'ORD20241231006', 'DOTA传奇名不虚传，操作真的很6！', 5),
(2, 7, 'ORD20241231007', '绝地求生王带我吃了好几把鸡，很开心！', 4);

-- 10. 插入一些礼物记录
INSERT INTO `gift_records` (`user_id`, `player_id`, `gift_id`, `quantity`, `total_price`, `platform_fee`) VALUES
(1, 1, 1, 5, 5.00, 0.75),   -- 用户1给王者小姐姐送了5个小心心
(1, 1, 2, 2, 10.00, 1.50),  -- 用户1给王者小姐姐送了2朵玫瑰花
(2, 2, 3, 1, 10.00, 1.50),  -- 用户2给LOL大神送了1个棒棒糖
(3, 3, 1, 3, 3.00, 0.45),   -- 用户3给吃鸡女神送了3个小心心
(4, 4, 4, 1, 20.00, 3.00),  -- 用户4给原神向导送了1个巧克力
(5, 5, 2, 3, 15.00, 2.25),  -- 用户5给CSGO高手送了3朵玫瑰花
(1, 6, 5, 1, 50.00, 7.50),  -- 用户1给DOTA传奇送了1个蛋糕
(2, 7, 1, 10, 10.00, 1.50); -- 用户2给绝地求生王送了10个小心心

-- 11. 插入一些提现记录
INSERT INTO `withdrawals` (`withdrawal_id`, `player_id`, `amount`, `platform_fee`, `status`) VALUES
('WD20241231001', 1, 100.00, 5.00, '已批准'),
('WD20241231002', 2, 200.00, 10.00, '已批准'),
('WD20241231003', 3, 50.00, 2.50, '待审核'),
('WD20241231004', 4, 150.00, 7.50, '已批准'),
('WD20241231005', 5, 80.00, 4.00, '待审核');

-- 12. 插入统计数据
INSERT INTO `statistics` (`user_id`, `player_id`, `user_order_count`, `player_total_income`, `total_order_count`, `total_income`, `total_withdrawn`, `platform_profit`) VALUES
(1, NULL, 3, 0.00, 8, 228.00, 22.50, 34.20),
(2, NULL, 3, 0.00, 8, 228.00, 22.50, 34.20),
(3, NULL, 2, 0.00, 8, 228.00, 22.50, 34.20),
(4, NULL, 1, 0.00, 8, 228.00, 22.50, 34.20),
(5, NULL, 1, 0.00, 8, 228.00, 22.50, 34.20),
(NULL, 1, 0, 125.00, 8, 228.00, 22.50, 34.20),
(NULL, 2, 0, 30.00, 8, 228.00, 22.50, 34.20),
(NULL, 3, 0, 20.00, 8, 228.00, 22.50, 34.20),
(NULL, 4, 0, 28.00, 8, 228.00, 22.50, 34.20),
(NULL, 5, 0, 35.00, 8, 228.00, 22.50, 34.20),
(NULL, 6, 0, 40.00, 8, 228.00, 22.50, 34.20),
(NULL, 7, 0, 22.00, 8, 228.00, 22.50, 34.20),
(NULL, 8, 0, 0.00, 8, 228.00, 22.50, 34.20);