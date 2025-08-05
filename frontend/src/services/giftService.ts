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
  id: number;
  user_id: number;
  player_id: number;
  gift_id: number;
  quantity: number;
  total_price: number;
  platform_fee: number;
  final_amount: number;
  created_at: string;
  user_name?: string;
  player_name?: string;
  gift_name?: string;
  gift_price?: number;
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
  // 映射API返回的字段名到前端期望的字段名
  return response.gifts.map((gift: any) => ({
    id: gift.id,
    name: gift.name,
    price: parseFloat(gift.price) || 0,
    imageUrl: gift.imageUrl || '/default-gift.svg',
    createdAt: gift.createdAt
  }));
};

// 创建礼物
export const createGift = async (gift: CreateGiftRequest): Promise<Gift> => {
  console.log('创建礼物请求数据:', gift);
  
  // 如果有图片文件，使用FormData上传
  if (gift.imageUrl && gift.imageUrl.startsWith('data:')) {
    try {
      const formData = new FormData();
      formData.append('name', gift.name);
      formData.append('price', gift.price.toString());
      
      // 处理base64图片数据
      const base64Data = gift.imageUrl.split(',')[1];
      const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'image/jpeg' });
      formData.append('image', blob, 'gift-image.jpg');
      
      console.log('FormData内容:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      console.log('发送FormData到后端');
      const response = await post('/gifts', formData);
      console.log('后端响应 (FormData):', response);
      console.log('响应类型:', typeof response);
      console.log('响应是否有gift属性:', 'gift' in (response || {}));
      
      if (!response) {
        console.error('响应为空或undefined');
        throw new Error('服务器无响应');
      }
      
      if (!response.gift) {
        console.error('响应中没有gift属性:', Object.keys(response));
        throw new Error('服务器返回数据格式错误 - 缺少gift属性');
      }
      
      const apiGift = response.gift;
      console.log('解析的礼物数据:', apiGift);
      
      return {
        id: apiGift.id,
        name: apiGift.name,
        price: parseFloat(apiGift.price) || 0,
        imageUrl: apiGift.imageUrl || '/default-gift.svg',
        createdAt: apiGift.createdAt
      };
    } catch (error) {
      console.error('FormData处理错误:', error);
      throw error;
    }
  } else {
    // 没有图片或图片是URL
    try {
      const giftData = {
        name: gift.name,
        price: gift.price,
        imageUrl: gift.imageUrl
      };
      
      console.log('发送JSON到后端:', giftData);
      const response = await post('/gifts', giftData);
      console.log('后端响应 (JSON):', response);
      console.log('响应类型:', typeof response);
      console.log('响应是否有gift属性:', 'gift' in (response || {}));
      
      if (!response) {
        console.error('响应为空或undefined');
        throw new Error('服务器无响应');
      }
      
      if (!response.gift) {
        console.error('响应中没有gift属性:', Object.keys(response));
        throw new Error('服务器返回数据格式错误 - 缺少gift属性');
      }
      
      const apiGift = response.gift;
      console.log('解析的礼物数据:', apiGift);
      
      return {
        id: apiGift.id,
        name: apiGift.name,
        price: parseFloat(apiGift.price) || 0,
        imageUrl: apiGift.imageUrl || '/default-gift.svg',
        createdAt: apiGift.createdAt
      };
    } catch (error) {
      console.error('JSON处理错误:', error);
      throw error;
    }
  }
};

// 更新礼物
export const updateGift = async (id: number, gift: UpdateGiftRequest): Promise<Gift> => {
  console.log('🎁 开始更新礼物，ID:', id, '数据:', gift);
  
  try {
    // 如果有新图片文件，使用FormData上传
    if (gift.imageUrl && gift.imageUrl.startsWith('data:')) {
      console.log('🎁 使用FormData方式更新礼物（包含新图片）');
      
      const formData = new FormData();
      formData.append('name', gift.name);
      formData.append('price', gift.price.toString());
      
      // 处理base64图片数据
      const base64Data = gift.imageUrl.split(',')[1];
      const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'image/jpeg' });
      formData.append('image', blob, 'gift-image.jpg');
      
      console.log('🎁 FormData内容:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      const response = await put(`/gifts/${id}`, formData);
      console.log('🎁 礼物更新成功（FormData），响应:', response);
      
      if (!response || !response.gift) {
        console.error('🎁 服务器返回数据格式错误:', response);
        throw new Error('服务器返回数据格式错误');
      }
      
      const apiGift = response.gift;
      return {
        id: apiGift.id,
        name: apiGift.name,
        price: parseFloat(apiGift.price) || 0,
        imageUrl: apiGift.imageUrl || '/default-gift.svg',
        createdAt: apiGift.createdAt
      };
    } else {
      // 没有新图片或图片是URL
      console.log('🎁 使用JSON方式更新礼物（无新图片）');
      
      const response = await put(`/gifts/${id}`, gift);
      console.log('🎁 礼物更新成功（JSON），响应:', response);
      
      if (!response || !response.gift) {
        console.error('🎁 服务器返回数据格式错误:', response);
        throw new Error('服务器返回数据格式错误');
      }
      
      const apiGift = response.gift;
      return {
        id: apiGift.id,
        name: apiGift.name,
        price: parseFloat(apiGift.price) || 0,
        imageUrl: apiGift.imageUrl || '/default-gift.svg',
        createdAt: apiGift.createdAt
      };
    }
  } catch (error) {
    console.error('🎁 礼物更新失败:', error);
    
    // 处理不同类型的错误
    if (error instanceof Error) {
      // 如果错误消息包含特定信息，重新抛出更友好的错误
      if (error.message.includes('400')) {
        if (error.message.includes('已存在')) {
          throw new Error('礼物名称已存在，请使用其他名称');
        } else {
          throw new Error('请求参数错误：请检查礼物名称和价格是否有效');
        }
      } else if (error.message.includes('404')) {
        throw new Error('礼物不存在或已被删除');
      } else if (error.message.includes('403')) {
        throw new Error('权限不足：仅管理员可更新礼物');
      } else if (error.message.includes('401')) {
        throw new Error('请先登录');
      }
    }
    
    // 重新抛出原始错误
    throw error;
  }
};

// 删除礼物
export const deleteGift = async (id: number): Promise<void> => {
  console.log('🎁 开始删除礼物，ID:', id);
  
  try {
    const response = await del(`/gifts/${id}`);
    console.log('🎁 礼物删除成功，响应:', response);
    return response;
  } catch (error) {
    console.error('🎁 礼物删除失败:', error);
    
    // 处理不同类型的错误
    if (error instanceof Error) {
      // 如果错误消息包含特定信息，重新抛出更友好的错误
      if (error.message.includes('400')) {
        throw new Error('无法删除礼物：该礼物已被用户赠送，存在相关的送礼记录');
      } else if (error.message.includes('404')) {
        throw new Error('礼物不存在或已被删除');
      } else if (error.message.includes('403')) {
        throw new Error('权限不足：仅管理员可删除礼物');
      } else if (error.message.includes('401')) {
        throw new Error('请先登录');
      }
    }
    
    // 重新抛出原始错误
    throw error;
  }
};

// 获取送礼记录
export const getGiftRecords = async (): Promise<GiftRecord[]> => {
  const response = await get('/gift-records/all');
  return response.records || [];
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