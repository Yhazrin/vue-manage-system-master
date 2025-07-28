import { get, post, put, del } from '@/services/api';

// 礼物接口
export interface Gift {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  createdAt: string;
}

// 送礼记录接口
export interface GiftRecord {
  id: string;
  orderId: string;
  userUid: string;
  userName: string;
  playerUid: string;
  playerName: string;
  giftName: string;
  giftPrice: number;
  quantity: number;
  totalPrice: number;
  qrCodeUrl: string;
  createdAt: string;
}

// 创建礼物请求接口
export interface CreateGiftRequest {
  name: string;
  price: number;
  imageUrl?: string;
}

// 更新礼物请求接口
export interface UpdateGiftRequest {
  name: string;
  price: number;
  imageUrl?: string;
}

// 获取礼物列表
export const getGifts = async (): Promise<Gift[]> => {
  return await get('/api/admin/gifts');
};

// 创建礼物
export const createGift = async (gift: CreateGiftRequest): Promise<Gift> => {
  return await post('/api/admin/gifts', gift);
};

// 更新礼物
export const updateGift = async (id: string, gift: UpdateGiftRequest): Promise<Gift> => {
  return await put(`/api/admin/gifts/${id}`, gift);
};

// 删除礼物
export const deleteGift = async (id: string): Promise<void> => {
  return await del(`/api/admin/gifts/${id}`);
};

// 获取送礼记录
export const getGiftRecords = async (): Promise<GiftRecord[]> => {
  return await get('/api/admin/gift-records');
};

// 根据订单ID获取送礼记录
export const getGiftRecordsByOrderId = async (orderId: string): Promise<GiftRecord[]> => {
  return await get(`/api/admin/gift-records/order/${orderId}`);
};

// 根据用户ID获取送礼记录
export const getGiftRecordsByUserId = async (userId: string): Promise<GiftRecord[]> => {
  return await get(`/api/admin/gift-records/user/${userId}`);
};

// 根据陪玩ID获取送礼记录
export const getGiftRecordsByPlayerId = async (playerId: string): Promise<GiftRecord[]> => {
  return await get(`/api/admin/gift-records/player/${playerId}`);
};