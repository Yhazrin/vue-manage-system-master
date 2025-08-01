import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { get, post, put, del } from "@/services/api";
import { Game } from "@/types/game";

// 创建游戏请求接口
interface CreateGameRequest {
  name: string;
  image_url?: string;
}

// 更新游戏请求接口
interface UpdateGameRequest {
  name: string;
  image_url?: string;
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
  // 如果有图片文件，使用FormData上传
  if (game.image_url && game.image_url.startsWith('data:')) {
    const formData = new FormData();
    formData.append('name', game.name);
    
    // 处理base64图片数据
    const base64Data = game.image_url.split(',')[1];
    const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'image/jpeg' });
    formData.append('image', blob, 'game-image.jpg');
    
    const response = await post<ApiResponse<Game>>('/games', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response.success && response.game) {
      return response.game;
    }
    throw new Error(response.error || '创建游戏失败');
  } else {
    // 没有图片或图片是URL
    const response = await post<ApiResponse<Game>>('/games', game);
    if (response.success && response.game) {
      return response.game;
    }
    throw new Error(response.error || '创建游戏失败');
  }
};

// 更新游戏
const updateGame = async (id: number, game: UpdateGameRequest): Promise<Game> => {
  // 如果有新图片文件，使用FormData上传
  if (game.image_url && game.image_url.startsWith('data:')) {
    const formData = new FormData();
    formData.append('name', game.name);
    
    // 处理base64图片数据
    const base64Data = game.image_url.split(',')[1];
    const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'image/jpeg' });
    formData.append('image', blob, 'game-image.jpg');
    
    const response = await put<ApiResponse<Game>>(`/games/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response.success && response.game) {
      return response.game;
    }
    throw new Error(response.error || '更新游戏失败');
  } else {
    // 没有新图片或图片是URL
    const response = await put<ApiResponse<Game>>(`/games/${id}`, game);
    if (response.success && response.game) {
      return response.game;
    }
    throw new Error(response.error || '更新游戏失败');
  }
};

// 删除游戏
const deleteGame = async (id: number): Promise<void> => {
  const response = await del<ApiResponse<void>>(`/games/${id}`);
  if (!response.success) {
    throw new Error(response.error || '删除游戏失败');
  }
};

export default function AdminGameManagement() {
  // State for games
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isEditingGame, setIsEditingGame] = useState<Game | null>(null);
  const [newGame, setNewGame] = useState<CreateGameRequest>({
    name: "",
    image_url: undefined
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editSelectedImage, setEditSelectedImage] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target?.result as string;
        if (isEdit) {
          setEditSelectedImage(base64Image);
          if (isEditingGame) {
            setIsEditingGame({
              ...isEditingGame,
              image_url: base64Image
            });
          }
        } else {
          setSelectedImage(base64Image);
          setNewGame({
            ...newGame,
            image_url: base64Image
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理添加游戏
  const handleAddGame = async () => {
    if (!newGame.name.trim()) {
      toast.error("请输入有效的游戏名称");
      return;
    }
    
    try {
      const game = await createGame({
        name: newGame.name.trim(),
        image_url: newGame.image_url
      });
      
      setGames(prev => [...prev, game].sort((a, b) => 
        sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      ));
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
      const updatedGame = await updateGame(isEditingGame.id, {
        name: isEditingGame.name.trim(),
        image_url: isEditingGame.image_url
      });
      
      setGames(games.map(game => 
        game.id === isEditingGame.id ? updatedGame : game
      ));
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">游戏管理</h1>
          <p className="text-gray-500">管理游戏类型和相关信息</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">游戏管理</h2>
            <button 
              onClick={() => setIsAddingGame(true)}
              className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-plus mr-1"></i>添加游戏
            </button>
          </div>
          
          {/* 添加游戏模态框 */}
          {isAddingGame && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">添加新游戏</h3>
                  <button 
                    onClick={() => {
                      setIsAddingGame(false);
                      setNewGame({ name: "", image_url: undefined });
                      setSelectedImage(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                
                <div className="p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">游戏名称</label>
                    <input
                      type="text"
                      value={newGame.name}
                      onChange={(e) => setNewGame({...newGame, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="请输入游戏名称"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">游戏图片</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        {selectedImage ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={selectedImage}
                              alt="Selected game image"
                              className="h-48 w-48 object-cover rounded-md mb-2"
                            />
                            <button
                              onClick={() => {
                                setSelectedImage(null);
                                setNewGame({...newGame, image_url: undefined});
                              }}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              移除图片
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <i className="fa-solid fa-image text-gray-400 text-4xl mb-2"></i>
                            <div className="flex text-sm text-gray-600">
                              <label for="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none">
                                <span>上传图片</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageSelect} />
                              </label>
                              <p className="pl-1">或拖放文件</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG (最大 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setIsAddingGame(false);
                        setNewGame({ name: "", image_url: undefined });
                        setSelectedImage(null);
                      }}
                      className="py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleAddGame}
                      className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
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
              <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">编辑游戏</h3>
                  <button 
                    onClick={() => {
                      setIsEditingGame(null);
                      setEditSelectedImage(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                
                <div className="p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">游戏名称</label>
                    <input
                      type="text"
                      value={isEditingGame.name}
                      onChange={(e) => setIsEditingGame({...isEditingGame, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="请输入游戏名称"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">游戏图片</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        {editSelectedImage || isEditingGame.image_url ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={editSelectedImage || isEditingGame.image_url}
                              alt="Game image"
                              className="h-48 w-48 object-cover rounded-md mb-2"
                            />
                            <button
                              onClick={() => {
                                setEditSelectedImage(null);
                                if (isEditingGame) {
                                  setIsEditingGame({...isEditingGame, image_url: undefined});
                                }
                              }}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              移除图片
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <i className="fa-solid fa-image text-gray-400 text-4xl mb-2"></i>
                            <div className="flex text-sm text-gray-600">
                              <label for="edit-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none">
                                <span>上传图片</span>
                                <input id="edit-file-upload" name="edit-file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageSelect(e, true)} />
                              </label>
                              <p className="pl-1">或拖放文件</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG (最大 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setIsEditingGame(null);
                        setEditSelectedImage(null);
                      }}
                      className="py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleEditGame}
                      className="py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">加载游戏列表中...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-500 mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-2xl"></i>
                </div>
                <p className="text-gray-700 mb-4">{error}</p>
                <button 
                  onClick={loadGames}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  重试
                </button>
              </div>
            ) : games.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <i className="fa-solid fa-gamepad text-4xl"></i>
                </div>
                <p className="text-gray-500 mb-4">暂无游戏数据</p>
                <button 
                  onClick={() => setIsAddingGame(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  添加第一个游戏
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">游戏图片</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={toggleSortDirection}>
                      <div className="flex items-center">
                        游戏名称
                        <i className={`fa-solid ml-1 ${sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {games.map(game => (
                    <tr key={game.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {game.image_url ? (
                          <img 
                            src={game.image_url}
                            alt={game.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                            <i className="fa-solid fa-image"></i>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setIsEditingGame({...game})}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          编辑
                        </button>
                        <button 
                          onClick={() => handleDeleteGame(game.id)}
                          className="text-red-600 hover:text-red-900"
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