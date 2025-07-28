import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  onPriceChange?: (minPrice: number, maxPrice: number) => void;
}

export default function SearchFilter({ onPriceChange }: SearchFilterProps) {
  const [priceRange, setPriceRange] = useState(25);
  
  const handlePriceChange = (value: number) => {
    setPriceRange(value);
    onPriceChange && onPriceChange(10, value);
  };
  
  return (
     <div className="bg-theme-surface rounded-lg shadow-sm p-6 mb-6">
      <div className="mb-4">
               <h2 className="text-lg font-semibold text-theme-text mb-1">寻找您的完美游戏陪玩</h2>
               <p className="text-sm text-theme-text/80">搜索和筛选我们的专业游戏陪玩</p>
             </div>
      
      <div className="flex flex-wrap gap-4">
        {/* Search Input */}
        <div className="flex-grow min-w-[200px]">
          <input
            type="text"
            placeholder="搜索陪玩或游戏..."
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        {/* Game Filter */}
        <div className="min-w-[120px]">
          <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>所有游戏</option>
            <option>无畏契约</option>
            <option>英雄联盟</option>
            <option>CS:GO</option>
            <option>魔兽世界</option>
          </select>
        </div>
        
        {/* Service Filter */}
        <div className="min-w-[120px]">
          <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>所有服务</option>
            <option>教学</option>
            <option>组队</option>
            <option>段位提升</option>
            <option>娱乐对局</option>
          </select>
        </div>
        
        {/* Price Range */}
        <div className="flex-grow min-w-[200px] flex items-center gap-2 text-sm text-gray-600">
          <span>价格范围:</span>
          <span>$10</span>
          <input
            type="range"
            min="10"
            max="50"
            value={priceRange}
            onChange={(e) => handlePriceChange(Number(e.target.value))}
            className="flex-grow accent-purple-600"
          />
          <span>${priceRange}/小时</span>
        </div>
      </div>
    </div>
  );
}