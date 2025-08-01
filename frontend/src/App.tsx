import { Routes, Route, useNavigate } from "react-router-dom";
  import Home from "@/pages/Home";
  import Login from "@/pages/Login";
  import Register from "@/pages/Register";
  import UserHome from "@/pages/UserHome";
  import AdminOverview from "@/pages/AdminOverview";
  import PlayerHome from "@/pages/PlayerHome";
  import PlayerProfile from "@/pages/PlayerProfile";
  import UserProfile from "@/pages/UserProfile";
  import UserOrders from "@/pages/UserOrders";
  import UserFavorites from "@/pages/UserFavorites";
  import AdminProfile from "@/pages/AdminProfile";
  import AdminStatistics from "@/pages/AdminStatistics";
  import AdminOrders from "@/pages/AdminOrders";
  import AdminUserManagement from "@/pages/AdminUserManagement";
  import PlayerOrders from "@/pages/PlayerOrders";
  import PlayerFunds from "@/pages/PlayerFunds";
  import PlayerGuide from "@/pages/PlayerGuide";
import AdminGiftManagement from "@/pages/AdminGiftManagement";
import AdminGameManagement from "@/pages/AdminGameManagement";
import AdminWithdrawalManagement from "@/pages/AdminWithdrawalManagement";
import AdminNotificationPage from "@/pages/AdminNotificationPage";
import ApiMonitor from "@/pages/ApiMonitor";
import ApiStatus from "@/pages/ApiStatus";
import AdminPermissionManagement from "@/pages/AdminPermissionManagement";
import BookingDetail from "@/pages/BookingDetail";
import GamePlayersPage from "@/pages/GamePlayersPage";
import PlayerServices from "@/pages/PlayerServices";
import Notifications from "@/pages/Notifications";
import { useState } from "react";
import { AuthContext } from '@/contexts/authContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function App() {
  // 从localStorage加载认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [userRole, setUserRole] = useState<'user' | 'player' | 'admin' | null>(
    localStorage.getItem('userRole') as 'user' | 'player' | 'admin' | null
  );
  const navigate = useNavigate();

  const setAuth = (value: boolean, role?: 'user' | 'player' | 'admin') => {
    setIsAuthenticated(value);
    if (value && role) {
      setUserRole(role);
      
      // 保存认证状态到localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', role);
    } else {
      setUserRole(null);
      // 清除localStorage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    // 清除localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userRole, setIsAuthenticated: setAuth, logout }}
    >
      <NotificationProvider>
        <Routes>
           {/* 大厅路由 - 原用户主页内容 */}
           <Route path="/lobby" element={<UserHome />} />
           {/* 用户主页 */}
           <Route path="/user/dashboard" element={<UserHome />} />
           {/* 陪玩主页 */}
           <Route path="/player/dashboard" element={<PlayerHome />} />

            {/* 管理员数据概览 */}
            <Route path="/admin/overview" element={<AdminOverview />} />
            {/* 管理员统计分析 */}
            <Route path="/admin/statistics" element={<AdminStatistics />} />
            {/* 管理员订单管理 */}
            <Route path="/admin/orders" element={<AdminOrders />} />
            {/* 管理员用户/陪玩管理 */}
             <Route path="/admin/users" element={<AdminUserManagement />} />
             {/* 礼物管理 */}
             <Route path="/admin/gifts" element={<AdminGiftManagement />} />
             {/* 游戏管理 */}
             <Route path="/admin/games" element={<AdminGameManagement />} />
              {/* 提现管理 */}
              <Route path="/admin/withdrawals" element={<AdminWithdrawalManagement />} />
              {/* 权限管理 */}
              <Route path="/admin/permissions" element={<AdminPermissionManagement />} />
              {/* 通知管理 */}
              <Route path="/admin/notifications" element={<AdminNotificationPage />} />
              {/* API监控 */}
              <Route path="/admin/api-monitor" element={<ApiMonitor />} />
          <Route path="/admin/api-status" element={<ApiStatus />} />

            
           
           <Route path="/" element={<Home />} />
           <Route path="/login" element={<Login />} />
           <Route path="/register" element={<Register />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/messages" element={<Notifications />} />
             <Route path="/player/profile" element={<PlayerProfile />} />
             <Route path="/player/services" element={<PlayerServices />} />
             <Route path="/user/profile" element={<UserProfile />} />
             <Route path="/admin/profile" element={<AdminProfile />} />
             <Route path="/player/orders" element={<PlayerOrders />} />
             <Route path="/player/guide" element={<PlayerGuide />} />
            <Route path="/player/funds" element={<PlayerFunds />} />
                      <Route path="/forgot-password" element={<div className="text-center text-xl">Forgot Password - Coming Soon</div>} />
                      <Route path="/user/orders" element={<UserOrders />} />
                      <Route path="/user/favorites" element={<UserFavorites />} />
             <Route path="/booking/:playerId" element={<BookingDetail />} />
             <Route path="/game/:gameId/players" element={<GamePlayersPage />} />
        </Routes>
      </NotificationProvider>
    </AuthContext.Provider>
  );
}