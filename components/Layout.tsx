
import React, { useEffect, useState } from 'react';
import { UserAccount } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  account: UserAccount;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, account }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { id: 'audit', label: 'Compliance Engine', icon: 'fa-microchip', sub: 'Technical Verification' },
    { id: 'git', label: 'Repository Scan', icon: 'fa-code-branch', sub: 'Monitoring & CI/CD' },
    { id: 'chat', label: 'Technical Assistant', icon: 'fa-comment-dots', sub: 'Consultation Services' },
    { id: 'image', label: 'Visual Audit', icon: 'fa-eye', sub: 'Interface Inspection' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col sticky top-0 h-screen z-50 border-r border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 text-white">
              <i className="fa-solid fa-shield-halved text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Guardify</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Suite</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full group flex items-start gap-3.5 p-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <i className={`fa-solid ${item.icon} text-sm mt-1 w-5 text-center ${activeTab === item.id ? 'text-blue-400' : 'text-slate-500'}`}></i>
                <div className="text-left">
                  <p className={`font-bold text-xs ${activeTab === item.id ? 'text-white' : ''}`}>{item.label}</p>
                  <p className="text-[9px] opacity-60 font-medium leading-tight">{item.sub}</p>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 space-y-3">
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full py-2.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <i className="fa-solid fa-desktop"></i>
              Desktop App
            </button>
          )}

          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
              activeTab === 'account' 
              ? 'bg-slate-800 border-slate-700 shadow-lg ring-1 ring-blue-500/30' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center font-bold text-sm border border-slate-700 text-white">
              {account.name.charAt(0)}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[11px] font-bold truncate text-white">{account.name}</p>
              <p className="text-[9px] text-slate-500 font-medium">Account Settings</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
              <i className="fa-solid fa-folder-open"></i>
              System
              <i className="fa-solid fa-chevron-right text-[7px]"></i>
              <span className="text-slate-900 font-black">{navItems.find(i => i.id === activeTab)?.label || 'Profile'}</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Status: Operational</span>
                <span className="text-[8px] text-slate-400 font-medium">Node Sync: 100%</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-10 h-full max-w-screen-xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
