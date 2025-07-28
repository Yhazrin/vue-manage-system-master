import Header from "@/components/Header";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { sendNotification, CreateNotificationRequest } from '@/services/notificationService';

export default function AdminNotificationPage() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    title: "",
    content: "",
    recipient: "all" // all, players, users
  });
  const [isSending, setIsSending] = useState(false);
  
  // 处理表单字段变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNotification(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理通知发送
  const handleSendNotification = async () => {
    if (!notification.title.trim() || !notification.content.trim()) {
      toast.error("标题和内容不能为空");
      return;
    }
    
    setIsSending(true);
    
    try {
      const notificationData: CreateNotificationRequest = {
        title: notification.title.trim(),
        content: notification.content.trim(),
        recipient: notification.recipient as 'all' | 'players' | 'users'
      };
      
      await sendNotification(notificationData);
      toast.success("通知发送成功");
      
      // 重置表单
      setNotification({
        title: "",
        content: "",
        recipient: "all"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '通知发送失败';
      console.error('Failed to send notification:', error);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">发布系统通知</h1>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> 返回控制台
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">创建新通知</h2>
              <p className="text-sm text-gray-500">填写以下信息创建并发送系统通知给用户</p>
            </div>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通知标题</label>
                <input
                  type="text"
                  name="title"
                  value={notification.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="请输入通知标题"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通知内容</label>
                <textarea
                  name="content"
                  value={notification.content}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="请输入通知内容"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">接收对象</label>
                <select
                  name="recipient"
                  value={notification.recipient}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">所有用户</option>
                  <option value="players">仅陪玩</option>
                  <option value="users">仅普通玩家</option>
                </select>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendNotification}
                  disabled={isSending}
                  className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i> 发送中...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane mr-2"></i> 发送通知
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
