import Header from "@/components/Header";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { get, post, put, del } from "@/services/api";
import { Game } from "@/types/game";
import { AuthContext } from '@/contexts/authContext';
import { buildGameImageUrl } from "@/utils/imageUtils";
import { API_BASE_URL } from '@/config/api';

// 创建游戏请求接口
interface CreateGameRequest {
  name: string;
  image_url?: string;
  uploadFile?: File; // 添加文件上传属性
}

// 更新游戏请求接口
interface UpdateGameRequest {
  name: string;
  image_url?: string;
  uploadFile?: File; // 添加文件上传属性
}

// 扩展 Game 接口以支持文件上传
interface ExtendedGame extends Game {
  uploadFile?: File;
}

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  games?: T;
  game?: Game;
  error?: string;
}

// 获取游戏列表
const getGames = async (): Promise<Game[]> => {
  const response = await get<ApiResponse<Game[]>>('/games');
  if (response.success && response.games) {
    return response.games;
  }
  throw new Error(response.error || '获取游戏列表失败');
};

// 创建游戏
const createGame = async (game: CreateGameRequest): Promise<Game> => {
  console.log('创建游戏请求数据:', game);
  
  // 后端游戏接口只支持JSON格式，不支持FormData
  // 如果有base64图片，直接作为image_url发送
  const gameData = {
    name: game.name,
    image_url: game.image_url || undefined
  };
  
  console.log('发送到后端的数据:', gameData);
  
  const response = await post<ApiResponse<Game>>('/games', gameData);
  console.log('后端响应:', response);
  
  if (response.success && response.game) {
    return response.game;
  }
  throw new Error(response.error || '创建游戏失败');
};

// 更新游戏
const updateGame = async (id: number, game: UpdateGameRequest): Promise<Game> => {
  console.log('更新游戏请求数据:', { id, game });
  
  // 后端游戏接口只支持JSON格式，不支持FormData
  // 如果有base64图片，直接作为image_url发送
  const gameData = {
    name: game.name,
    image_url: game.image_url || undefined
  };
  
  console.log('发送到后端的更新数据:', gameData);
  
  const response = await put<ApiResponse<Game>>(`/games/${id}`, gameData);
  console.log('后端更新响应:', response);
  
  if (response.success && response.game) {
    return response.game;
  }
  throw new Error(response.error || '更新游戏失败');
};

// 删除游戏
const deleteGame = async (id: number): Promise<void> => {
  const response = await del<ApiResponse<void>>(`/games/${id}`);
  if (!response.success) {
    throw new Error(response.error || '删除游戏失败');
  }
};

