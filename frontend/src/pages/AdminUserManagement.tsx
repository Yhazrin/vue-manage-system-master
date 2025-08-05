import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import { AuthContext } from '@/contexts/authContext';
import { buildAvatarUrl } from '@/utils/imageUtils';
import { fetchJson } from '@/utils/fetchWrapper';

// 定义用户类型接口
interface User {
  id: number;
  name: string;
  phone_num?: string;
  created_at: string;
  status: boolean;
  role?: string;
  photo_img?: string;
  passwd?: string; // 哈希密码字段
  plain_passwd?: string; // 明文密码字段
  orderCount?: number; // 订单数
  // 陪玩特有字段
  game_id?: number;
  money?: number;
  profit?: number;
  intro?: string;
}

export default function AdminUserManagement() {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  // 所有状态和钩子移到组件内部
  const [activeTab, setActiveTab] = useState<'users' | 'players'>('users');
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    phone_num: "",
    intro: ""
  });
  const [loading, setLoading] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(true);

  // 检查认证状态和权限
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');
    
    if (!isAuthenticated || !token || userRole !== 'admin' || storedRole !== 'admin') {
      toast.error('请先以管理员身份登录');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, userRole, navigate]);
  
  // Fetch users on component mount（移到组件内部）
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // 调用真实API获取用户数据
        const data = await fetchJson(`${API_BASE_URL}/users?page=1&pageSize=100`);
        
        // 确保data.users是数组，如果不是则使用空数组
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('获取用户列表失败');
        // 确保在错误情况下设置空数组
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Fetch players on component mount
  useEffect(() => {
    const fetchPlayers = async () => {
        try {
            setPlayersLoading(true);
            // 调用真实API获取陪玩数据
        const data = await fetchJson(`${API_BASE_URL}/players?page=1&pageSize=100`);
        
        // 确保data.players是数组，如果不是则使用空数组
         setPlayers(Array.isArray(data.players) ? data.players : []);
      } catch (error) {
        console.error('Failed to fetch players:', error);
        toast.error('获取陪玩列表失败');
        // 确保在错误情况下设置空数组
        setPlayers([]);
      } finally {
        setPlayersLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);
  
  // 切换用户状态
  const toggleUserStatus = async (id: number, role: 'user' | 'player') => {
    try {
      const endpoint = role === 'user' 
        ? `${API_BASE_URL}/users/${id}/admin-status`
        : `${API_BASE_URL}/players/${id}/admin-status`;
      
      // 获取当前状态
      const currentUser = role === 'user' 
        ? users.find(u => u.id === id)
        : players.find(p => p.id === id);
      
      const newStatus = !currentUser?.status;
      
      const updatedData = await fetchJson(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (role === 'user') {
        // 切换当前状态
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === id 
              ? { ...user, status: !user.status } 
              : user
          )
        );
        toast.success(updatedData.message || '用户状态更新成功');
      } else {
        // 切换当前状态
        setPlayers(prevPlayers => 
          prevPlayers.map(player => 
            player.id === id 
              ? { ...player, status: !player.status } 
              : player
          )
        );
        toast.success(updatedData.message || '陪玩状态更新成功');
      }
    } catch (error) {
      console.error(`Failed to toggle ${role} status:`, error);
      toast.error(`${role === 'user' ? '用户' : '陪玩'}状态更新失败`);
    }
  };

  // 删除陪玩
  const deletePlayer = async (id: number) => {
    if (!confirm('确定要删除这个陪玩用户吗？此操作不可撤销。')) {
      return;
    }

    try {
      await fetchJson(`${API_BASE_URL}/players/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 从列表中移除已删除的陪玩
      setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== id));
      toast.success('陪玩用户删除成功');
    } catch (error) {
      console.error('Failed to delete player:', error);
      toast.error('删除陪玩用户失败');
    }
  };
  
  // 搜索用户/陪玩
  const filteredUsers = users.filter(user => 
    (user.name && user.name.includes(searchTerm)) || 
    (user.id && user.id.toString().includes(searchTerm)) ||
    (user.phone_num && user.phone_num.includes(searchTerm))
  );
  
  const filteredPlayers = players.filter(player => 
    (player.name && player.name.includes(searchTerm)) || 
    (player.id && player.id.toString().includes(searchTerm)) ||
    (player.phone_num && player.phone_num.includes(searchTerm))
  );
  
  // 添加陪玩
  const handleAddPlayer = () => {
    if (!newPlayer.name || !newPlayer.phone_num) {
      toast.error("请填写所有必填字段");
      return;
    }
    
    // 这里应该调用后端API来添加陪玩
    // 暂时只是前端模拟
    const playerToAdd: User = {
      id: Date.now(), // 临时ID
      name: newPlayer.name,
      phone_num: newPlayer.phone_num,
      created_at: new Date().toISOString().split('T')[0],
      status: true,
      intro: newPlayer.intro,
      photo_img: undefined
    };
    
    setPlayers(prevPlayers => [...prevPlayers, playerToAdd]);
    setIsAddingPlayer(false);
    setNewPlayer({ name: "", phone_num: "", intro: "" });
    toast.success("陪玩添加成功");
  };
  
  // 加载状态显示
  if (loading || playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-theme-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-2 text-theme-text/70">正在加载用户数据...</p>
        </div>
      </div>
    );
  }
  
  return (
     <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-theme-text mb-2">用户/陪玩管理</h1>
          <p className="text-theme-text/70">管理平台用户和陪玩账号信息</p>
        </div>
        
        {/* 标签页切换 */}
        <div className="mb-6">
          <div className="inline-flex bg-theme-surface rounded-lg p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users' 
                  ? 'bg-theme-background text-theme-primary shadow-sm' 
                  : 'text-theme-text/70 hover:text-theme-text'
              }`}
            >
              普通用户
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'players' 
                  ? 'bg-theme-background text-theme-primary shadow-sm' 
                  : 'text-theme-text/70 hover:text-theme-text'
              }`}
            >
              陪玩管理
            </button>
          </div>
        </div>
        
        {/* 搜索和添加按钮 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text/40">
              <i className="fa-solid fa-search"></i>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索姓名/手机号/ID..."
              className="w-full pl-10 pr-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
            />
          </div>
          

        </div>
        

        
        {/* 用户/陪玩列表 */}
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-theme-background">
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">用户信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">账号密码</th>
                  {activeTab === 'players' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">擅长技能</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">评分</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">订单数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">注册时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {activeTab === 'users' ? (
                  filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-theme-background">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={buildAvatarUrl(user.photo_img)} alt={user.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-theme-text">{user.name}</div>
                              <div className="text-xs text-theme-text/70">{user.phone_num}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-theme-text">
                            <div>账号: {user.phone_num}</div>
                            <div className="text-xs text-theme-text/70">密码: {user.plain_passwd || '未设置'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{user.orderCount || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{user.created_at}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status 
                              ? 'bg-theme-success/10 text-theme-success' 
                              : 'bg-theme-error/10 text-theme-error'
                          }`}>
                            {user.status ? '正常' : '封禁'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => toggleUserStatus(user.id, 'user')}
                            className={user.status 
                              ? 'text-theme-error hover:text-theme-error/80' 
                              : 'text-theme-success hover:text-theme-success/80'
                            }
                          >
                            {user.status ? '封禁' : '解封'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-theme-text/70">
                        <div className="flex flex-col items-center">
                          <i className="fa-solid fa-users text-2xl mb-2"></i>
                          <p>没有找到匹配的用户</p>
                        </div>
                      </td>
                    </tr>
                  )
                ) : (
                  filteredPlayers.length > 0 ? (
                    filteredPlayers.map(player => (
                      <tr key={player.id} className="hover:bg-theme-background">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{player.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={buildAvatarUrl(player.photo_img)} alt={player.name} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-theme-text">{player.name}</div>
                              <div className="text-xs text-theme-text/70">{player.phone_num}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-theme-text">
                            <div>账号: {player.phone_num}</div>
                            <div className="text-xs text-theme-text/70">密码: {player.plain_passwd || '未设置'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-theme-surface text-theme-text text-xs rounded-full">
                              {player.intro || '暂无介绍'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">★ -</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{player.orderCount || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{player.created_at}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            player.status 
                              ? 'bg-theme-success/10 text-theme-success' 
                              : 'bg-theme-error/10 text-theme-error'
                          }`}>
                            {player.status ? '正常' : '封禁'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => toggleUserStatus(player.id, 'player')}
                              className={player.status 
                                ? 'text-theme-error hover:text-theme-error/80' 
                                : 'text-theme-success hover:text-theme-success/80'
                              }
                            >
                              {player.status ? '封禁' : '解封'}
                            </button>
                            <button 
                              onClick={() => deletePlayer(player.id)}
                              className="text-theme-error hover:text-theme-error/80 ml-2"
                              title="注销陪玩"
                            >
                              注销
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-theme-text/70">
                        <div className="flex flex-col items-center">
                          <i className="fa-solid fa-user-tie text-2xl mb-2"></i>
                          <p>没有找到匹配的陪玩</p>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}