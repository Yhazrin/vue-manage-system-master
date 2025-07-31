import Header from "@/components/Header";
import { useNavigate } from 'react-router-dom';

export default function PlayerGuide() {
  const navigate = useNavigate();
  
  return (
    <div className="bg-theme-background min-h-screen text-theme-text">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-text">陪玩指导主页</h1>
          <div className="flex items-center justify-between mt-2">
            <p className="text-theme-text/70">了解如何成为一名优秀的陪玩，开始您的陪玩之旅</p>
            <button 
              onClick={() => navigate('/player/dashboard')}
              className="py-1.5 px-3 bg-theme-primary text-white text-sm font-medium rounded-lg hover:bg-theme-primary/90 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> 返回大厅
            </button>
          </div>
        </div>

        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-theme-text mb-4">陪玩流程指南</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-theme-primary rounded-full flex items-center justify-center text-white text-xl mb-3 mx-auto">1</div>
                <h3 className="font-medium text-theme-text mb-1">完善个人资料</h3>
                <p className="text-sm text-theme-text/70">上传头像、设置个人简介和服务价格</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-theme-primary rounded-full flex items-center justify-center text-white text-xl mb-3 mx-auto">2</div>
                <h3 className="font-medium text-theme-text mb-1">等待用户预约</h3>
                <p className="text-sm text-theme-text/70">保持在线状态，及时响应用户的预约请求</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-theme-primary rounded-full flex items-center justify-center text-white text-xl mb-3 mx-auto">3</div>
                <h3 className="font-medium text-theme-text mb-1">接受预约并提供服务</h3>
                <p className="text-sm text-theme-text/70">确认订单详情，按时提供优质的陪玩服务</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-theme-primary rounded-full flex items-center justify-center text-white text-xl mb-3 mx-auto">4</div>
                <h3 className="font-medium text-theme-text mb-1">完成服务并获取收益</h3>
                <p className="text-sm text-theme-text/70">服务结束后确认完成，收益将自动到账</p>
              </div>
            </div>
          </div>
          
          <div className="bg-theme-background p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-theme-text mb-4">陪玩技巧</h3>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                <span className="text-sm text-theme-text/80">保持良好的服务态度，与用户积极沟通</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                <span className="text-sm text-theme-text/80">准时开始和结束服务，尊重用户的时间</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                <span className="text-sm text-theme-text/80">不断提升游戏技能，提供专业的游戏指导</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                <span className="text-sm text-theme-text/80">保持账号活跃，及时响应预约请求</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                <span className="text-sm text-theme-text/80">遵守平台规则，营造健康的游戏环境</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-theme-primary/10 rounded-lg border border-theme-primary/20">
              <h4 className="font-medium text-theme-text mb-2">常见问题</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-theme-text">如何提高接单率？</p>
                  <p className="text-theme-text/70">完善个人资料，上传真实头像，保持高评分和良好评价。</p>
                </div>
                <div>
                  <p className="font-medium text-theme-text">收益如何计算？</p>
                  <p className="text-theme-text/70">您设置的每小时价格 × 服务时长，平台会收取少量服务费。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}