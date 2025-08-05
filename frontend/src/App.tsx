import { Routes, Route, useNavigate } from "react-router-dom";
  import { Toaster } from "sonner";
  import Home from "@/pages/Home";
  import Login from "@/pages/Login";
  import Register from "@/pages/Register";
  import UserHome from "@/pages/UserHome";
  import AdminOverview from "@/pages/AdminOverview";

  import PlayerProfile from "@/pages/PlayerProfile";
  import UserProfile from "@/pages/UserProfile";
  import UserOrders from "@/pages/UserOrders";
  import UserFavorites from "@/pages/UserFavorites";
  import AdminProfile from "@/pages/AdminProfile";

  import AdminOrders from "@/pages/AdminOrders";
  import AdminUserManagement from "@/pages/AdminUserManagement";
  import PlayerOrders from "@/pages/PlayerOrders";
  import PlayerFunds from "@/pages/PlayerFunds";
  import PlayerGuide from "@/pages/PlayerGuide";
import AdminGiftManagement from "@/pages/AdminGiftManagement";
import AdminGameManagement from "@/pages/AdminGameManagement";
import AdminWithdrawalManagement from "@/pages/AdminWithdrawalManagement";
import AdminNotificationPage from "@/pages/AdminNotificationPage";
import AdminDataManagement from "@/pages/AdminDataManagement";
import ApiMonitor from "@/pages/ApiMonitor";
import ApiStatus from "@/pages/ApiStatus";
import AdminPermissionManagement from "@/pages/AdminPermissionManagement";
import AdminLogs from "@/pages/AdminLogs";
import AdminSecurity from "@/pages/AdminSecurity";
import AdminAttendance from "@/pages/AdminAttendance";
import AdminCustomerServiceFunds from "@/pages/AdminCustomerServiceFunds";


import BookingDetail from "@/pages/BookingDetail";
import GamePlayersPage from "@/pages/GamePlayersPage";
import PlayerServices from "@/pages/PlayerServices";
import Notifications from "@/pages/Notifications";
import CommentTest from "@/pages/CommentTest";
import DebugAuth from "@/pages/DebugAuth";
import TestComments from "@/pages/TestComments";
import ApiTest from "@/pages/ApiTest";
import ToastTest from "@/pages/ToastTest";
import Banned from "@/pages/Banned";
import TopPlayers from "@/pages/TopPlayers";
import AuthChecker from "@/components/AuthChecker";
import { useState } from "react";
import { AuthContext, UserInfo } from '@/contexts/authContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import PermissionGuard from '@/components/PermissionGuard';

