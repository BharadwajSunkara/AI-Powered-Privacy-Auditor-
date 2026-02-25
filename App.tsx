
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AuditDashboard from './components/AuditDashboard';
import ChatInterface from './components/ChatInterface';
import ImageAnalyzer from './components/ImageAnalyzer';
import GitIntegration from './components/GitIntegration';
import AccountProfile from './components/AccountProfile';
import { UserAccount, HistoryItem, AuditResult } from './types';

const INITIAL_ACCOUNT: UserAccount = {
  name: 'Auditor',
  company: 'PrivacyGuard Solutions',
  email: 'auditor@example.com',
  role: 'Lead Compliance Officer',
  history: [],
  isDriveConnected: false
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('audit');
  const [selectedAuditResult, setSelectedAuditResult] = useState<AuditResult | null>(null);
  
  const [account, setAccount] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('privacyguard_account');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.name === 'Senior Auditor') {
        return { ...parsed, name: 'Auditor' };
      }
      return parsed;
    }
    return INITIAL_ACCOUNT;
  });

  useEffect(() => {
    localStorage.setItem('privacyguard_account', JSON.stringify(account));
  }, [account]);

  const saveToHistory = (item: HistoryItem) => {
    setAccount(prev => ({
      ...prev,
      history: [item, ...prev.history]
    }));
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setSelectedAuditResult(item.result);
    setActiveTab('audit');
  };

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
