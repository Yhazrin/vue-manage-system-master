import { API_BASE_URL } from '@/config/api';

// 陪玩个人资料数据接口
export interface PlayerProfileData {
  nickname: string;
  uid: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  skills: string[];
  balance: number;
  withdrawalEarnings: number;
  recipientName: string;
  qrCodeUrl: string | null;
  contactInfo: string;
  joinDate: string;
  totalOrders: number;
  rating: number;
  reviews: number;
}

// 更新陪玩个人资料请求接口
export interface UpdatePlayerProfileRequest {
  nickname?: string;
  skills?: string[];
  recipientName?: string;
  qrCodeUrl?: string | null;
  status?: 'online' | 'offline' | 'busy';
}

// 上传头像请求接口
export interface UploadAvatarRequest {
  avatar: File;
}

// 提现请求接口
export interface WithdrawRequest {
  amount: number;
  recipientName: string;
  qrCodeUrl: string;
}

// 获取陪玩个人资料
export async function getPlayerProfile(): Promise<PlayerProfileData> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/player/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取陪玩个人资料失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching player profile:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        nickname: "专业玩家_Alex",
        uid: "PL12345678",
        avatar: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/1.jpeg",
        status: "online",
        skills: ["FPS", "MOBA", "战术指导"],
        balance: 1250.50,
        withdrawalEarnings: 3200.00,
        recipientName: "张三",
        qrCodeUrl: null,
        contactInfo: "138****5678",
        joinDate: "2023-06-15",
        totalOrders: 156,
        rating: 4.8,
        reviews: 89
      };
    }
    
    throw error;
  }
}

// 更新陪玩个人资料
export async function updatePlayerProfile(data: UpdatePlayerProfileRequest): Promise<PlayerProfileData> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/player/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('更新陪玩个人资料失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating player profile:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟更新成功，返回更新后的数据
      const currentProfile = await getPlayerProfile();
      return {
        ...currentProfile,
        ...data
      };
    }
    
    throw error;
  }
}

// 上传头像
export async function uploadAvatar(file: File): Promise<string> {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/player/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('上传头像失败');
    }

    const result = await response.json();
    return result.avatarUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟上传成功，返回一个模拟的URL
      return `https://example.com/avatars/${Date.now()}.jpg`;
    }
    
    throw error;
  }
}

// 申请提现
export async function requestWithdraw(data: WithdrawRequest): Promise<{ success: boolean; message: string }> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/player/withdraw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('申请提现失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting withdraw:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟提现申请成功
      return {
        success: true,
        message: '提现申请已提交，预计1-3个工作日到账'
      };
    }
    
    throw error;
  }
}

// 获取收益统计
export async function getEarningsStats(): Promise<{
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalEarnings: number;
}> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/player/earnings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取收益统计失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching earnings stats:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        todayEarnings: 125.50,
        weekEarnings: 680.00,
        monthEarnings: 2450.00,
        totalEarnings: 3200.00
      };
    }
    
    throw error;
  }
}