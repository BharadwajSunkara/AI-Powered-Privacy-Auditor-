
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AuditDashboard from './components/AuditDashboard';
import ChatInterface from './components/ChatInterface';
import ImageAnalyzer from './components/ImageAnalyzer';
import GitIntegration from './components/GitIntegration';
import AccountProfile from './components/AccountProfile';
import Login from './components/Login';
import { UserAccount, HistoryItem, AuditResult } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('audit');
  const [selectedAuditResult, setSelectedAuditResult] = useState<AuditResult | null>(null);
  
  const [account, setAccount] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('privacyguard_account');
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  });

  useEffect(() => {
    if (account) {
      localStorage.setItem('privacyguard_account', JSON.stringify(account));
    } else {
      localStorage.removeItem('privacyguard_account');
    }
  }, [account]);

  const handleLogin = (user: UserAccount) => {
    setAccount(user);
  };

  const handleLogout = () => {
    setAccount(null);
  };

  const saveToHistory = (item: HistoryItem) => {
    if (!account) return;
    setAccount(prev => prev ? ({
      ...prev,
      history: [item, ...prev.history]
    }) : null);
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setSelectedAuditResult(item.result);
    setActiveTab('audit');
  };

  if (!account) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'audit':
        return <AuditDashboard 
          onSaveToHistory={saveToHistory} 
          initialResult={selectedAuditResult} 
        />;
      case 'git':
        return <GitIntegration />;
      case 'chat':
        return <ChatInterface />;
      case 'image':
        return <ImageAnalyzer />;
      case 'account':
        return <AccountProfile 
          account={account} 
          onUpdateAccount={setAccount} 
          onViewHistory={handleViewHistoryItem}
          onLogout={handleLogout}
        />;
      default:
        return <AuditDashboard onSaveToHistory={saveToHistory} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={(tab) => {
        if (tab !== 'audit') setSelectedAuditResult(null);
        setActiveTab(tab);
      }} 
      account={account}
    >
      <div className="animate-in fade-in duration-700">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
