// 评价类型定义
export interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// 玩家类型定义
export interface Player {
  id: number;
  name: string;
  avatarId: number;
  rating: number;
  reviews: number;
  reviewList: Review[];
  status: 'online' | 'busy' | 'offline';
  description: string;
  games: string[];
  services: string[];
  price: number;
}

// 玩家类型定义保留，但移除模拟数据
