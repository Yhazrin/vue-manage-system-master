-- Add is_settled field to gift_records table
-- Used to mark whether gift records have been settled

ALTER TABLE gift_records 
ADD COLUMN is_settled TINYINT(1) DEFAULT 0;

-- Mark existing gift records as settled (because previous logic was immediate settlement)
UPDATE gift_records SET is_settled = 1 WHERE is_settled IS NULL OR is_settled = 0;

-- Add index for better query performance
CREATE INDEX idx_gift_records_order_settled ON gift_records(order_id, is_settled);