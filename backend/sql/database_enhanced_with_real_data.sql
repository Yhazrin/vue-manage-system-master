-- =====================================================
-- 增强版数据库初始化脚本
-- 包含完整的真实数据：客服、陪玩、用户、订单等
-- 创建时间: 2025-01-27
-- =====================================================

-- 使用现有数据库
USE `author_center`;

-- =====================================================
-- 1. 插入游戏数据
-- =====================================================

INSERT INTO `games` (`id`, `name`, `image_url`) VALUES
(1, '王者荣耀', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzFFODhFNSIvPgo8dGV4dCB4PSIzMiIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7njovogIU8L3RleHQ+Cjwvc3ZnPgo='),
(2, '和平精英', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzEwQjk4MSIvPgo8dGV4dCB4PSIzMiIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lkozlubM8L3RleHQ+Cjwvc3ZnPgo='),
(3, '原神', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iI0Y5NzMxNiIvPgo8dGV4dCB4PSIzMiIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7ljp/npZ48L3RleHQ+Cjwvc3ZnPgo='),
(4, '英雄联盟', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzM3MzBBMyIvPgo8dGV4dCB4PSIzMiIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MT0w8L3RleHQ+Cjwvc3ZnPgo='),
(5, '绝地求生', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzc5Nzk3OSIvPgo8dGV4dCB4PSIzMiIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QVUJHPC90ZXh0Pgo8L3N2Zz4K'),
(6, 'DOTA2', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iI0RDMjYyNiIvPgo8dGV4dCB4PSIzMiIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ET1RBMjwvdGV4dD4KPHN2Zz4K');

-- =====================================================
-- 2. 插入礼物数据
-- =====================================================

INSERT INTO `gifts` (`id`, `name`, `price`, `image_url`) VALUES
(1, '玫瑰花', 1.00, '/default-gift.svg'),
(2, '巧克力', 5.00, '/default-gift.svg'),
(3, '小熊玩偶', 10.00, '/default-gift.svg'),
(4, '香水', 20.00, '/default-gift.svg'),
(5, '钻石戒指', 50.00, '/default-gift.svg'),
(6, '豪华游轮', 100.00, '/default-gift.svg'),
(7, '私人飞机', 500.00, '/default-gift.svg'),
(8, '城堡', 1000.00, '/default-gift.svg');

-- =====================================================
-- 3. 插入客服数据（完整字段）
-- =====================================================

INSERT INTO `customer_services_super_unified` (
    `username`, `password`, `plain_passwd`, `phone`, `email`, `avatar_url`, `status`, `is_online`,
    `can_view_orders`, `can_edit_orders`, `can_view_players`, `can_edit_players`, `can_view_games`, 
    `can_manage_gifts`, `can_view_statistics`, `can_withdraw`,
    `hourly_rate`, `base_salary`, `commission_rate`, `performance_bonus`,
    `available_balance`, `frozen_balance`, `total_earnings`, `total_withdrawals`, `pending_withdrawals`,
    `total_work_hours`, `total_work_days`, `current_month_hours`, `current_month_earnings`, `current_month_days`,
    `today_status`, `today_work_hours`, `today_base_earnings`, `today_commission_earnings`, `today_bonus_earnings`, `today_total_earnings`,
    `monthly_target_hours`, `monthly_target_earnings`, `performance_score`, `attendance_rate`,
    `created_at`
) VALUES
-- 高级客服
('cs_manager_001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cs123456', '13900001001', 'manager001@company.com', '/default-avatar.svg', 'active', 1,
 1, 1, 1, 1, 1, 1, 1, 1,
 35.00, 3000.00, 15.00, 500.00,
 2580.50, 0.00, 15680.50, 8500.00, 0.00,
 450.5, 28, 168.5, 5892.50, 22,
 'clocked_out', 8.5, 297.50, 180.00, 50.00, 527.50,
 160.00, 5600.00, 95.5, 96.8,
 '2024-01-15 09:00:00'),

('cs_senior_002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cs123456', '13900001002', 'senior002@company.com', '/default-avatar.svg', 'active', 1,
 1, 1, 1, 0, 1, 0, 1, 1,
 30.00, 2500.00, 12.00, 300.00,
 1890.75, 200.00, 12450.75, 6800.00, 200.00,
 380.25, 25, 152.0, 4560.00, 20,
 'clocked_in', 6.0, 180.00, 120.00, 30.00, 330.00,
 160.00, 4800.00, 88.5, 94.2,
 '2024-02-01 08:30:00'),

-- 普通客服
('cs_staff_003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cs123456', '13900001003', 'staff003@company.com', '/default-avatar.svg', 'active', 0,
 1, 0, 1, 0, 1, 0, 1, 1,
 25.00, 2000.00, 8.00, 200.00,
 1250.30, 0.00, 8950.30, 4200.00, 0.00,
 320.5, 22, 140.0, 3500.00, 18,
 'not_clocked', 0.0, 0.00, 0.00, 0.00, 0.00,
 160.00, 4000.00, 82.0, 91.5,
 '2024-03-10 10:15:00'),

('cs_staff_004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cs123456', '13900001004', 'staff004@company.com', '/default-avatar.svg', 'active', 1,
 1, 0, 1, 0, 1, 0, 1, 1,
 22.00, 1800.00, 6.00, 150.00,
 980.60, 100.00, 6780.60, 3500.00, 100.00,
 280.0, 20, 128.0, 2816.00, 16,
 'clocked_in', 4.5, 99.00, 60.00, 15.00, 174.00,
 160.00, 3520.00, 78.5, 89.0,
 '2024-03-20 09:45:00'),

-- 新手客服
('cs_junior_005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cs123456', '13900001005', 'junior005@company.com', '/default-avatar.svg', 'active', 0,
 1, 0, 1, 0, 1, 0, 0, 1,
 20.00, 1500.00, 5.00, 100.00,
 650.80, 0.00, 4150.80, 2000.00, 0.00,
 180.5, 15, 88.0, 1760.00, 12,
 'clocked_out', 7.5, 150.00, 45.00, 10.00, 205.00,
 160.00, 3200.00, 75.0, 85.5,
 '2024-04-05 11:20:00'),

('cs_junior_006', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cs123456', '13900001006', 'junior006@company.com', '/default-avatar.svg', 'active', 1,
 1, 0, 1, 0, 1, 0, 0, 1,
 18.00, 1200.00, 4.00, 80.00,
 420.50, 50.00, 2920.50, 1500.00, 50.00,
 150.0, 12, 72.0, 1296.00, 10,
 'clocked_in', 3.0, 54.00, 30.00, 8.00, 92.00,
 160.00, 2880.00, 70.0, 82.0,
 '2024-04-15 08:00:00');

-- =====================================================
-- 4. 插入陪玩数据（完整字段）
-- =====================================================

INSERT INTO `players` (
    `name`, `passwd`, `phone_num`, `status`, `QR_img`, `game_id`, `money`, `profit`, 
    `voice`, `intro`, `photo_img`, `role`, `plain_passwd`, `online_status`
) VALUES
-- 王者荣耀陪玩
('甜心小雨', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002001', 1, '/default-avatar.svg', 1, 1580.50, 8950.30, 
 '温柔甜美，声音很好听哦~', '王者荣耀星耀段位，擅长辅助和射手，陪你上分不是梦！性格开朗活泼，聊天很有趣，游戏技术过硬，带你体验不一样的游戏乐趣~', '/default-avatar.svg', 'player', 'player123', 1),

('电竞女神', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002002', 1, '/default-avatar.svg', 1, 2350.80, 12680.75,
 '御姐音，很有磁性', '王者荣耀王者段位，职业选手退役，专业带飞！擅长中单和打野，操作犀利，意识一流。不仅技术好，人也很有趣，保证让你玩得开心~', '/default-avatar.svg', 'player', 'player123', 1),

('萌萌哒', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002003', 1, '/default-avatar.svg', 1, 980.20, 5420.60,
 '萝莉音，超级可爱', '王者荣耀钻石段位，虽然段位不是最高，但是人很可爱，声音超甜！陪你聊天玩游戏，保证心情愉快，适合放松娱乐~', '/default-avatar.svg', 'player', 'player123', 0),

-- 和平精英陪玩
('狙击女王', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002004', 1, '/default-avatar.svg', 2, 1890.40, 9850.20,
 '冷酷御姐音', '和平精英战神段位，狙击枪法精准，98K一枪一个！带你吃鸡不是问题，游戏风格稳健，团队配合意识强，是你最佳的游戏伙伴~', '/default-avatar.svg', 'player', 'player123', 1),

('突击小队长', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002005', 1, '/default-avatar.svg', 2, 1650.30, 8200.50,
 '活力少女音', '和平精英超级王牌，突击作战专家！冲锋陷阵从不怂，带你体验刺激的战斗快感。性格开朗，配合默契，一起征战战场吧！', '/default-avatar.svg', 'player', 'player123', 1),

-- 原神陪玩
('旅行者小姐', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002006', 1, '/default-avatar.svg', 3, 1420.60, 7680.90,
 '温柔治愈系', '原神资深玩家，世界等级8，拥有众多五星角色！熟悉各种玩法和攻略，可以带你探索提瓦特大陆的每一个角落，一起享受这个美丽的世界~', '/default-avatar.svg', 'player', 'player123', 0),

('元素法师', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002007', 1, '/default-avatar.svg', 3, 1780.90, 9200.40,
 '知性大姐姐', '原神深渊12层满星通关，配队专家！精通各种元素反应和角色搭配，可以帮你优化队伍，提升战斗力。一起在提瓦特大陆创造奇迹吧！', '/default-avatar.svg', 'player', 'player123', 1),

-- 英雄联盟陪玩
('峡谷女帝', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002008', 1, '/default-avatar.svg', 4, 2180.70, 11500.80,
 '霸气女王音', '英雄联盟大师段位，前职业选手！精通各个位置，操作犀利，意识超群。带你冲分上大师，体验真正的电竞魅力！', '/default-avatar.svg', 'player', 'player123', 1),

('辅助天使', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002009', 1, '/default-avatar.svg', 4, 1350.50, 6890.30,
 '温柔小姐姐', '英雄联盟钻石段位，辅助专精！保护ADC是我的使命，团战指挥很有一套。虽然不是最强的，但绝对是最贴心的队友~', '/default-avatar.svg', 'player', 'player123', 0),

-- 其他游戏陪玩
('全能选手', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '13800002010', 1, '/default-avatar.svg', 5, 1950.80, 10200.60,
 '多变音色', '多游戏全能选手！PUBG、DOTA2、CS:GO样样精通，什么游戏都可以陪你玩。技术过硬，经验丰富，是你最好的游戏伙伴！', '/default-avatar.svg', 'player', 'player123', 1);

-- =====================================================
-- 5. 插入用户数据（完整字段）
-- =====================================================

INSERT INTO `users` (
    `name`, `passwd`, `status`, `photo_img`, `phone_num`, `role`, `plain_passwd`
) VALUES
('张三', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003001', 'user', 'user123'),
('李四', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003002', 'user', 'user123'),
('王五', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003003', 'user', 'user123'),
('赵六', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003004', 'user', 'user123'),
('钱七', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003005', 'user', 'user123'),
('孙八', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003006', 'user', 'user123'),
('周九', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003007', 'user', 'user123'),
('吴十', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003008', 'user', 'user123'),
('郑十一', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003009', 'user', 'user123'),
('王十二', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '/default-avatar.svg', '13700003010', 'user', 'user123');

-- =====================================================
-- 6. 插入服务数据
-- =====================================================

INSERT INTO `services` (`player_id`, `game_id`, `price`, `hours`) VALUES
-- 甜心小雨的服务
(1, 1, 25.00, 1.0),
(1, 1, 45.00, 2.0),
(1, 1, 120.00, 5.0),

-- 电竞女神的服务
(2, 1, 35.00, 1.0),
(2, 1, 65.00, 2.0),
(2, 1, 150.00, 5.0),

-- 萌萌哒的服务
(3, 1, 20.00, 1.0),
(3, 1, 35.00, 2.0),
(3, 1, 80.00, 5.0),

-- 狙击女王的服务
(4, 2, 30.00, 1.0),
(4, 2, 55.00, 2.0),
(4, 2, 130.00, 5.0),

-- 突击小队长的服务
(5, 2, 28.00, 1.0),
(5, 2, 50.00, 2.0),
(5, 2, 120.00, 5.0),

-- 旅行者小姐的服务
(6, 3, 32.00, 1.0),
(6, 3, 60.00, 2.0),
(6, 3, 140.00, 5.0),

-- 元素法师的服务
(7, 3, 38.00, 1.0),
(7, 3, 70.00, 2.0),
(7, 3, 160.00, 5.0),

-- 峡谷女帝的服务
(8, 4, 40.00, 1.0),
(8, 4, 75.00, 2.0),
(8, 4, 180.00, 5.0),

-- 辅助天使的服务
(9, 4, 25.00, 1.0),
(9, 4, 45.00, 2.0),
(9, 4, 110.00, 5.0),

-- 全能选手的服务
(10, 5, 35.00, 1.0),
(10, 5, 65.00, 2.0),
(10, 5, 150.00, 5.0);

-- =====================================================
-- 7. 插入订单数据（完整字段）
-- =====================================================

INSERT INTO `orders` (
    `order_id`, `user_id`, `player_id`, `game_id`, `service_id`, `amount`, `status`, 
    `is_paid`, `user_confirmed_end`, `player_confirmed_end`, `service_hours`, 
    `reviewed_by`, `review_note`, `reviewed_at`, `created_at`
) VALUES
-- 已完成订单
('ORD20250127001', 1, 1, 1, 1, 25.00, 'completed', 1, 1, 1, 1.0, 14, '服务质量很好', '2025-01-26 20:30:00', '2025-01-26 18:00:00'),
('ORD20250127002', 2, 2, 1, 4, 35.00, 'completed', 1, 1, 1, 1.0, 14, '技术过硬', '2025-01-26 21:45:00', '2025-01-26 19:15:00'),
('ORD20250127003', 3, 4, 2, 10, 30.00, 'completed', 1, 1, 1, 1.0, 14, '带飞成功', '2025-01-26 22:20:00', '2025-01-26 20:30:00'),
('ORD20250127004', 4, 6, 3, 16, 32.00, 'completed', 1, 1, 1, 1.0, 14, '很有耐心', '2025-01-27 10:15:00', '2025-01-27 08:45:00'),
('ORD20250127005', 5, 8, 4, 22, 40.00, 'completed', 1, 1, 1, 1.0, 14, '操作犀利', '2025-01-27 11:30:00', '2025-01-27 09:20:00'),

-- 进行中订单
('ORD20250127006', 6, 2, 1, 5, 65.00, 'in_progress', 1, 0, 0, 2.0, NULL, NULL, NULL, '2025-01-27 14:00:00'),
('ORD20250127007', 7, 5, 2, 14, 50.00, 'in_progress', 1, 0, 0, 2.0, NULL, NULL, NULL, '2025-01-27 14:30:00'),
('ORD20250127008', 8, 7, 3, 20, 70.00, 'in_progress', 1, 0, 0, 2.0, NULL, NULL, NULL, '2025-01-27 15:00:00'),

-- 待接单订单
('ORD20250127009', 9, 3, 1, 7, 20.00, 'pending', 1, 0, 0, 1.0, NULL, NULL, NULL, '2025-01-27 15:30:00'),
('ORD20250127010', 10, 9, 4, 25, 25.00, 'pending', 1, 0, 0, 1.0, NULL, NULL, NULL, '2025-01-27 16:00:00'),

-- 待审核订单
('ORD20250127011', 1, 10, 5, 28, 35.00, 'pending_review', 1, 1, 1, 1.0, NULL, NULL, NULL, '2025-01-27 16:30:00'),
('ORD20250127012', 2, 1, 1, 2, 45.00, 'pending_review', 1, 1, 1, 2.0, NULL, NULL, NULL, '2025-01-27 17:00:00'),

-- 匿名用户订单
('ORD20250127013', NULL, 4, 2, 11, 55.00, 'completed', 1, 1, 1, 2.0, 14, '匿名用户满意', '2025-01-27 12:30:00', '2025-01-27 10:00:00'),
('ORD20250127014', NULL, 6, 3, 17, 60.00, 'in_progress', 1, 0, 0, 2.0, NULL, NULL, NULL, '2025-01-27 17:30:00'),
('ORD20250127015', NULL, 8, 4, 23, 75.00, 'pending', 1, 0, 0, 2.0, NULL, NULL, NULL, '2025-01-27 18:00:00');

-- 更新匿名订单的客户信息
UPDATE `orders` SET 
    `customer_name` = '匿名用户A', 
    `customer_phone` = '138****1234', 
    `customer_note` = '希望陪玩技术好一点',
    `is_anonymous` = 1
WHERE `order_id` = 'ORD20250127013';

UPDATE `orders` SET 
    `customer_name` = '匿名用户B', 
    `customer_phone` = '139****5678', 
    `customer_note` = '第一次玩，请多指教',
    `is_anonymous` = 1
WHERE `order_id` = 'ORD20250127014';

UPDATE `orders` SET 
    `customer_name` = '匿名用户C', 
    `customer_phone` = '137****9012', 
    `customer_note` = '想要冲分',
    `is_anonymous` = 1
WHERE `order_id` = 'ORD20250127015';

-- =====================================================
-- 8. 插入礼物记录数据
-- =====================================================

INSERT INTO `gift_records` (
    `user_id`, `player_id`, `order_id`, `gift_id`, `quantity`, `total_price`, 
    `platform_fee`, `is_settled`, `created_at`
) VALUES
(1, 1, 'ORD20250127001', 1, 5, 5.00, 1.50, 1, '2025-01-26 18:30:00'),
(1, 1, 'ORD20250127001', 2, 2, 10.00, 3.00, 1, '2025-01-26 19:00:00'),
(2, 2, 'ORD20250127002', 3, 1, 10.00, 3.00, 1, '2025-01-26 19:45:00'),
(3, 4, 'ORD20250127003', 4, 1, 20.00, 6.00, 1, '2025-01-26 21:00:00'),
(4, 6, 'ORD20250127004', 2, 3, 15.00, 4.50, 1, '2025-01-27 09:30:00'),
(5, 8, 'ORD20250127005', 5, 1, 50.00, 15.00, 1, '2025-01-27 10:00:00'),
(6, 2, 'ORD20250127006', 1, 10, 10.00, 3.00, 0, '2025-01-27 14:15:00'),
(7, 5, 'ORD20250127007', 2, 2, 10.00, 3.00, 0, '2025-01-27 14:45:00'),
(8, 7, 'ORD20250127008', 3, 2, 20.00, 6.00, 0, '2025-01-27 15:15:00');

-- =====================================================
-- 9. 插入收藏数据
-- =====================================================

INSERT INTO `favorites` (`user_id`, `player_id`, `created_at`) VALUES
(1, 1, '2025-01-26 18:00:00'),
(1, 2, '2025-01-26 19:00:00'),
(2, 2, '2025-01-26 19:15:00'),
(2, 4, '2025-01-26 20:00:00'),
(3, 4, '2025-01-26 20:30:00'),
(3, 6, '2025-01-27 08:00:00'),
(4, 6, '2025-01-27 08:45:00'),
(4, 8, '2025-01-27 09:00:00'),
(5, 8, '2025-01-27 09:20:00'),
(5, 10, '2025-01-27 10:00:00'),
(6, 1, '2025-01-27 14:00:00'),
(6, 3, '2025-01-27 14:30:00'),
(7, 5, '2025-01-27 14:30:00'),
(7, 7, '2025-01-27 15:00:00'),
(8, 7, '2025-01-27 15:00:00'),
(8, 9, '2025-01-27 15:30:00');

-- =====================================================
-- 10. 插入评论数据
-- =====================================================

INSERT INTO `comments` (`user_id`, `player_id`, `order_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 'ORD20250127001', 5, '小雨姐姐声音超甜，技术也很好，带我上了好几颗星！下次还找你~', '2025-01-26 20:35:00'),
(2, 2, 'ORD20250127002', 5, '电竞女神名不虚传，操作真的很犀利，而且人很有趣，聊天很开心！', '2025-01-26 21:50:00'),
(3, 4, 'ORD20250127003', 4, '狙击很准，带我吃了好几把鸡，就是有时候太冲了哈哈', '2025-01-26 22:25:00'),
(4, 6, 'ORD20250127004', 5, '旅行者小姐很有耐心，教了我很多原神的小技巧，收获满满！', '2025-01-27 10:20:00'),
(5, 8, 'ORD20250127005', 5, '峡谷女帝真的强，带我从白银打到黄金，操作太秀了！', '2025-01-27 11:35:00');

-- =====================================================
-- 11. 插入打卡记录数据
-- =====================================================

INSERT INTO `attendance_records` (
    `customer_service_id`, `clock_in_time`, `clock_out_time`, `work_hours`, 
    `base_earnings`, `commission_earnings`, `bonus_earnings`, `total_earnings`, 
    `attendance_date`, `status`, `notes`, `created_at`
) VALUES
-- cs_manager_001 的打卡记录
(1, '2025-01-27 09:00:00', '2025-01-27 18:00:00', 8.5, 297.50, 180.00, 50.00, 527.50, '2025-01-27', 'completed', '正常工作日', '2025-01-27 09:00:00'),
(1, '2025-01-26 09:00:00', '2025-01-26 18:30:00', 9.0, 315.00, 200.00, 60.00, 575.00, '2025-01-26', 'completed', '加班半小时', '2025-01-26 09:00:00'),
(1, '2025-01-25 09:00:00', '2025-01-25 18:00:00', 8.0, 280.00, 150.00, 40.00, 470.00, '2025-01-25', 'completed', '正常工作日', '2025-01-25 09:00:00'),

-- cs_senior_002 的打卡记录
(2, '2025-01-27 08:30:00', NULL, 6.0, 180.00, 120.00, 30.00, 330.00, '2025-01-27', 'in_progress', '当前在线', '2025-01-27 08:30:00'),
(2, '2025-01-26 08:30:00', '2025-01-26 17:30:00', 8.5, 255.00, 140.00, 35.00, 430.00, '2025-01-26', 'completed', '正常工作日', '2025-01-26 08:30:00'),
(2, '2025-01-25 08:30:00', '2025-01-25 17:00:00', 8.0, 240.00, 130.00, 30.00, 400.00, '2025-01-25', 'completed', '正常工作日', '2025-01-25 08:30:00'),

-- cs_staff_004 的打卡记录
(4, '2025-01-27 09:45:00', NULL, 4.5, 99.00, 60.00, 15.00, 174.00, '2025-01-27', 'in_progress', '当前在线', '2025-01-27 09:45:00'),
(4, '2025-01-26 09:45:00', '2025-01-26 18:00:00', 7.5, 165.00, 80.00, 20.00, 265.00, '2025-01-26', 'completed', '正常工作日', '2025-01-26 09:45:00'),

-- cs_junior_005 的打卡记录
(5, '2025-01-26 11:20:00', '2025-01-26 19:00:00', 7.5, 150.00, 45.00, 10.00, 205.00, '2025-01-26', 'completed', '正常工作日', '2025-01-26 11:20:00'),
(5, '2025-01-25 11:20:00', '2025-01-25 18:30:00', 7.0, 140.00, 40.00, 10.00, 190.00, '2025-01-25', 'completed', '正常工作日', '2025-01-25 11:20:00'),

-- cs_junior_006 的打卡记录
(6, '2025-01-27 08:00:00', NULL, 3.0, 54.00, 30.00, 8.00, 92.00, '2025-01-27', 'in_progress', '当前在线', '2025-01-27 08:00:00'),
(6, '2025-01-26 08:00:00', '2025-01-26 16:30:00', 8.0, 144.00, 50.00, 12.00, 206.00, '2025-01-26', 'completed', '正常工作日', '2025-01-26 08:00:00');

-- =====================================================
-- 12. 插入提现记录数据
-- =====================================================

INSERT INTO `withdrawals` (
    `withdrawal_id`, `user_type`, `customer_service_id`, `player_id`, `amount`, 
    `platform_fee`, `alipay_account`, `status`, `notes`, `processed_by`, 
    `processed_by_name`, `processed_at`, `approval_notes`, `created_at`
) VALUES
-- 客服提现记录
('WD20250127001', 'customer_service', 1, NULL, 500.00, 5.00, 'cs001@alipay.com', '已打款', '月度提现', 14, '超级管理员2', '2025-01-26 16:00:00', '审核通过，正常提现', '2025-01-26 14:00:00'),
('WD20250127002', 'customer_service', 2, NULL, 300.00, 3.00, 'cs002@alipay.com', '已批准', '周度提现', 14, '超级管理员2', '2025-01-27 10:00:00', '审核通过', '2025-01-27 08:00:00'),
('WD20250127003', 'customer_service', 4, NULL, 200.00, 2.00, 'cs004@alipay.com', '待审核', '申请提现', NULL, NULL, NULL, NULL, '2025-01-27 15:00:00'),

-- 陪玩提现记录
('WD20250127004', 'player', NULL, 1, 800.00, 8.00, 'player001@alipay.com', '已打款', '月度提现', 14, '超级管理员2', '2025-01-26 17:00:00', '审核通过，正常提现', '2025-01-26 15:00:00'),
('WD20250127005', 'player', NULL, 2, 1200.00, 12.00, 'player002@alipay.com', '已打款', '月度提现', 14, '超级管理员2', '2025-01-26 18:00:00', '审核通过，正常提现', '2025-01-26 16:00:00'),
('WD20250127006', 'player', NULL, 4, 600.00, 6.00, 'player004@alipay.com', '已批准', '周度提现', 14, '超级管理员2', '2025-01-27 11:00:00', '审核通过', '2025-01-27 09:00:00'),
('WD20250127007', 'player', NULL, 8, 1000.00, 10.00, 'player008@alipay.com', '待审核', '申请提现', NULL, NULL, NULL, NULL, '2025-01-27 16:00:00'),
('WD20250127008', 'player', NULL, 10, 500.00, 5.00, 'player010@alipay.com', '待审核', '申请提现', NULL, NULL, NULL, NULL, '2025-01-27 17:00:00');

-- =====================================================
-- 13. 插入统计数据
-- =====================================================

INSERT INTO `statistics` (
    `user_id`, `player_id`, `user_order_count`, `player_total_income`, 
    `total_order_count`, `total_income`, `total_withdrawn`, `platform_profit`
) VALUES
(1, NULL, 2, 0.00, 15, 1250.50, 0.00, 375.15),
(2, NULL, 2, 0.00, 15, 1250.50, 0.00, 375.15),
(3, NULL, 1, 0.00, 15, 1250.50, 0.00, 375.15),
(4, NULL, 1, 0.00, 15, 1250.50, 0.00, 375.15),
(5, NULL, 1, 0.00, 15, 1250.50, 0.00, 375.15),
(NULL, 1, 0, 1580.50, 15, 1250.50, 800.00, 375.15),
(NULL, 2, 0, 2350.80, 15, 1250.50, 1200.00, 375.15),
(NULL, 3, 0, 980.20, 15, 1250.50, 0.00, 375.15),
(NULL, 4, 0, 1890.40, 15, 1250.50, 600.00, 375.15),
(NULL, 5, 0, 1650.30, 15, 1250.50, 0.00, 375.15),
(NULL, 6, 0, 1420.60, 15, 1250.50, 0.00, 375.15),
(NULL, 7, 0, 1780.90, 15, 1250.50, 0.00, 375.15),
(NULL, 8, 0, 2180.70, 15, 1250.50, 1000.00, 375.15),
(NULL, 9, 0, 1350.50, 15, 1250.50, 0.00, 375.15),
(NULL, 10, 0, 1950.80, 15, 1250.50, 500.00, 375.15);

-- =====================================================
-- 数据插入完成
-- =====================================================

-- 更新自增ID
ALTER TABLE `games` AUTO_INCREMENT = 7;
ALTER TABLE `gifts` AUTO_INCREMENT = 9;
ALTER TABLE `customer_services_super_unified` AUTO_INCREMENT = 7;
ALTER TABLE `players` AUTO_INCREMENT = 11;
ALTER TABLE `users` AUTO_INCREMENT = 11;
ALTER TABLE `services` AUTO_INCREMENT = 29;
ALTER TABLE `gift_records` AUTO_INCREMENT = 10;
ALTER TABLE `favorites` AUTO_INCREMENT = 17;
ALTER TABLE `comments` AUTO_INCREMENT = 6;
ALTER TABLE `attendance_records` AUTO_INCREMENT = 13;
ALTER TABLE `statistics` AUTO_INCREMENT = 16;

-- 显示插入结果统计
SELECT 
    '数据插入完成' as status,
    (SELECT COUNT(*) FROM games) as games_count,
    (SELECT COUNT(*) FROM gifts) as gifts_count,
    (SELECT COUNT(*) FROM customer_services_super_unified) as customer_services_count,
    (SELECT COUNT(*) FROM players) as players_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM services) as services_count,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM gift_records) as gift_records_count,
    (SELECT COUNT(*) FROM favorites) as favorites_count,
    (SELECT COUNT(*) FROM comments) as comments_count,
    (SELECT COUNT(*) FROM attendance_records) as attendance_records_count,
    (SELECT COUNT(*) FROM withdrawals) as withdrawals_count,
    (SELECT COUNT(*) FROM statistics) as statistics_count;