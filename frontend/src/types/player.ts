export interface Review {
  id: number;
  userAvatar: string;
  userName: string;
  rating: number;
  createdAt: string;
  comment: string;
}

export interface Player {
  id: number;
  name: string;
  avatarId: number;
  rating: number;
  reviews: number;
  price: number;
  description: string;
  games: string[];
  services: string[];
  status: 'online' | 'busy' | 'offline';
  isOnline: boolean;
  level: number;
  experience: string;
  responseTime: string;
  completionRate: number;
  tags: string[];
  hourlyRate: number;
  totalOrders: number;
  successRate: number;
  joinDate: string;
  lastActive: string;
  specialties: string[];
  languages: string[];
  timezone: string;
  availability: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  portfolio: {
    images: string[];
    videos: string[];
    achievements: string[];
  };
  socialLinks: {
    discord?: string;
    steam?: string;
    twitch?: string;
  };
  reviewList?: Review[]; // 可选的评价列表
}