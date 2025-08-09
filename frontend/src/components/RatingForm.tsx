// src/components/RatingForm.tsx
import React, { useState } from 'react';

interface RatingFormProps {
  playerId: number;
  orderId: number;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const RatingForm: React.FC<RatingFormProps> = ({
  playerId,
  orderId,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && comment.trim()) {
      await onSubmit(rating, comment.trim());
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className={`text-2xl transition-colors ${
            isActive ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(starValue)}
        >
          <i className="fa-solid fa-star"></i>
        </button>
      );
    });
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return '非常不满意';
      case 2: return '不满意';
      case 3: return '一般';
      case 4: return '满意';
      case 5: return '非常满意';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">评价陪玩服务</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 星级评分 */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            服务评分
          </label>
          <div className="flex justify-center space-x-1 mb-2">
            {renderStars()}
          </div>
          <p className="text-sm text-gray-600">
            {getRatingText(hoveredRating || rating)}
          </p>
        </div>

        {/* 评价内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            评价内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请分享您对本次服务的感受和建议..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
            required
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {comment.length}/500
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!rating || !comment.trim() || isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                提交中...
              </div>
            ) : (
              '提交评价'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;