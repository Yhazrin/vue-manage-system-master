// 基础游戏接口，匹配后端实际数据结构
export interface Game {
  id: number;
  name: string;
}

// 扩展游戏接口，用于前端展示（可选字段）
export interface ExtendedGame extends Game {
  description?: string;
  image?: string;
  imageUrl?: string;
  category?: string;
  popularity?: number;
  playerCount?: number;
  tags?: string[];
  releaseDate?: string;
  developer?: string;
  publisher?: string;
  platforms?: string[];
  rating?: number;
  reviews?: number;
  price?: number;
  discount?: {
    percentage: number;
    originalPrice: number;
    endDate: string;
  };
  screenshots?: string[];
  videos?: string[];
  systemRequirements?: {
    minimum: {
      os: string;
      processor: string;
      memory: string;
      graphics: string;
      storage: string;
    };
    recommended: {
      os: string;
      processor: string;
      memory: string;
      graphics: string;
      storage: string;
    };
  };
  features?: string[];
  genres?: string[];
  languages?: string[];
  ageRating?: string;
  onlineFeatures?: string[];
}