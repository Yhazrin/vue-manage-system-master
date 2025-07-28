export interface Game {
  id: number;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  category: string;
  popularity: number;
  playerCount: number;
  tags: string[];
  releaseDate: string;
  developer: string;
  publisher: string;
  platforms: string[];
  rating: number;
  reviews: number;
  price: number;
  discount?: {
    percentage: number;
    originalPrice: number;
    endDate: string;
  };
  screenshots: string[];
  videos: string[];
  systemRequirements: {
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
  features: string[];
  genres: string[];
  languages: string[];
  ageRating: string;
  onlineFeatures: string[];
}