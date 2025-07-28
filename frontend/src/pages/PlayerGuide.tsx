import Header from "@/components/Header";
import { useNavigate } from 'react-router-dom';

export default function PlayerGuide() {
  const navigate = useNavigate();
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">陪玩指导主页</h1>
            <button 
              onClick={() => navigate('/player/dashboard')}
              className="py-1.5 px-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> 返回工作台
            </button>
          </div>
          <p className="text-gray-500">了解如何成为一名优秀的陪玩，开始您的陪玩之旅</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">陪玩流程指南</h2>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">1</div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">完善个人资料</h3>
                      <p className="text-sm text-gray-600">上传清晰的头像，填写详细的个人介绍和擅长的游戏，设置合理的收费标准。</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">2</div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">等待用户预约</h3>
                      <p className="text-sm text-gray-600">用户会根据您的资料和评分进行预约，保持在线以接收新订单通知。</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">3</div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">接受预约并提供服务</h3>
                      <p className="text-sm text-gray-600">收到预约后及时确认，按照约定时间提供优质的游戏陪玩服务。</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">4</div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">完成服务并获取收益</h3>
                      <p className="text-sm text-gray-600">服务完成后等待用户确认，收益将自动计入您的账户，可随时申请提现。</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">陪玩技巧</h3>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                    <span className="text-sm text-gray-700">保持良好的服务态度，与用户积极沟通</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                    <span className="text-sm text-gray-700">准时开始和结束服务，尊重用户的时间</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                    <span className="text-sm text-gray-700">不断提升游戏技能，提供专业的游戏指导</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                    <span className="text-sm text-gray-700">保持账号活跃，及时响应预约请求</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                    <span className="text-sm text-gray-700">遵守平台规则，营造健康的游戏环境</span>
                  </li>
                </ul>
                
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-gray-900 mb-2">常见问题</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">如何提高接单率？</p>
                      <p className="text-gray-600">完善个人资料，上传真实头像，保持高评分和良好评价。</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">收益如何计算？</p>
                      <p className="text-gray-600">您设置的每小时价格 × 服务时长，平台会收取少量服务费。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}