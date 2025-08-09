import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
  import { Toaster } from "sonner";
  import { ConfigProvider, theme } from 'antd';
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
import UnifiedWithdrawalManagement from "@/pages/UnifiedWithdrawalManagement";
import AdminNotificationPage from "@/pages/AdminNotificationPage";
import AdminDataManagement from "@/pages/AdminDataManagement";
import ApiMonitor from "@/pages/ApiMonitor";
import ApiStatus from "@/pages/ApiStatus";
import AdminPermissionManagement from "@/pages/AdminPermissionManagement";
import AdminLogs from "@/pages/AdminLogs";
import AdminSecurity from "@/pages/AdminSecurity";
// 客服端组件
import CustomerServiceLayout from "@/components/CustomerServiceLayout";
import CustomerServiceDashboard from "@/pages/CustomerServiceDashboard";
import CustomerServiceProfile from "@/pages/CustomerServiceProfile";

import BookingDetail from "@/pages/BookingDetail";
import GamePlayersPage from "@/pages/GamePlayersPage";
import PlayerServices from "@/pages/PlayerServices";
import Notifications from "@/pages/Notifications";
import Banned from "@/pages/Banned";
import TopPlayers from "@/pages/TopPlayers";
import AuthChecker from "@/components/AuthChecker";
import { useState } from "react";
import { AuthContext, UserInfo } from '@/contexts/authContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AttendanceProvider } from '@/contexts/AttendanceContext';
import PermissionGuard from '@/components/PermissionGuard';
import WorkStatusIndicator from '@/components/WorkStatusIndicator';

export default function App() {
  // 从localStorage加载认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [userRole, setUserRole] = useState<'user' | 'player' | 'admin' | 'customer_service' | null>(
    localStorage.getItem('userRole') as 'user' | 'player' | 'admin' | 'customer_service' | null
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

  const setAuth = (value: boolean, role?: 'user' | 'player' | 'admin' | 'customer_service', userInfoParam?: UserInfo) => {
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
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: 'var(--theme-primary)',
            colorBgContainer: 'var(--theme-surface)',
            colorBgElevated: 'var(--theme-surface)',
            colorBgLayout: 'var(--theme-background)',
            colorText: 'var(--theme-text)',
            colorTextSecondary: 'var(--theme-text)',
            colorBorder: 'var(--theme-border)',
            colorBorderSecondary: 'var(--theme-border)',
            borderRadius: 8,
            fontSize: 14,
          },
          components: {
            Modal: {
              contentBg: 'var(--theme-surface)',
              headerBg: 'var(--theme-surface)',
              titleColor: 'var(--theme-text)',
            },
            Table: {
              headerBg: 'var(--theme-surface)',
              bodySortBg: 'var(--theme-background)',
              rowHoverBg: 'var(--theme-surface)',
            },
            Card: {
              colorBgContainer: 'var(--theme-surface)',
              colorTextHeading: 'var(--theme-text)',
            },
            Button: {
              colorText: 'var(--theme-text)',
              colorBorder: 'var(--theme-border)',
            },
            Select: {
              colorBgContainer: 'var(--theme-surface)',
              colorText: 'var(--theme-text)',
              colorBorder: 'var(--theme-border)',
            },
            Input: {
              colorBgContainer: 'var(--theme-surface)',
              colorText: 'var(--theme-text)',
              colorBorder: 'var(--theme-border)',
            },
          },
        }}
      >
        <NotificationProvider>
          <AttendanceProvider>
            <AuthChecker />
            <WorkStatusIndicator />
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

             {/* 客服端路由 */}
            <Route path="/customer-service/login" element={<Login />} />
             <Route path="/customer-service/*" element={<CustomerServiceLayout />}>
               <Route path="dashboard" element={<CustomerServiceDashboard />} />
               <Route path="profile" element={<CustomerServiceProfile />} />
               <Route path="games" element={
                 <PermissionGuard requiredRole="customer_service">
                   <AdminGameManagement />
                 </PermissionGuard>
               } />
             </Route>

              {/* 管理员数据概览 */}
              <Route path="/admin/overview" element={
                <PermissionGuard requiredRole="admin">
                  <AdminOverview />
                </PermissionGuard>
              } />

              {/* 管理员订单管理 */}
              <Route path="/admin/orders" element={
                <PermissionGuard requiredRole="admin">
                  <AdminOrders />
                </PermissionGuard>
              } />
              {/* 管理员用户/陪玩管理 */}
               <Route path="/admin/users" element={
                 <PermissionGuard requiredRole="admin">
                   <AdminUserManagement />
                 </PermissionGuard>
               } />
             {/* 礼物管理 */}
             <Route path="/admin/gifts" element={
               <PermissionGuard requiredRole="admin">
                 <AdminGiftManagement />
               </PermissionGuard>
             } />
             {/* 游戏管理 */}
             <Route path="/admin/games" element={
               <PermissionGuard requiredRole="admin">
                 <AdminGameManagement />
               </PermissionGuard>
             } />
              {/* 提现管理 */}
              <Route path="/admin/withdrawals" element={
                <PermissionGuard requiredRole="admin">
                  <UnifiedWithdrawalManagement />
                </PermissionGuard>
              } />
              {/* 客服管理 */}
              <Route path="/admin/customer-service-management" element={
                <PermissionGuard requiredRole="admin">
                  <AdminPermissionManagement />
                </PermissionGuard>
              } />
              

              

              

              
              {/* 通知管理 */}
              <Route path="/admin/notifications" element={
                <PermissionGuard requiredRole="admin">
                  <AdminNotificationPage />
                </PermissionGuard>
              } />

              {/* API监控 */}
              <Route path="/admin/api-monitor" element={
                <PermissionGuard requiredRole="admin">
                  <ApiMonitor />
                </PermissionGuard>
              } />
          <Route path="/admin/api-status" element={
            <PermissionGuard requiredRole="admin">
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
               <PermissionGuard requiredRole="admin">
                 <AdminLogs />
               </PermissionGuard>
             } />
             {/* 管理员安全设置 */}
             <Route path="/admin/security" element={
               <PermissionGuard requiredRole="admin">
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
        </Routes>
          </AttendanceProvider>
        </NotificationProvider>
      </ConfigProvider>
    </AuthContext.Provider>
  );
}