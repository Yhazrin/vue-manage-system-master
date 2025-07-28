import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Tabs() {
  const [activeTab, setActiveTab] = useState("discover");
  
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex">
          <button
            className={cn(
              "py-3 px-6 text-sm font-medium transition-colors",
              activeTab === "discover" 
                ? "text-gray-900 border-b-2 border-purple-600" 
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab("discover")}
          >
            发现
          </button>
          <button
            className={cn(
              "py-3 px-6 text-sm font-medium transition-colors",
              activeTab === "bookings" 
                ? "text-gray-900 border-b-2 border-purple-600" 
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab("bookings")}
          >
            我的预约
          </button>
          <button
            className={cn(
              "py-3 px-6 text-sm font-medium transition-colors",
              activeTab === "favorites" 
                ? "text-gray-900 border-b-2 border-purple-600" 
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab("favorites")}
          >
            收藏
          </button>
          <button
            className={cn(
              "py-3 px-6 text-sm font-medium transition-colors",
              activeTab === "profile" 
                ? "text-gray-900 border-b-2 border-purple-600" 
                : "text-gray-500 hover:text-gray-700"
            )}
            onClick={() => setActiveTab("profile")}
          >
            个人资料
          </button>
        </div>
      </div>
    </div>
  );
}