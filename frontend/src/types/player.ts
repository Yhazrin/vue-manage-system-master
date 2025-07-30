export interface Review {
  id: number;
  userAvatar: string;
  userName: string;
  rating: number;
  createdAt: string;
  comment: string;
}

// 后端返回的基础陪玩数据结构
export interface Player {
  id: number;
  name: string;
  photo_img?: string;
  intro?: string;
  status: number | boolean; // 后端返回number(0/1)，前端可能需要boolean
  voice?: string;
  game_id?: number;
  
  // 前端扩展字段（用于兼容现有组件）
  avatarId?: number;
  rating?: number;
  reviews?: number;
  price?: number;
  description?: string;
  games?: string[];
  services?: string[];
  isOnline?: boolean;
  level?: number;
  experience?: string;
  responseTime?: string;
  completionRate?: number;
  tags?: string[];
  hourlyRate?: number;
  totalOrders?: number;
  successRate?: number;
  joinDate?: string;
  lastActive?: string;
  specialties?: string[];
  languages?: string[];
  timezone?: string;
  availability?: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  portfolio?: {
    images: string[];
    videos: string[];
    achievements: string[];
  };
  socialLinks?: {
    discord?: string;
    steam?: string;
    twitch?: string;
  };
  reviewList?: Review[]; // 可选的评价列表
}