export default function AdminGameManagement() {
  const { isAuthenticated, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State for games
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isEditingGame, setIsEditingGame] = useState<ExtendedGame | null>(null);
  const [newGame, setNewGame] = useState<CreateGameRequest>({
    name: "",
    image_url: undefined
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editSelectedImage, setEditSelectedImage] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 认证检查
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserRole = localStorage.getItem('userRole');
    
    if (!isAuthenticated || !token || (storedUserRole !== 'admin' && storedUserRole !== 'customer_service')) {
      toast.error('请先以管理员或客服身份登录');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, userRole, navigate]);

  // Fetch games on component mount
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getGames();
      // 确保data是数组，如果不是则使用空数组
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取游戏列表失败';
      setError(errorMessage);
      console.error('Failed to fetch games:', err);
      
      // 确保在错误情况下设置空数组
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  // 切换排序方向
  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    
    const sortedGames = [...games].sort((a, b) => {
      if (newDirection === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    
    setGames(sortedGames);
  };

  // 可用的游戏logo列表
  const availableLogos = [
    { name: 'APEX英雄', path: '/logo/APEX英雄.png' },
    { name: 'CSGO', path: '/logo/CSGO.png' },
    { name: 'DOTA2', path: '/logo/DOTA2.png' },
    { name: '三角洲行动', path: '/logo/三角洲行动.png' },
    { name: '原神', path: '/logo/原神.png' },
    { name: '和平精英', path: '/logo/和平精英.png' },
    { name: '守望先锋2', path: '/logo/守望先锋2.png' },
    { name: '炉石传说', path: '/logo/炉石传说.png' },
    { name: '王者荣耀', path: '/logo/王者荣耀.png' },
    { name: '瓦罗兰特', path: '/logo/瓦罗兰特.png' },
    { name: '绝地求生', path: '/logo/绝地求生.png' },
    { name: '英雄联盟', path: '/logo/英雄联盟.png' }
  ];

  // 处理图片路径选择
  const handleImagePathSelect = (imagePath: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditSelectedImage(imagePath);
      if (isEditingGame) {
        setIsEditingGame({
          ...isEditingGame,
          image_url: imagePath
        });
      }
    } else {
      setSelectedImage(imagePath);
      setNewGame({
        ...newGame,
        image_url: imagePath
      });
    }
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      
      if (isEdit) {
        setEditSelectedImage(previewUrl);
        if (isEditingGame) {
          setIsEditingGame({
            ...isEditingGame,
            image_url: previewUrl,
            uploadFile: file // 存储文件对象
          });
        }
      } else {
        setSelectedImage(previewUrl);
        setNewGame({
          ...newGame,
          image_url: previewUrl,
          uploadFile: file // 存储文件对象
        });
      }
    }
  };

  // 处理添加游戏
  const handleAddGame = async () => {
    if (!newGame.name.trim()) {
      toast.error("请输入有效的游戏名称");
      return;
    }
    
    console.log('🎮 开始添加游戏:', newGame);
    console.log('是否有上传文件:', !!newGame.uploadFile);
    
    try {
      // 如果有上传的文件，使用FormData
      if (newGame.uploadFile) {
        console.log('✅ 使用文件上传方式');
        const formData = new FormData();
        formData.append('name', newGame.name.trim());
        formData.append('image', newGame.uploadFile);
        
        console.log('FormData内容:');
        for (let [key, value] of formData.entries()) {
          console.log(key, value);
        }
        
        console.log('发送请求到:', `${API_BASE_URL}/games`);
        
        const response = await fetch(`${API_BASE_URL}/games`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '添加游戏失败');
        }
        
        const result = await response.json();
        const game = result.game;
        
        setGames(prev => [...prev, game].sort((a, b) => 
          sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        ));
      } else {
        // 使用现有的createGame函数
        const game = await createGame({
          name: newGame.name.trim(),
          image_url: newGame.image_url
        });
        
        setGames(prev => [...prev, game].sort((a, b) => 
          sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        ));
      }
      
      setIsAddingGame(false);
      setNewGame({ name: "", image_url: undefined });
      setSelectedImage(null);
      toast.success("游戏添加成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加游戏失败';
      console.error('Failed to add game:', err);
      toast.error(errorMessage);
    }
  };

  // 处理编辑游戏
  const handleEditGame = async () => {
    if (!isEditingGame || !isEditingGame.name.trim()) {
      toast.error("请输入有效的游戏名称");
      return;
    }
    
    try {
      // 如果有上传的文件，使用FormData
      if (isEditingGame.uploadFile) {
        const formData = new FormData();
        formData.append('name', isEditingGame.name.trim());
        formData.append('image', isEditingGame.uploadFile);
        
        const response = await fetch(`${API_BASE_URL}/games/${isEditingGame.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '更新游戏失败');
        }
        
        const result = await response.json();
        const updatedGame = result.game;
        
        setGames(games.map(game => 
          game.id === isEditingGame.id ? updatedGame : game
        ));
      } else {
        // 使用现有的updateGame函数
        const updatedGame = await updateGame(isEditingGame.id, {
          name: isEditingGame.name.trim(),
          image_url: isEditingGame.image_url
        });
        
        setGames(games.map(game => 
          game.id === isEditingGame.id ? updatedGame : game
        ));
      }
      
      setIsEditingGame(null);
      setEditSelectedImage(null);
      toast.success("游戏更新成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新游戏失败';
      console.error('Failed to update game:', err);
      toast.error(errorMessage);
    }
  };

  // 处理删除游戏
  const handleDeleteGame = async (id: number) => {
    if (!window.confirm("确定要删除这个游戏吗？")) {
      return;
    }
    
    try {
      await deleteGame(id);
      setGames(games.filter(game => game.id !== id));
      toast.success("游戏删除成功");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除游戏失败';
      console.error('Failed to delete game:', err);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-text mb-2">游戏管理</h1>
          <p className="text-theme-text/70">管理游戏类型和相关信息</p>
        </div>
        
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="p-5 border-b border-theme-border flex items-center justify-between">
            <h2 className="font-semibold text-theme-text">游戏管理</h2>
            <button 
              onClick={() => setIsAddingGame(true)}
              className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors"
            >
              <i className="fa-solid fa-plus mr-1"></i>添加游戏
            </button>
          </div>
          
          {/* 添加游戏模态框 */}
          {isAddingGame && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-theme-border flex items-center justify-between">
                  <h3 className="font-semibold text-theme-text">添加新游戏</h3>
                  <button 
                    onClick={() => {
                      setIsAddingGame(false);
                      setNewGame({ name: "", image_url: undefined });
                      setSelectedImage(null);
                    }}
                    className="text-theme-text/70 hover:text-theme-text"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                
                <div className="p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-theme-text mb-1">游戏名称</label>
                    <input
                      type="text"
                      value={newGame.name}
                      onChange={(e) => setNewGame({...newGame, name: e.target.value})}
                      className="w-full px-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                      placeholder="请输入游戏名称"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-theme-text mb-1">游戏图片</label>
                    {selectedImage ? (
                      <div className="flex flex-col items-center p-4 border border-theme-border rounded-lg">
                        <img 
                          src={selectedImage.startsWith('blob:') ? selectedImage : buildGameImageUrl(selectedImage)}
                          alt="Selected game image"
                          className="h-32 w-32 object-cover rounded-md mb-2"
                        />
                        <p className="text-sm text-theme-text/70 mb-2">
                          {selectedImage.startsWith('blob:') ? '上传的文件' : selectedImage}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setNewGame({...newGame, image_url: undefined});
                          }}
                          className="text-theme-error hover:text-theme-error/80 text-sm"
                        >
                          移除图片
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* 文件上传选项 */}
                        <div className="border border-theme-border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-theme-text mb-2">上传新图片</h4>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, false)}
                            className="w-full text-sm text-theme-text/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-theme-primary/10 file:text-theme-primary hover:file:bg-theme-primary/20"
                          />
                        </div>
                        
                        {/* 或者分隔线 */}
                        <div className="flex items-center">
                          <div className="flex-1 border-t border-theme-border"></div>
                          <span className="px-3 text-sm text-theme-text/70">或选择现有图片</span>
                          <div className="flex-1 border-t border-theme-border"></div>
                        </div>
                        
                        {/* 预设图片选择 */}
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-theme-border rounded-lg p-2">
                          {availableLogos.map((logo) => (
                            <div
                              key={logo.path}
                              onClick={() => handleImagePathSelect(logo.path)}
                              className="cursor-pointer p-2 border border-theme-border rounded-lg hover:border-theme-primary hover:bg-theme-primary/10 transition-colors"
                            >
                              <img 
                                src={buildGameImageUrl(logo.path)}
                                alt={logo.name}
                                className="w-full h-16 object-cover rounded mb-1"
                              />
                              <p className="text-xs text-center text-theme-text/70 truncate">{logo.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setIsAddingGame(false);
                        setNewGame({ name: "", image_url: undefined });
                        setSelectedImage(null);
                      }}
                      className="py-2 px-4 bg-theme-surface text-theme-text text-sm font-medium rounded-lg hover:bg-theme-background transition-colors border border-theme-border"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleAddGame}
                      className="py-2 px-4 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 编辑游戏模态框 */}
          {isEditingGame && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-theme-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-theme-border flex items-center justify-between">
                  <h3 className="font-semibold text-theme-text">编辑游戏</h3>
                  <button 
                    onClick={() => {
                      setIsEditingGame(null);
                      setEditSelectedImage(null);
                    }}
                    className="text-theme-text/70 hover:text-theme-text"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                
                <div className="p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-theme-text mb-1">游戏名称</label>
                    <input
                      type="text"
                      value={isEditingGame.name}
                      onChange={(e) => setIsEditingGame({...isEditingGame, name: e.target.value})}
                      className="w-full px-4 py-2 border border-theme-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-background text-theme-text"
                      placeholder="请输入游戏名称"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-theme-text mb-1">游戏图片</label>
                    {editSelectedImage || isEditingGame.image_url ? (
                      <div className="flex flex-col items-center p-4 border border-theme-border rounded-lg">
                        <img 
                          src={editSelectedImage ? 
                            (editSelectedImage.startsWith('blob:') ? editSelectedImage : buildGameImageUrl(editSelectedImage)) : 
                            buildGameImageUrl(isEditingGame.image_url)}
                          alt="Game image"
                          className="h-32 w-32 object-cover rounded-md mb-2"
                        />
                        <p className="text-sm text-theme-text/70 mb-2">
                          {editSelectedImage ? 
                            (editSelectedImage.startsWith('blob:') ? '上传的文件' : editSelectedImage) : 
                            isEditingGame.image_url}
                        </p>
                        <button
                          onClick={() => {
                            setEditSelectedImage(null);
                            if (isEditingGame) {
                              setIsEditingGame({...isEditingGame, image_url: undefined});
                            }
                          }}
                          className="text-theme-error hover:text-theme-error/80 text-sm"
                        >
                          移除图片
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* 文件上传选项 */}
                        <div className="border border-theme-border rounded-lg p-4">
                          <h4 className="text-sm font-medium text-theme-text mb-2">上传新图片</h4>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, true)}
                            className="w-full text-sm text-theme-text/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-theme-primary/10 file:text-theme-primary hover:file:bg-theme-primary/20"
                          />
                        </div>
                        
                        {/* 或者分隔线 */}
                        <div className="flex items-center">
                          <div className="flex-1 border-t border-theme-border"></div>
                          <span className="px-3 text-sm text-theme-text/70">或选择现有图片</span>
                          <div className="flex-1 border-t border-theme-border"></div>
                        </div>
                        
                        {/* 预设图片选择 */}
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-theme-border rounded-lg p-2">
                          {availableLogos.map((logo) => (
                            <div
                              key={logo.path}
                              onClick={() => handleImagePathSelect(logo.path, true)}
                              className="cursor-pointer p-2 border border-theme-border rounded-lg hover:border-theme-primary hover:bg-theme-primary/10 transition-colors"
                            >
                              <img 
                                src={buildGameImageUrl(logo.path)}
                                alt={logo.name}
                                className="w-full h-16 object-cover rounded mb-1"
                              />
                              <p className="text-xs text-center text-theme-text/70 truncate">{logo.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setIsEditingGame(null);
                        setEditSelectedImage(null);
                      }}
                      className="py-2 px-4 bg-theme-surface text-theme-text text-sm font-medium rounded-lg hover:bg-theme-background transition-colors border border-theme-border"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleEditGame}
                      className="py-2 px-4 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/80 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto mb-4"></div>
                <p className="text-theme-text/70">加载游戏列表中...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-theme-error mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-2xl"></i>
                </div>
                <p className="text-theme-text mb-4">{error}</p>
                <button 
                  onClick={loadGames}
                  className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
                >
                  重试
                </button>
              </div>
            ) : games.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-theme-text/40 mb-4">
                  <i className="fa-solid fa-gamepad text-4xl"></i>
                </div>
                <p className="text-theme-text/70 mb-4">暂无游戏数据</p>
                <button 
                  onClick={() => setIsAddingGame(true)}
                  className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
                >
                  添加第一个游戏
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-theme-background">
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">游戏图片</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider cursor-pointer" onClick={toggleSortDirection}>
                      <div className="flex items-center">
                        游戏名称
                        <i className={`fa-solid ml-1 ${sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text/70 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {games.map(game => (
                    <tr key={game.id} className="hover:bg-theme-surface/50 hover:border-theme-accent/30 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{game.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {game.image_url ? (
                          <img 
                            src={buildGameImageUrl(game.image_url)}
                            alt={game.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-theme-background flex items-center justify-center text-theme-text/40">
                            <i className="fa-solid fa-image"></i>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{game.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setIsEditingGame({...game})}
                          className="text-theme-primary hover:text-theme-primary/80 mr-3"
                        >
                          编辑
                        </button>
                        <button 
                          onClick={() => handleDeleteGame(game.id)}
                          className="text-theme-error hover:text-theme-error/80"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}