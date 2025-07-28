// API 配置
export const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8080/api'
  : '/api';

// API 端点
export const API_ENDPOINTS = {
  // 用户相关
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
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