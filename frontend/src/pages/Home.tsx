import Header from "@/components/Header";
import GameGrid from "@/components/GameGrid";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  
  // FAQ数据
  const faqItems = [
    {
      question: "什么是游戏陪玩平台？",
      answer: "我们是专业的游戏陪玩平台，为玩家提供高质量的游戏陪伴服务。无论您想提升游戏技巧还是寻找游戏伙伴，都能在这里找到合适的陪玩。"
    },
    {
      question: "如何成为游戏陪玩？",
      answer: "注册账号后，在个人中心选择\"成为陪玩\"，填写您擅长的游戏和相关信息，通过审核后即可开始接单。"
    },
    {
      question: "陪玩服务如何收费？",
      answer: "每位陪玩都有自己的收费标准，按小时计费。您可以根据预算和需求选择合适的陪玩。"
    },
    {
      question: "如何保障交易安全？",
      answer: "平台采用担保交易模式，您的支付将由平台托管，服务完成后才会结算给陪玩，确保双方权益。"
    }
  ];

  return (
    <div className="bg-theme-background min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* 英雄区域 */}
        <section className="bg-theme-primary rounded-2xl overflow-hidden mb-12">
          <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
           Vita<br />找到你的游戏伙伴
            </h1>
              <p className="text-lg mb-8 text-white/80">
                无论你是想提升游戏技巧，还是寻找组队开黑的伙伴，我们都能满足你的需求。
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                onClick={() => navigate('/user/dashboard')}
                className="px-6 py-3 bg-theme-surface text-theme-primary font-semibold rounded-lg hover:bg-theme-border transition-colors"
              >
                立即体验
              </button>
              <button 
                onClick={() => navigate('/player/guide')}
                className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                成为陪玩
              </button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <img 
                src="https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20controller%20with%20players%2C%20vibrant%20colors%2C%20modern%20gaming%20aesthetic&sign=3811405250805873faae7924fc7cf6e0" 
                alt="游戏陪玩" 
                className="rounded-lg shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </section>
        
        {/* 平台特点 */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-theme-text mb-3">为什么选择我们</h2>
            <p className="text-theme-text/70 max-w-2xl mx-auto">我们提供专业、安全、便捷的游戏陪玩服务，让你的游戏体验更加精彩</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-theme-surface p-6 rounded-xl shadow-sm border border-theme-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-theme-primary/10 rounded-lg flex items-center justify-center text-theme-primary mb-4">
                <i className="fa-solid fa-user-check text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">严格筛选</h3>
              <p className="text-theme-text/70">每位陪玩都经过严格审核，确保技术水平和服务质量</p>
            </div>
            
            <div className="bg-theme-surface p-6 rounded-xl shadow-sm border border-theme-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                <i className="fa-solid fa-shield-alt text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">安全交易</h3>
              <p className="text-theme-text/70">平台担保交易，资金安全有保障，让你放心消费</p>
            </div>
            
            <div className="bg-theme-surface p-6 rounded-xl shadow-sm border border-theme-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-600 mb-4">
                <i className="fa-solid fa-gamepad text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">多样选择</h3>
              <p className="text-theme-text/70">覆盖多种热门游戏，无论你喜欢什么类型，都能找到合适的陪玩</p>
            </div>
          </div>
        </section>
        
        {/* 游戏分类 */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-theme-text">热门游戏</h2>
            <a href="#" className="text-theme-primary font-medium hover:underline">查看全部</a>
          </div>
          <GameGrid />
        </section>
        
        {/* 如何使用 */}
        <section className="bg-theme-surface p-8 rounded-xl shadow-sm border border-theme-border mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-theme-text mb-3">如何使用</h2>
            <p className="text-theme-text/70 max-w-2xl mx-auto">只需简单三步，开启你的游戏陪玩之旅</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-theme-primary/10 rounded-full flex items-center justify-center text-theme-primary text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">注册账号</h3>
              <p className="text-theme-text/70">创建账号并完善个人信息，设置你的游戏偏好</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-theme-primary/10 rounded-full flex items-center justify-center text-theme-primary text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">选择陪玩</h3>
              <p className="text-theme-text/70">浏览陪玩列表，根据游戏类型和价格筛选合适的陪玩</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-theme-primary/10 rounded-full flex items-center justify-center text-theme-primary text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">开始游戏</h3>
              <p className="text-theme-text/70">预约时间并支付，与陪玩一起享受游戏乐趣</p>
            </div>
          </div>
        </section>
        
        {/* 常见问题 */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-theme-text mb-3">常见问题</h2>
            <p className="text-theme-text/70 max-w-2xl mx-auto">你可能想了解的问题</p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left font-medium flex justify-between items-center"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <span>{item.question}</span>
                  <i className={`fa-solid ${activeFaq === index ? 'fa-chevron-up' : 'fa-chevron-down'} text-theme-text/40`}></i>
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-4 text-theme-text/70">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        
        {/* 行动召唤 */}
        <section className="bg-theme-primary/10 rounded-2xl p-8 text-center mb-8">
          <h2 className="text-3xl font-bold text-theme-text mb-4">准备好开始你的游戏之旅了吗？</h2>
          <p className="text-lg text-theme-text/70 mb-8 max-w-2xl mx-auto">
            加入我们，找到你的游戏伙伴，一起享受游戏的乐趣
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-theme-primary text-white font-semibold rounded-lg hover:bg-theme-primary/90 transition-colors"
            >
              立即注册
            </button>
            <button 
              onClick={() => navigate('/lobby')}
              className="px-8 py-3 bg-theme-surface text-theme-primary font-semibold rounded-lg hover:bg-theme-background transition-colors"
            >
              了解更多
            </button>
          </div>
        </section>
      </main>
      
      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">游戏陪玩平台</h3>
              <p className="mb-4">连接游戏玩家，打造高品质游戏体验</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fa-brands fa-weixin text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fa-brands fa-weibo text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <i className="fa-brands fa-qq text-xl"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">快速链接</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">首页</a></li>
                <li><a href="#" className="hover:text-white transition-colors">浏览陪玩</a></li>
                <li><a href="#" className="hover:text-white transition-colors">成为陪玩</a></li>
                <li><a href="#" className="hover:text-white transition-colors">关于我们</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">支持</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">帮助中心</a></li>
                <li><a href="#" className="hover:text-white transition-colors">常见问题</a></li>
                <li><a href="#" className="hover:text-white transition-colors">联系我们</a></li>
                <li><a href="#" className="hover:text-white transition-colors">用户协议</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <i className="fa-solid fa-envelope mr-2"></i>
                  <span>support@example.com</span>
                </li>
                <li className="flex items-center">
                  <i className="fa-solid fa-phone mr-2"></i>
                  <span>400-123-4567</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2023 游戏陪玩平台. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}