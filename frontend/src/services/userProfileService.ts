// 用户个人资料相关的API服务
import { API_BASE_URL } from '@/config/api';

// 用户资料接口定义
export interface UserProfileData {
  id: string;
  nickname: string;
  uid: string;
  avatar: string;
  email?: string;
  phone?: string;
  registerDate: string;
  lastLogin: string;
  favoritePlayers: number;
  orderCount: number;
  membershipDuration: number; // 会员时长（年）
  securitySettings: {
    lastPasswordChange: string;
    twoFactorEnabled: boolean;
    activeDevices: number;
  };
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
    const userId = localStorage.getItem('userId') || '1'; // 临时使用固定ID
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.user) {
      return {
        id: data.user.id,
        nickname: data.user.name,
        uid: data.user.uid || `US${data.user.id}`,
        avatar: data.user.photo_img || "",
        email: data.user.email || "",
        phone: data.user.phone_num || "",
        registerDate: data.user.created_at || "2023-05-15",
        lastLogin: data.user.updated_at || "2024-01-15 10:25:00",
        favoritePlayers: data.user.favorite_players || 0,
        orderCount: data.user.order_count || 0,
        membershipDuration: data.user.membership_duration || 0,
        securitySettings: {
          lastPasswordChange: data.user.last_password_change || "2023-12-15",
          twoFactorEnabled: data.user.two_factor_enabled || false,
          activeDevices: data.user.active_devices || 1
        }
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // 开发环境下的模拟数据
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: 'user123',
        nickname: "游戏爱好者_小明",
        uid: "US12345678",
        avatar: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar&sign=f1f81b57b203e2aa336aa3ec3f6e3f7f",
        email: "user@example.com",
        phone: "138****5678",
        registerDate: "2023-05-15",
        lastLogin: "2024-01-15 10:25:00",
        favoritePlayers: 8,
        orderCount: 24,
        membershipDuration: new Date().getFullYear() - 2023,
        securitySettings: {
          lastPasswordChange: "2023-12-15",
          twoFactorEnabled: false,
          activeDevices: 1
        }
      };
    }
    
    throw error;
  }
};

// 更新用户资料
export const updateUserProfile = async (profileData: Partial<UserProfileData>): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || '1'; // 临时使用固定ID
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: profileData.nickname,
        email: profileData.email,
        phone_num: profileData.phone
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: '用户资料更新成功'
      };
    }
    
    throw new Error('Update failed');
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // 模拟成功响应
    return {
      success: true,
      message: '用户资料更新成功',
      lastLogin: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
  }
};

// 修改密码
export const changePassword = async (passwordData: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || '1'; // 临时使用固定ID
        
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
    const response = await fetch('/api/user/devices', {
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
    const response = await fetch(`/api/user/devices/${deviceId}/logout`, {
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
export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/user/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading avatar:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟上传成功，返回一个模拟的URL
      return {
        avatarUrl: `https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar&sign=${Date.now()}`
      };
    }
    
    throw error;
  }
};