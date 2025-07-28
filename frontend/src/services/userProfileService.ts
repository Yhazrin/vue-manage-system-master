// 用户资料相关的API服务

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
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return await response.json();
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
export const updateUserProfile = async (data: UpdateProfileRequest): Promise<UserProfileData> => {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟更新成功，返回更新后的数据
      const currentProfile = await getUserProfile();
      return {
        ...currentProfile,
        ...data,
        lastLogin: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
    }
    
    throw error;
  }
};

// 修改密码
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  try {
    if (data.newPassword !== data.confirmPassword) {
      throw new Error('新密码和确认密码不匹配');
    }

    const response = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to change password');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    
    // 开发环境下的模拟
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟密码验证
      if (data.currentPassword !== 'oldpassword') {
        throw new Error('当前密码不正确');
      }
      
      return;
    }
    
    throw error;
  }
};

// 启用/禁用两步验证
export const toggleTwoFactor = async (enable: boolean): Promise<{ qrCode?: string; backupCodes?: string[] }> => {
  try {
    const response = await fetch('/api/user/two-factor', {
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