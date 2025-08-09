import React, { useState, useRef, useEffect } from 'react';

interface OrderAmountTooltipProps {
  serviceAmount: number;
  giftCount?: number;
  giftAmount?: number;
  totalAmount: number;
  children: React.ReactNode;
  className?: string;
}

export const OrderAmountTooltip: React.FC<OrderAmountTooltipProps> = ({
  serviceAmount,
  giftCount = 0,
  giftAmount = 0,
  totalAmount,
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = (event: MouseEvent) => {
    if (triggerRef.current && tooltipRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = event.clientX + 10;
      let y = event.clientY - 10;
      
      // 防止悬浮窗超出屏幕右边界
      if (x + tooltipRect.width > window.innerWidth) {
        x = event.clientX - tooltipRect.width - 10;
      }
      
      // 防止悬浮窗超出屏幕下边界
      if (y + tooltipRect.height > window.innerHeight) {
        y = event.clientY - tooltipRect.height - 10;
      }
      
      setPosition({ x, y });
    }
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    setIsVisible(true);
    updatePosition(event.nativeEvent);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    updatePosition(event.nativeEvent);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`cursor-help ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">服务费:</span>
                <span className="font-medium text-gray-900">¥{serviceAmount.toFixed(2)}</span>
              </div>
              
              {giftCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">礼物 ({giftCount}个):</span>
                  <span className="font-medium text-purple-600">¥{giftAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">总计:</span>
                  <span className="font-bold text-lg text-gray-900">¥{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};