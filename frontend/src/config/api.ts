// API 配置
export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api'
  : '/api';

// API 端点
export const API_ENDPOINTS = {
  // 用户相关
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // 实际后端端点
  USER_LOGIN: '/users/login',
  PLAYER_LOGIN: '/players/login', 
  MANAGER_LOGIN: '/managers/login',
  
  // 游戏相关
  GAMES: '/games',
  GAME_DETAIL: '/games/:id',
  
  // 玩家相关
  PLAYERS: '/players',
  PLAYER_DETAIL: '/players/:id',
  PLAYER_PROFILE: '/player/profile',
  PLAYER_AVATAR: '/player/avatar',
  PLAYER_EARNINGS: '/player/earnings',
  PLAYER_WITHDRAW: '/player/withdraw',
  
  // 预约相关
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: '/bookings/:id',
  
  // 收藏相关
  FAVORITES: '/favorites',
};

// 请求配置
export const REQUEST_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};