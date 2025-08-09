-- 添加订单审核相关字段
USE author_center;

-- 修改订单状态枚举，添加待审核状态
ALTER TABLE orders 
MODIFY COLUMN status ENUM('pending', 'accepted', 'in_progress', 'pending_review', 'completed', 'cancelled') 
NOT NULL DEFAULT 'pending' 
COMMENT '订单状态：待接单、已接单、进行中、待审核、已完成、已取消';

-- 添加审核相关字段
ALTER TABLE orders 
ADD COLUMN reviewed_by INT NULL COMMENT '审核人ID（管理员或客服）' AFTER is_paid,
ADD COLUMN review_note TEXT NULL COMMENT '审核备注' AFTER reviewed_by,
ADD COLUMN reviewed_at DATETIME NULL COMMENT '审核时间' AFTER review_note;

-- 添加外键约束（可选，如果有统一的用户表）
-- ALTER TABLE orders ADD FOREIGN KEY (reviewed_by) REFERENCES users(id);

-- 创建索引以提高查询性能
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_reviewed_by ON orders(reviewed_by);
CREATE INDEX idx_orders_reviewed_at ON orders(reviewed_at);