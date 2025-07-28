import Header from "@/components/Header";
import { useState, useEffect } from "react";  // 补充导入useEffect
import { toast } from "sonner";

// 定义用户类型接口
interface User {
  id: string;
  uid: string;
  nickname: string;
  avatar: string;
  phone?: string;
  registerTime: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  role: 'user' | 'player';
  skills?: string[];
  rating?: number;
  orders?: number;
}

export default function AdminUserManagement() {
  // 所有状态和钩子移到组件内部
  const [activeTab, setActiveTab] = useState<'users' | 'players'>('users');
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    nickname: "",
    phone: "",
    skills: ""
  });
  const [loading, setLoading] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(true);
  
  // Fetch users on component mount（移到组件内部）
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // 调用真实API获取用户数据
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('获取用户列表失败');
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
        const response = await fetch('/api/admin/players');
        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }
        const data = await response.json();
        
        setPlayers(data);
      } catch (error) {
        console.error('Failed to fetch players:', error);
        toast.error('获取陪玩列表失败');
      } finally {
        setPlayersLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);
  
  // 切换用户状态
  const toggleUserStatus = (id: string, role: 'user' | 'player') => {
    if (role === 'user') {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === id 
            ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' } 
            : user
        )
      );
    } else {
      setPlayers(prevPlayers => 
        prevPlayers.map(player => 
          player.id === id 
            ? { ...player, status: player.status === 'active' ? 'inactive' : 'active' } 
            : player
        )
      );
    }
  };
  
  // 搜索用户/陪玩
  const filteredUsers = users.filter(user => 
    user.nickname.includes(searchTerm) || 
    user.uid.includes(searchTerm) ||
    (user.phone && user.phone.includes(searchTerm))
  );
  
  const filteredPlayers = players.filter(player => 
    player.nickname.includes(searchTerm) || 
    player.uid.includes(searchTerm) ||
    (player.phone && player.phone.includes(searchTerm))
  );
  
  // 添加陪玩
  const handleAddPlayer = () => {
    if (!newPlayer.nickname || !newPlayer.phone || !newPlayer.skills) {
      toast.error("请填写所有必填字段");
      return;
    }
    
    const skillsArray = newPlayer.skills.split(',').map(skill => skill.trim());
    
    // 生成新ID（处理空数组情况）
    const lastId = players.length > 0 ? players[players.length - 1].id : 'P000';
    const numericPart = parseInt(lastId.replace('P', ''));
    const newId = `P${(numericPart + 1).toString().padStart(3, '0')}`;
    
    const newUid = `PLR${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    const playerToAdd: User = {
      id: newId,
      uid: newUid,
      nickname: newPlayer.nickname,
      avatar: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=new%20player%20avatar&sign=a2ead23e3632b515b4784ac67ce298cf",
      phone: newPlayer.phone,
      registerTime: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().split('T')[0] + " 00:00",
      status: "active",
      role: "player",
      skills: skillsArray,
      rating: 0,
      orders: 0
    };
    
    setPlayers(prevPlayers => [...prevPlayers, playerToAdd]);
    setIsAddingPlayer(false);
    setNewPlayer({ nickname: "", phone: "", skills: "" });
    toast.success("陪玩添加成功");
  };
  
  // 加载状态显示
  if (loading || playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-2 text-gray-600">正在加载用户数据...</p>
        </div>
      </div>
    );
  }
  
  return (
     <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">用户/陪玩管理</h1>
          <p className="text-gray-500">管理平台用户和陪玩账号信息</p>
        </div>
        
        {/* 标签页切换 */}
        <div className="mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              普通用户
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'players' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              陪玩管理
            </button>
          </div>
        </div>
        
        {/* 搜索和添加按钮 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <i className="fa-solid fa-search"></i>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索昵称/手机号/UID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {activeTab === 'players' && (
            <button 
              onClick={() => setIsAddingPlayer(true)}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-plus mr-2"></i>添加陪玩
            </button>
          )}
        </div>
        
        {/* 添加陪玩表单 */}
        {isAddingPlayer && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">添加陪玩信息</h3>
              <button 
                onClick={() => setIsAddingPlayer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">陪玩昵称</label>
                <input
                  type="text"
                  value={newPlayer.nickname}
                  onChange={(e) => setNewPlayer({...newPlayer, nickname: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="请输入陪玩昵称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="text"
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="请输入联系电话"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">擅长技能（用逗号分隔）</label>
                <input
                  type="text"
                  value={newPlayer.skills}
                  onChange={(e) => setNewPlayer({...newPlayer, skills: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="例如：英雄联盟,王者荣耀,无畏契约"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={handleAddPlayer}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                添加陪玩
              </button>
            </div>
          </div>
        )}
        
        {/* 用户/陪玩列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                  {activeTab === 'players' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">擅长技能</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评分</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单数</th>
                    </>
                  )}
                  {activeTab === 'users' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单数</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeTab === 'users' ? (
                  filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.uid}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.nickname} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.nickname}</div>
                              <div className="text-xs text-gray-500">{user.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.orders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.registerTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.lastLogin}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status === 'active' ? '正常' : '封禁'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => toggleUserStatus(user.id, 'user')}
                            className={user.status === 'active' 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                            }
                          >
                            {user.status === 'active' ? '封禁' : '解封'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
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
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.uid}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={player.avatar} alt={player.nickname} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{player.nickname}</div>
                              <div className="text-xs text-gray-500">{player.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {player.skills?.map((skill, index) => (
                              <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">★ {player.rating}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.orders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.registerTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{player.lastLogin}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            player.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {player.status === 'active' ? '正常' : '封禁'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => toggleUserStatus(player.id, 'player')}
                            className={player.status === 'active' 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                            }
                          >
                            {player.status === 'active' ? '封禁' : '解封'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
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