import Header from "@/components/Header";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function PlayerHome() {
  const { logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  
  // 首次登录显示通知
  useEffect(() => {
    const firstLoginKey = 'firstLogin_player';
    const isFirstLogin = localStorage.getItem(firstLoginKey) !== 'false';
    
    if (isFirstLogin) {
      toast.success("欢迎回来，陪玩！", {
        description: "查看您的工作台和最新订单",
        position: "bottom-right",
        duration: 5000,
        icon: <i className="fa-solid fa-user-tie"></i>,
      });
      
      // 标记为非首次登录
      localStorage.setItem(firstLoginKey, 'false');
    }
  }, []);
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        
        {/* 陪玩管理内容区域 */}
         <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">欢迎回来，专业玩家_Alex</h2>
                <p className="text-gray-500">今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex gap-3">
                <button className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
                  <i className="fa-solid fa-plus mr-1"></i> 添加服务
                </button>
              </div>
            </div>
            
            {/* 数据概览卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">今日订单</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">2</h3>
                  <span className="text-xs text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i> 1
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">本月收入</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">¥850</h3>
                  <span className="text-xs text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i> 12.5%
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">服务评分</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">4.9</h3>
                  <span className="text-xs text-gray-500 flex items-center">
                    <i className="fa-solid fa-star mr-1 text-yellow-400"></i> 127条评价
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">待处理事项</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">1</h3>
                  <span className="text-xs text-red-600 flex items-center">
                    <i className="fa-solid fa-exclamation-circle mr-1"></i> 待接单
                  </span>
                </div>
              </div>
            </div>
            
            {/* 最近订单 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">最近订单</h3>
                <a href="/player/orders" className="text-sm text-purple-600 hover:text-purple-700">查看全部</a>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar&sign=f1f81b57b203e2aa336aa3ec3f6e3f7f" 
                      alt="用户头像"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">游戏爱好者_小明</p>
                      <p className="text-xs text-gray-500">王者荣耀 • 今天 19:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">¥25.00</p>
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">待接单</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%202&sign=f2938273b9dc9bc101407615eb648d08" 
                      alt="用户头像"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">电竞少年</p>
                      <p className="text-xs text-gray-500">英雄联盟 • 今天 20:00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">¥30.00</p>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">服务中</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%203&sign=c8bb87cc81bc89d5d3d3ceaa37903fe2" 
                      alt="用户头像"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">FPS大神</p>
                      <p className="text-xs text-gray-500">无畏契约 • 昨天 19:30</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">¥35.00</p>
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">已完成</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}