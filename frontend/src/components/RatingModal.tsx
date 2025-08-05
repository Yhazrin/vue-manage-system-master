import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getGifts, Gift } from '@/services/giftService';
import { buildImageUrl } from '@/utils/imageUtils';

interface SelectedGift {
  giftId: number;
  quantity: number;
}

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string, gifts?: SelectedGift[]) => Promise<void>;
  playerName: string;
  orderId: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  playerName,
  orderId
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<SelectedGift[]>([]);
  const [showGiftSection, setShowGiftSection] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(false);

  // 加载礼物列表
  useEffect(() => {
    if (isOpen && showGiftSection && gifts.length === 0) {
      loadGifts();
    }
  }, [isOpen, showGiftSection]);

  const loadGifts = async () => {
    setLoadingGifts(true);
    try {
      const giftList = await getGifts();
      setGifts(giftList);
    } catch (error) {
      console.error('加载礼物列表失败:', error);
      toast.error('加载礼物列表失败');
    } finally {
      setLoadingGifts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast.error('请填写评价内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment.trim(), selectedGifts.length > 0 ? selectedGifts : undefined);
      // 移除重复的成功提示，由父组件处理
      onClose();
      setComment('');
      setRating(5);
      setSelectedGifts([]);
      setShowGiftSection(false);
    } catch (error) {
      console.error('提交评价失败:', error);
      toast.error('评价提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGiftQuantityChange = (giftId: number, quantity: number) => {
    if (quantity <= 0) {
      setSelectedGifts(prev => prev.filter(g => g.giftId !== giftId));
    } else {
      setSelectedGifts(prev => {
        const existing = prev.find(g => g.giftId === giftId);
        if (existing) {
          return prev.map(g => g.giftId === giftId ? { ...g, quantity } : g);
        } else {
          return [...prev, { giftId, quantity }];
        }
      });
    }
  };

  const getSelectedQuantity = (giftId: number) => {
    return selectedGifts.find(g => g.giftId === giftId)?.quantity || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">评价服务</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">陪玩师：{playerName}</p>
            <p className="text-xs text-gray-500">订单号：{orderId}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                服务评分
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400`}
                  >
                    <i className="fa-solid fa-star"></i>
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {rating === 1 && '很差'}
                  {rating === 2 && '较差'}
                  {rating === 3 && '一般'}
                  {rating === 4 && '满意'}
                  {rating === 5 && '非常满意'}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                评价内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请分享您对本次服务的感受..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
                required
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {comment.length}/500
              </div>
            </div>

            {/* 礼物选择部分 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  赠送礼物 (可选)
                </label>
                <button
                  type="button"
                  onClick={() => setShowGiftSection(!showGiftSection)}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  {showGiftSection ? '收起' : '选择礼物'}
                </button>
              </div>

              {showGiftSection && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {loadingGifts ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <p className="mt-2 text-sm text-gray-600">加载礼物列表中...</p>
                    </div>
                  ) : gifts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">暂无可选礼物</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-3">选择要赠送的礼物和数量：</p>
                      {gifts.map((gift) => (
                        <div key={gift.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3">
                            {gift.imageUrl && (
                              <img 
                                src={buildImageUrl(gift.imageUrl)} 
                                alt={gift.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{gift.name}</p>
                              <p className="text-sm text-gray-500">¥{gift.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleGiftQuantityChange(gift.id, getSelectedQuantity(gift.id) - 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                              disabled={getSelectedQuantity(gift.id) === 0}
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">
                              {getSelectedQuantity(gift.id)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleGiftQuantityChange(gift.id, getSelectedQuantity(gift.id) + 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {selectedGifts.length > 0 && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm font-medium text-purple-900 mb-2">已选择的礼物：</p>
                          <div className="space-y-1">
                            {selectedGifts.map((selectedGift) => {
                              const gift = gifts.find(g => g.id === selectedGift.giftId);
                              return gift ? (
                                <div key={selectedGift.giftId} className="flex justify-between text-sm">
                                  <span>{gift.name} x {selectedGift.quantity}</span>
                                  <span className="font-medium">¥{(gift.price * selectedGift.quantity).toFixed(2)}</span>
                                </div>
                              ) : null;
                            })}
                            <div className="border-t border-purple-200 pt-2 mt-2">
                              <div className="flex justify-between font-medium text-purple-900">
                                <span>总计：</span>
                                <span>
                                  ¥{selectedGifts.reduce((total, selectedGift) => {
                                    const gift = gifts.find(g => g.id === selectedGift.giftId);
                                    return total + (gift ? gift.price * selectedGift.quantity : 0);
                                  }, 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    提交中...
                  </>
                ) : (
                  '提交评价'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};