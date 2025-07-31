import { get, post, put, del } from '@/services/api';

// 礼物接口
export interface Gift {
  id: number;
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
  const response = await get('/gifts');
  return response.gifts;
};

// 创建礼物
export const createGift = async (gift: CreateGiftRequest): Promise<Gift> => {
  const response = await post('/gifts', gift);
  return response.gift;
};

// 更新礼物
export const updateGift = async (id: number, gift: UpdateGiftRequest): Promise<Gift> => {
  const response = await put(`/gifts/${id}`, gift);
  return response.gift;
};

// 删除礼物
export const deleteGift = async (id: number): Promise<void> => {
  return await del(`/gifts/${id}`);
};

// 获取送礼记录
export const getGiftRecords = async (): Promise<GiftRecord[]> => {
  return await get('/gift-records');
};

// 根据订单ID获取送礼记录
export const getGiftRecordsByOrderId = async (orderId: string): Promise<GiftRecord[]> => {
  return await get(`/gift-records/order/${orderId}`);
};

// 根据用户ID获取送礼记录
export const getGiftRecordsByUserId = async (userId: string): Promise<GiftRecord[]> => {
  return await get(`/gift-records/user/${userId}`);
};

// 根据陪玩ID获取送礼记录
export const getGiftRecordsByPlayerId = async (playerId: string): Promise<GiftRecord[]> => {
  return await get(`/gift-records/player/${playerId}`);
};