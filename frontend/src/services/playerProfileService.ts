import { API_BASE_URL } from '@/config/api';

// 陪玩个人资料数据接口
export interface PlayerProfileData {
  id: number;
  name: string;
  phone_num: string;
  photo_img: string | null;
  status: boolean;
  intro: string | null;
  game_id: number | null;
  voice: string | null;
  QR_img: string | null;
  money: number;
  profit: number;
  created_at: string;
  // 扩展字段
  totalOrders?: number;
  rating?: number;
  reviews?: number;
}

// 更新陪玩个人资料请求接口
export interface UpdatePlayerProfileRequest {
  name?: string;
  phone_num?: string;
  intro?: string;
  game_id?: number;
}

// 获取陪玩个人资料
export async function getPlayerProfile(): Promise<PlayerProfileData> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 从token中解析用户ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const playerId = payload.id;

    const response = await fetch(`${API_BASE_URL}/players/${playerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '获取陪玩个人资料失败');
    }

    const result = await response.json();
    const player = result.player;

    // 处理头像URL
    if (player.photo_img && !player.photo_img.startsWith('http')) {
      player.photo_img = `${API_BASE_URL}/${player.photo_img}`;
    }

    // 处理二维码URL
    if (player.QR_img && !player.QR_img.startsWith('http')) {
      player.QR_img = `${API_BASE_URL}/${player.QR_img}`;
    }

    // 处理录音URL
    if (player.voice && !player.voice.startsWith('http')) {
      player.voice = `${API_BASE_URL}/${player.voice}`;
    }

    return player;
  } catch (error) {
    console.error('Error fetching player profile:', error);
    throw error;
  }
}

// 更新陪玩个人资料
export async function updatePlayerProfile(data: UpdatePlayerProfileRequest): Promise<PlayerProfileData> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 从token中解析用户ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const playerId = payload.id;

    const response = await fetch(`${API_BASE_URL}/players/${playerId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '更新陪玩个人资料失败');
    }

    // 更新成功后重新获取最新数据
    return await getPlayerProfile();
  } catch (error) {
    console.error('Error updating player profile:', error);
    throw error;
  }
}

// 上传头像
export async function uploadAvatar(file: File): Promise<string> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 从token中解析用户ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const playerId = payload.id;

    const formData = new FormData();
    formData.append('photo_img', file);

    const response = await fetch(`${API_BASE_URL}/players/${playerId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '上传头像失败');
    }

    const result = await response.json();
    
    // 处理不同的响应结构
    let player;
    if (result.player) {
      player = result.player;
    } else if (result.data) {
      player = result.data;
    } else {
      player = result;
    }

    // 处理头像URL
    let avatarUrl = player?.photo_img;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `${API_BASE_URL}/${avatarUrl}`;
    }

    return avatarUrl || '';
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

// 上传二维码
export async function uploadQRCode(file: File): Promise<string> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 从token中解析用户ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const playerId = payload.id;

    const formData = new FormData();
    formData.append('QR_img', file);

    const response = await fetch(`${API_BASE_URL}/players/${playerId}/qr`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '上传二维码失败');
    }

    // 上传成功后重新获取用户资料以获取新的二维码URL
    const updatedProfile = await getPlayerProfile();
    return updatedProfile.QR_img || '';
  } catch (error) {
    console.error('Error uploading QR code:', error);
    throw error;
  }
}

// 删除二维码
export async function deleteQRCode(): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 从token中解析用户ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const playerId = payload.id;

    const response = await fetch(`${API_BASE_URL}/players/${playerId}/qr`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ QR_img: null }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '删除二维码失败');
    }
  } catch (error) {
    console.error('Error deleting QR code:', error);
    throw error;
  }
}

// 更新在线状态
export async function updateStatus(status: boolean): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 从token中解析用户ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const playerId = payload.id;

    const response = await fetch(`${API_BASE_URL}/players/${playerId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '更新状态失败');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

// 上传录音
export async function uploadVoice(file: File): Promise<string> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 从token中解析用户ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const playerId = payload.id;

    const formData = new FormData();
    formData.append('voice', file);

    const response = await fetch(`${API_BASE_URL}/players/${playerId}/voice`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '上传录音失败');
    }

    // 上传成功后重新获取用户资料以获取新的录音URL
    const updatedProfile = await getPlayerProfile();
    return updatedProfile.voice || '';
  } catch (error) {
    console.error('Error uploading voice:', error);
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
    if (!token) {
      throw new Error('请先登录');
    }

    const response = await fetch(`${API_BASE_URL}/player/earnings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '获取收益统计失败');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching earnings stats:', error);
    throw error;
  }
}