export default function App() {
  // 从localStorage加载认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [userRole, setUserRole] = useState<'user' | 'player' | 'admin' | null>(
    localStorage.getItem('userRole') as 'user' | 'player' | 'admin' | null
  );
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });
  const navigate = useNavigate();

  const setAuth = (value: boolean, role?: 'user' | 'player' | 'admin', userInfoParam?: UserInfo) => {
    setIsAuthenticated(value);
    if (value && role) {
      setUserRole(role);
      setUserInfo(userInfoParam || null);
      
      // 保存认证状态到localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', role);
      if (userInfoParam) {
        localStorage.setItem('user', JSON.stringify(userInfoParam));
      }
    } else {
      setUserRole(null);
      setUserInfo(null);
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
      value={{ isAuthenticated, userRole, userInfo, setIsAuthenticated: setAuth, logout }}
    >
      <NotificationProvider>
        <AuthChecker />
        <Toaster 
          position="bottom-right"
          richColors
          closeButton
          duration={5000}
          toastOptions={{
            style: {
              background: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            },
          }}
        />
        <Routes>
           {/* 大厅路由 - 原用户主页内容 */}
           <Route path="/lobby" element={<UserHome />} />
           {/* 用户主页 */}
           <Route path="/user/dashboard" element={<UserHome />} />
           {/* 陪玩主页 - 重定向到订单管理 */}
           <Route path="/player/dashboard" element={<PlayerOrders />} />

            {/* 管理员数据概览 */}
            <Route path="/admin/overview" element={
              <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 3]}>
                <AdminOverview />
              </PermissionGuard>
            } />

            {/* 管理员订单管理 */}
            <Route path="/admin/orders" element={
              <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 2, 3]}>
                <AdminOrders />
              </PermissionGuard>
            } />
            {/* 管理员用户/陪玩管理 */}
             <Route path="/admin/users" element={
               <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 2, 3]}>
                 <AdminUserManagement />
               </PermissionGuard>
             } />
             {/* 礼物管理 */}
             <Route path="/admin/gifts" element={
               <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 2, 3]}>
                 <AdminGiftManagement />
               </PermissionGuard>
             } />
             {/* 游戏管理 */}
             <Route path="/admin/games" element={
               <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 3]}>
                 <AdminGameManagement />
               </PermissionGuard>
             } />
              {/* 提现管理 */}
              <Route path="/admin/withdrawals" element={
                <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 2, 3]}>
                  <AdminWithdrawalManagement />
                </PermissionGuard>
              } />
              {/* 权限管理 */}
              <Route path="/admin/permissions" element={
                <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 3]}>
                  <AdminPermissionManagement />
                </PermissionGuard>
              } />
              
              {/* 客服上下班打卡 */}
              <Route path="/admin/attendance" element={
                <PermissionGuard requiredRole="admin" allowedAuthorities={[2]}>
                  <AdminAttendance />
                </PermissionGuard>
              } />
              
              {/* 客服收益提现 */}
              <Route path="/admin/customer-service-funds" element={
                <PermissionGuard requiredRole="admin" allowedAuthorities={[2]}>
                  <AdminCustomerServiceFunds />
                </PermissionGuard>
              } />
              

              

              
              {/* 通知管理 */}
              <Route path="/admin/notifications" element={
                <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 3]}>
                  <AdminNotificationPage />
                </PermissionGuard>
              } />

              {/* API监控 */}
              <Route path="/admin/api-monitor" element={
                <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 3]}>
                  <ApiMonitor />
                </PermissionGuard>
              } />
          <Route path="/admin/api-status" element={
            <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 3]}>
              <ApiStatus />
            </PermissionGuard>
          } />

            
           
           <Route path="/" element={<Home />} />
           <Route path="/login" element={<Login />} />
           <Route path="/register" element={<Register />} />
           <Route path="/banned" element={<Banned />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/messages" element={<Notifications />} />
             <Route path="/player/profile" element={<PlayerProfile />} />
             <Route path="/player/services" element={<PlayerServices />} />
             <Route path="/user/profile" element={<UserProfile />} />
             <Route path="/admin/profile" element={<AdminProfile />} />
             {/* 管理员操作日志 */}
             <Route path="/admin/logs" element={
               <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 2, 3]}>
                 <AdminLogs />
               </PermissionGuard>
             } />
             {/* 管理员安全设置 */}
             <Route path="/admin/security" element={
               <PermissionGuard requiredRole="admin" allowedAuthorities={[1, 2, 3]}>
                 <AdminSecurity />
               </PermissionGuard>
             } />
             <Route path="/player/orders" element={<PlayerOrders />} />
             <Route path="/player/guide" element={<PlayerGuide />} />
            <Route path="/player/funds" element={<PlayerFunds />} />
                      <Route path="/forgot-password" element={<div className="text-center text-xl">Forgot Password - Coming Soon</div>} />
                      <Route path="/user/orders" element={<UserOrders />} />
                      <Route path="/user/favorites" element={<UserFavorites />} />
             <Route path="/booking/:playerId" element={<BookingDetail />} />
             <Route path="/game/:gameId/players" element={<GamePlayersPage />} />
             <Route path="/top-players" element={<TopPlayers />} />
             <Route path="/comment-test" element={<CommentTest />} />
            <Route path="/debug-auth" element={<DebugAuth />} />
             <Route path="/test-comments" element={<TestComments />} />
             <Route path="/api-test" element={<ApiTest />} />
             <Route path="/toast-test" element={<ToastTest />} />
        </Routes>
      </NotificationProvider>
    </AuthContext.Provider>
  );
}