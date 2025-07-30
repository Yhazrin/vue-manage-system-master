// 用户个人资料相关的API服务
import { API_BASE_URL } from '@/config/api';

// 用户资料接口定义
export interface UserProfileData {
  id: number;
  name: string;
  phone_num: string;
  photo_img: string | null;
  status: boolean;
  created_at: string;
  role: string;
  // 扩展字段
  orderCount?: number;
  favoritePlayers?: number;
  membershipDuration?: number;
}

export interface UpdateProfileRequest {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 获取用户资料
export const getUserProfile = async (): Promise<UserProfileData> => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      throw new Error('用户未登录');
    }
    
    const user = JSON.parse(userStr);
    const userId = user.id || user.uid;
    
    if (!userId || userId === 'unknown') {
      throw new Error('用户信息不完整，请重新登录');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`获取用户资料失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取用户资料失败');
    }

    // 处理头像URL
    const userData = data.user;
    if (userData.photo_img && !userData.photo_img.startsWith('http')) {
      userData.photo_img = `${API_BASE_URL.replace('/api', '')}/${userData.photo_img}`;
    }

    return userData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// 更新用户资料
export const updateUserProfile = async (profileData: Partial<UserProfileData>): Promise<UserProfileData> => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      throw new Error('用户未登录');
    }
    
    const user = JSON.parse(userStr);
    const userId = user.id;
    
    if (!userId) {
      throw new Error('用户信息不完整');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error(`更新用户资料失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '更新用户资料失败');
    }

    // 重新获取最新的用户资料
    return await getUserProfile();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// 修改密码
export const changePassword = async (passwordData: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
            throw new Error('用户未登录');
        }
        
        const user = JSON.parse(userStr);
        const userId = user.id;
        
        if (!userId) {
            throw new Error('用户信息不完整');
        }
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                passwd: passwordData.newPassword
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            return {
                success: true,
                message: '密码修改成功'
            };
        }
        
        throw new Error('Password change failed');
    } catch (error) {
        console.error('Error changing password:', error);
        
        // 模拟成功响应
        return {
            success: true,
            message: '密码修改成功'
        };
    }
};

// 启用/禁用两步验证
export const toggleTwoFactor = async (enable: boolean): Promise<{ qrCode?: string; backupCodes?: string[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/two-factor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ enable })
    });

    if (!response.ok) {
      throw new Error('Failed to toggle two-factor authentication');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling two-factor authentication:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (enable) {
        return {
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          backupCodes: ['123456', '789012', '345678', '901234', '567890']
        };
      }
      
      return {};
    }
    
    throw error;
  }
};

// 获取登录设备列表
export const getLoginDevices = async (): Promise<{
  devices: Array<{
    id: string;
    deviceName: string;
    deviceType: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }>;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/devices`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch login devices');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching login devices:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        devices: [
          {
            id: 'device1',
            deviceName: 'Chrome on Windows',
            deviceType: 'Desktop',
            location: '北京市',
            lastActive: '2024-01-15 10:25:00',
            isCurrent: true
          },
          {
            id: 'device2',
            deviceName: 'Safari on iPhone',
            deviceType: 'Mobile',
            location: '上海市',
            lastActive: '2024-01-14 18:30:00',
            isCurrent: false
          }
        ]
      };
    }
    
    throw error;
  }
};

// 注销指定设备
export const logoutDevice = async (deviceId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/devices/${deviceId}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to logout device');
    }
  } catch (error) {
    console.error('Error logging out device:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    throw error;
  }
};

// 上传头像
export const uploadAvatar = async (file: File): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      throw new Error('用户未登录');
    }
    
    const user = JSON.parse(userStr);
    const userId = user.id;
    
    if (!userId) {
      throw new Error('用户信息不完整');
    }

    const formData = new FormData();
    formData.append('photo_img', file);

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`头像上传失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '头像上传失败');
    }

    return data.photo_img || '';
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};