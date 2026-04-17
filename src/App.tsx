import React, { useState, useEffect } from 'react';
import { Users, QrCode, UserPlus, RefreshCw, LogOut, Trash2, ArrowLeft, CheckCircle2, Flower2, Copy } from 'lucide-react';

// ==========================================
// 春天氛圍裝飾背景組件
// ==========================================
const SpringBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[linear-gradient(135deg,#f0fdf4_0%,#fdf2f8_50%,#fefce8_100%)]">
    {/* 春天元素點綴 */}
    <div className="absolute top-[20px] right-[40px] text-rose-300/60 text-[4rem] transform rotate-[15deg]">🌸</div>
    <div className="absolute bottom-[40px] left-[30px] text-emerald-300/60 text-[4rem] transform -rotate-[10deg]">🌼</div>
    <div className="absolute top-[150px] left-[20px] text-emerald-300/60 text-[4rem] transform -rotate-[20deg]">🍃</div>
    <div className="absolute bottom-[150px] right-[60px] text-emerald-300/60 text-[4rem] transform rotate-[45deg]">🌿</div>
  </div>
);

export default function App() {
  // ==========================================
  // 狀態管理
  // ==========================================
  const [userId, setUserId] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 畫面控制：'home' (首頁), 'member' (組員抽籤), 'leader' (團長後台)
  const [view, setView] = useState('home');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [copied, setCopied] = useState(false);

  // 取得當前網址，用於產生 QR Code
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // ==========================================
  // 認證與資料監聽
  // ==========================================
  useEffect(() => {
    // 簡單的匿名身分產生機制
    let storedId = localStorage.getItem('app_user_id');
    if (!storedId) {
      storedId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('app_user_id', storedId);
    }
    setUserId(storedId);

    // 定期抓取最新名單
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/members');
        const data = await res.json();
        setMembers(data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    
    fetchMembers();
    const intervalId = setInterval(fetchMembers, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  // ==========================================
  // 業務邏輯處理
  // ==========================================
  
  const myRecord = members.find(m => m.id === userId);

  const handleDraw = async () => {
    if (!nickname.trim()) {
      setErrorMsg("請輸入您的暱稱！");
      return;
    }
    if (nickname.length > 10) {
      setErrorMsg("暱稱請勿超過10個字喔！");
      return;
    }
    if (members.length >= 60 && !myRecord) {
      setErrorMsg("總人數已達 60 人上限！無法再加入。");
      return;
    }

    setIsDrawing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          nickname: nickname.trim()
        })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
      } else {
        // Optimistic refresh
        const refreshRes = await fetch('/api/members');
        const refreshData = await refreshRes.json();
        setMembers(refreshData);
      }
    } catch (error) {
      console.error("Save Error:", error);
      setErrorMsg("抽籤失敗，請稍後再試。");
    } finally {
      setIsDrawing(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("確定要清空所有名單嗎？此操作無法還原。")) return;
    
    try {
      setIsDrawing(true);
      await fetch('/api/members', { method: 'DELETE' });
      setMembers([]);
    } catch (error) {
      console.error("Reset Error:", error);
    } finally {
      setIsDrawing(false);
    }
  };

  // ==========================================
  // 畫面渲染 (UI Components)
  // ==========================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
        <SpringBackground />
        <div className="flex flex-col items-center space-y-4 z-10">
          <RefreshCw className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-emerald-700 font-medium tracking-wide">春暖花開，載入中...</p>
        </div>
      </div>
    );
  }

  // --- 視圖 1: 首頁 (選擇身分) ---
  if (view === 'home') {
    return (
      <div className="flex flex-col min-h-screen relative text-slate-800 font-sans">
        <SpringBackground />
        <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-10 max-w-md mx-auto w-full z-10">
          
          <div className="text-center space-y-4 bg-white/60 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/50 w-full">
             <div className="bg-gradient-to-tr from-pink-400 to-emerald-400 p-4 rounded-full inline-block mb-2 shadow-inner">
                <Flower2 className="w-12 h-12 text-white" />
             </div>
             <h1 className="text-3xl font-black text-slate-800 leading-tight">文山家長會<br/>趣味競賽分組</h1>
             <p className="text-slate-600 font-medium">歡迎！請選擇您的身分進入</p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => setView('member')}
              className="w-full flex items-center justify-center space-x-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white py-4 px-6 rounded-2xl shadow-lg shadow-emerald-200 transition-all transform active:scale-95 text-lg font-bold border border-emerald-400 cursor-pointer"
            >
              <UserPlus className="w-6 h-6" />
              <span>我是組員 (進入抽籤)</span>
            </button>
            
            <button 
              onClick={() => setView('leader')}
              className="w-full flex items-center justify-center space-x-3 bg-white/80 hover:bg-pink-50 active:bg-pink-100 text-pink-600 border-2 border-pink-200 py-4 px-6 rounded-2xl shadow-sm transition-all transform active:scale-95 text-lg font-bold backdrop-blur-sm cursor-pointer"
            >
              <QrCode className="w-6 h-6" />
              <span>團長後台 (查看名單)</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- 視圖 2: 組員抽籤畫面 ---
  if (view === 'member') {
    return (
      <div className="flex flex-col min-h-screen relative w-full shadow-xl">
        <SpringBackground />
        <header className="px-4 py-4 flex items-center bg-white/70 backdrop-blur-md border-b border-white/50 z-10 sticky top-0">
          <button onClick={() => setView('home')} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors cursor-pointer">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="ml-2 text-xl font-bold text-slate-800 tracking-wide">抽籤分組</h2>
        </header>

        <main className="flex-1 p-6 flex flex-col items-center justify-center z-10 max-w-md mx-auto w-full">
          {myRecord ? (
            <div className="w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-emerald-100/50 text-center border border-white/60 space-y-6 transform transition-all duration-500 scale-100">
               <div className="flex justify-center">
                 <div className="bg-green-100 p-4 rounded-full">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                 </div>
               </div>
               <div>
                  <h3 className="text-lg font-medium text-slate-500 mb-1">恭喜加入！您的暱稱</h3>
                  <p className="text-3xl font-black text-slate-800">{myRecord.nickname}</p>
               </div>
               <div className="pt-6 border-t border-slate-200/50">
                  <h3 className="text-lg font-medium text-slate-500 mb-3">您被分配至</h3>
                  <div className={`inline-block px-10 py-5 rounded-3xl text-6xl font-black shadow-inner border-2 ${
                    myRecord.group === 'A' 
                    ? 'bg-rose-100 text-rose-600 border-rose-200' 
                    : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                  }`}>
                    {myRecord.group} 組
                  </div>
               </div>
               <p className="text-sm text-slate-400 mt-4">請聽從團長指示前往指定區域集合</p>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-6 bg-white/70 backdrop-blur-md p-8 rounded-3xl border border-white/50 shadow-sm">
               <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-slate-800">準備抽籤</h3>
                  <p className="text-slate-600 mt-2 font-medium">請輸入您的暱稱獲取組別</p>
                  <p className="text-emerald-600 mt-1 text-sm font-bold bg-emerald-100/50 inline-block px-3 py-1 rounded-full">目前參與: {members.length}/60</p>
               </div>
               
               <div className="space-y-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                       setNickname(e.target.value);
                       setErrorMsg('');
                    }}
                    placeholder="輸入暱稱 (最多10字)"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-emerald-100 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none text-lg text-center transition-all font-medium placeholder:text-gray-400"
                    maxLength={10}
                  />
                  {errorMsg && <p className="text-rose-500 text-sm text-center font-bold animate-pulse">{errorMsg}</p>}
               </div>

               <button
                 onClick={handleDraw}
                 disabled={isDrawing || members.length >= 60}
                 className={`w-full py-4 rounded-2xl text-xl font-bold shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                    members.length >= 60 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                 }`}
               >
                 {isDrawing ? '分組中...' : '開始抽籤'}
               </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- 視圖 3: 團長後台 ---
  if (view === 'leader') {
    const groupA = members.filter(m => m.group === 'A');
    const groupB = members.filter(m => m.group === 'B');

    return (
      <div className="flex flex-col min-h-screen relative text-[#1e293b]">
        <SpringBackground />
        
        <header className="h-[80px] px-[40px] flex items-center justify-between bg-[rgba(255,255,255,0.7)] backdrop-blur-[10px] border-b border-[rgba(255,255,255,0.5)] z-10 sticky top-0">
          <div className="flex items-center gap-[12px]">
            <button onClick={() => setView('home')} className="p-2 mr-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors cursor-pointer block md:hidden">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setView('home')} className="hidden md:flex w-[40px] h-[40px] bg-[linear-gradient(to_right_top,#ec4899,#10b981)] rounded-[12px] items-center justify-center text-white text-[24px] cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 border-0 outline-none">
              🌸
            </button>
            <div>
               <h1 className="text-[24px] font-[900] tracking-[-0.5px] text-[#1e293b] leading-tight">文山家長會趣味競賽</h1>
               <p className="text-[12px] font-[700] text-[#10b981] uppercase leading-tight">Spring 2024 Grouping System</p>
            </div>
          </div>
          
          <div className="flex gap-[12px]">
             <div className="hidden sm:block bg-white px-[16px] py-[8px] rounded-[100px] font-[700] text-[#10b981] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] text-[14px]">
               連線狀態：良好
             </div>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-[24px] p-6 lg:p-[30px] z-10 max-w-7xl mx-auto w-full">
           
           <aside className="flex flex-col gap-[20px]">
             <div className="bg-[rgba(255,255,255,0.85)] rounded-[24px] p-[20px] flex justify-around shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-white">
                <div className="text-center">
                   <div className="text-[24px] font-[900] text-[#1e293b]">{members.length}</div>
                   <div className="text-[11px] text-[#10b981] font-[700]">總人數</div>
                </div>
                <div className="text-center">
                   <div className="text-[24px] font-[900] text-[#1e293b]">60</div>
                   <div className="text-[11px] text-[#10b981] font-[700]">上限</div>
                </div>
                <div className="text-center">
                   <div className="text-[24px] font-[900] text-[#1e293b]">{Math.round((members.length/60)*100)}%</div>
                   <div className="text-[11px] text-[#10b981] font-[700]">進度</div>
                </div>
             </div>

             <button 
                onClick={handleReset}
                disabled={isDrawing || members.length === 0}
                className="mt-auto bg-[#fff1f2] text-[#f43f5e] border border-[#fecdd3] p-[16px] rounded-[20px] font-[700] flex items-center justify-center gap-[8px] cursor-pointer disabled:opacity-50 transition-colors hover:bg-rose-100"
             >
               <RefreshCw className="w-5 h-5" /> 重置所有分組資料
             </button>
           </aside>

           <section className="grid grid-cols-1 md:grid-cols-2 gap-[24px] content-start">
              
              <div className="bg-[rgba(255,255,255,0.4)] rounded-[32px] flex flex-col overflow-hidden border border-[rgba(255,255,255,0.6)] backdrop-blur-[5px] min-h-[400px]">
                 <div className="bg-[linear-gradient(to_right,#f43f5e,#fb7185)] px-[24px] py-[20px] flex justify-between items-center text-white">
                    <div className="flex items-center gap-[10px] font-[900] text-[20px]"><span className="leading-none">🌸</span> A 組</div>
                    <div className="bg-[rgba(255,255,255,0.2)] px-[12px] py-[4px] rounded-[100px] text-[12px] font-[700]">{groupA.length} 人</div>
                 </div>
                 <div className="p-[16px] flex-1">
                    {groupA.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-[#f43f5e] opacity-50 font-medium">目前尚無成員</div>
                    ) : (
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px]">
                          {groupA.map((m) => (
                             <div key={m.id} className="bg-white text-[#f43f5e] py-[12px] px-[8px] rounded-[16px] text-center font-[700] text-[14px] shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.05)] whitespace-nowrap overflow-hidden text-ellipsis cursor-default">
                                {m.nickname}
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>

              <div className="bg-[rgba(255,255,255,0.4)] rounded-[32px] flex flex-col overflow-hidden border border-[rgba(255,255,255,0.6)] backdrop-blur-[5px] min-h-[400px]">
                 <div className="bg-[linear-gradient(to_right,#10b981,#2dd4bf)] px-[24px] py-[20px] flex justify-between items-center text-white">
                    <div className="flex items-center gap-[10px] font-[900] text-[20px]"><span className="leading-none">🍃</span> B 組</div>
                    <div className="bg-[rgba(255,255,255,0.2)] px-[12px] py-[4px] rounded-[100px] text-[12px] font-[700]">{groupB.length} 人</div>
                 </div>
                 <div className="p-[16px] flex-1">
                    {groupB.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-[#10b981] opacity-50 font-medium">目前尚無成員</div>
                    ) : (
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px]">
                          {groupB.map((m) => (
                             <div key={m.id} className="bg-white text-[#10b981] py-[12px] px-[8px] rounded-[16px] text-center font-[700] text-[14px] shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.05)] whitespace-nowrap overflow-hidden text-ellipsis cursor-default">
                                {m.nickname}
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>

           </section>
        </main>
      </div>
    );
  }

  return null;
}
