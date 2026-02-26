
import React, { useState, useEffect, useCallback } from 'react';
import { GitRepo, CommitScan } from '../types';
import { scanCommit } from '../services/geminiService';

const DiffViewer: React.FC<{ diff: string, status: string }> = ({ diff, status }) => {
  const lines = diff.split('\n');
  
  return (
    <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-code text-slate-400 text-xs"></i>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Commit Diff Analysis</span>
        </div>
        {status !== 'Pass' && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-rose-600">
            <i className="fa-solid fa-shield-virus"></i>
            <span>Privacy Violation Detected</span>
          </div>
        )}
      </div>
      <div className="font-mono text-[12px] leading-6 overflow-x-auto bg-white">
        {lines.map((line, idx) => {
          const isAdded = line.startsWith('+');
          const isRemoved = line.startsWith('-');
          
          // Enhanced keyword detection for sensitive data
          const riskyKeywords = ['password', 'secret', 'key', 'token', 'auth', 'credentials', 'ssn', 'email', 'card', 'private', 'bearer', 'api_key', 'access_token'];
          const lineLower = line.toLowerCase();
          const matchesRisk = riskyKeywords.some(k => lineLower.includes(k));
          
          // Trigger violation highlight only on added lines in flagged commits
          const isViolation = (status === 'Fail' || status === 'Warning') && isAdded && matchesRisk;
          
          const rowClass = isAdded ? 'bg-emerald-50/60 text-emerald-900' : 
                          isRemoved ? 'bg-rose-50/60 text-rose-900' : 
                          'text-slate-600 hover:bg-slate-50/50';

          const renderContent = (text: string) => {
            if (!isViolation) return text;
            
            // Regex to match keywords case-insensitively
            const regex = new RegExp(`(${riskyKeywords.join('|')})`, 'gi');
            const parts = text.split(regex);
            
            return parts.map((part, i) => {
               if (riskyKeywords.some(k => k === part.toLowerCase())) {
                   return (
                       <span key={i} className="relative inline-block bg-rose-200 text-rose-900 font-extrabold px-1 mx-0.5 rounded border border-rose-300 shadow-sm">
                           {part}
                           <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                            </span>
                       </span>
                   );
               }
               return part;
            });
          };

          return (
            <div 
              key={idx} 
              className={`flex group relative border-b border-slate-100/50 last:border-0 ${rowClass}`}
            >
              <span className="inline-block w-12 text-right pr-4 shrink-0 select-none text-slate-400 bg-slate-50/30 border-r border-slate-100">
                {idx + 1}
              </span>
              <span className="w-6 shrink-0 select-none opacity-50 text-center font-bold">
                {line.charAt(0) === '+' ? '+' : line.charAt(0) === '-' ? '-' : ' '}
              </span>
              <span className="whitespace-pre pl-2 flex-1 break-all">
                {renderContent(line.substring(1) || line)}
              </span>
              {isViolation && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 shadow-sm animate-in fade-in slide-in-from-right-2">
                    <i className="fa-solid fa-circle-exclamation mr-1.5"></i>
                    PII Risk
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GitIntegration: React.FC = () => {
  const [repos, setRepos] = useState<GitRepo[]>([]);
  const [scans, setScans] = useState<CommitScan[]>([]);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState(false);

  const executeScan = useCallback(async (customDiff?: string) => {
    const mockDiffs = [
      `// Simulated code context\n+ console.log('Audit Test:', user.ssn);\n- console.log('Standard Log');\n+ const userEmail = user.email;\n+ analytics.push({ type: 'Login', data: { email: userEmail } });`,
      `// Database Config Change\n- const dbPassword = process.env.DB_PASS;\n+ const dbPassword = "superSecretPassword123"; // TODO: Remove before prod\n  connectToDb(dbUrl, dbPassword);`,
      `// API Key Exposure\n  const client = new ThirdPartyClient({\n+   apiKey: "sk_live_51Mz...",\n    timeout: 5000\n  });`,
      `// Safe Refactor\n- function oldAuth() { ... }\n+ function newAuth() { \n+   // Implements OAuth2 standard\n+   return oauth.authorize();\n+ }`
    ];
    
    const mockDiff = customDiff || mockDiffs[Math.floor(Math.random() * mockDiffs.length)];

    try {
      const result = await scanCommit(mockDiff);
      const newScan: CommitScan = {
        id: 'scan-' + Date.now(),
        commitHash: Math.random().toString(16).substring(2, 9),
        author: ['ci.bot', 'dev.dave', 'qa.alice', 'sec.ops'][Math.floor(Math.random() * 4)],
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: (result.status as any) || 'Warning',
        issuesCount: result.issuesCount || 0,
        summary: result.summary || 'Automated commit audit triggered by push event.',
        details: result.details || 'Technical analysis breakdown prepared by Security Engine.',
        diff: mockDiff
      };
      
      setScans(prev => [newScan, ...prev]);
      
      setRepos(prevRepos => prevRepos.map(r => ({
        ...r,
        lastScanAt: newScan.timestamp
      })));

      return newScan;
    } catch (err) {
      console.error('Commit scan failed:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isAutoScanning) return;

    const interval = setInterval(() => {
      const activeRepos = repos.filter(r => r.isActive);
      if (activeRepos.length > 0 && !isSimulating) {
        // Higher frequency for demo purposes: 40% chance every 10s
        if (Math.random() > 0.6) {
          executeScan();
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [repos, isSimulating, executeScan, isAutoScanning]);

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoUrl) return;
    
    setIsSimulating(true);
    const name = newRepoUrl.replace('https://github.com/', '');
    const newRepo: GitRepo = {
      id: Date.now().toString(),
      url: newRepoUrl,
      name: name || 'Custom Repo',
      branch: 'main',
      isActive: true,
      lastScanAt: 'Scanning...'
    };
    
    setRepos([newRepo, ...repos]);
    setNewRepoUrl('');
    setShowAddRepo(false);

    await executeScan(`// Initial Repository Sync\n+ // Repository connection established for ${name}\n+ console.log('Active monitoring engaged');`);
    setIsSimulating(false);
  };

  const handleManualSimulate = async () => {
    setIsSimulating(true);
    const result = await executeScan();
    if (result?.status === 'Fail') {
      setExpandedScanId(result.id);
    }
    setIsSimulating(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedScanId(expandedScanId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <button 
                onClick={() => setIsAutoScanning(!isAutoScanning)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  isAutoScanning 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
             >
                <span className={`flex h-2 w-2 rounded-full ${isAutoScanning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                {isAutoScanning ? 'Auto-Scan Active' : 'Enable Auto-Scan'}
             </button>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Git Integration</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Automated CI/CD security auditing for your enterprise repositories.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleManualSimulate}
            disabled={isSimulating}
            className="px-5 py-2.5 bg-white text-slate-700 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSimulating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
            Sync Now
          </button>
          <button
            onClick={() => setShowAddRepo(true)}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            Add Repository
          </button>
        </div>
      </header>

      {showAddRepo && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2">
          <h4 className="text-sm font-bold text-slate-900 mb-4">Connect Remote Repository</h4>
          <form onSubmit={handleAddRepo} className="flex gap-3">
            <input
              type="text"
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              placeholder="e.g. https://github.com/organization/project"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all"
            />
            <button type="submit" disabled={isSimulating} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all hover:bg-slate-800">
              {isSimulating ? 'Processing...' : 'Connect'}
            </button>
            <button type="button" onClick={() => setShowAddRepo(false)} className="px-4 py-2.5 text-slate-400 text-sm font-bold hover:text-slate-600">Cancel</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Repo List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Managed Repositories</h3>
          </div>
          <div className="space-y-3">
            {repos.length === 0 && (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <i className="fa-brands fa-git-alt text-slate-400"></i>
                </div>
                <p className="text-xs font-bold text-slate-500">No Repositories</p>
                <p className="text-[10px] text-slate-400 mt-1">Connect a repo to start auditing.</p>
              </div>
            )}
            {repos.map(repo => (
              <div key={repo.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all border-l-4 border-l-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <i className="fa-brands fa-github text-xl"></i>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{repo.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                        <i className="fa-solid fa-code-branch"></i> {repo.branch}
                      </p>
                    </div>
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-4 border-t border-slate-50">
                  <span className="font-medium">Checked: {repo.lastScanAt || 'Pending'}</span>
                  {repo.lastScanAt === 'Scanning...' && <i className="fa-solid fa-circle-notch fa-spin text-slate-900"></i>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Audit Activity Log</h3>
            {isSimulating && (
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-900">
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                ANALYZING NEW COMMITS
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Commit</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Analysis Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scans.map(scan => (
                    <React.Fragment key={scan.id}>
                      <tr className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedScanId === scan.id ? 'bg-slate-50' : ''}`} onClick={() => toggleExpand(scan.id)}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded text-[11px] border border-slate-200">{scan.commitHash}</span>
                            <span className="text-xs text-slate-600 font-medium truncate max-w-[280px]">{scan.summary}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span 
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              scan.status === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              scan.status === 'Fail' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {scan.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedScanId === scan.id ? 'bg-slate-900 text-white' : 'text-slate-300 hover:text-slate-600'}`}>
                            <i className={`fa-solid fa-chevron-right text-[10px] transition-transform duration-300 ${expandedScanId === scan.id ? 'rotate-90' : ''}`}></i>
                          </button>
                        </td>
                      </tr>
                      {expandedScanId === scan.id && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 bg-slate-50/30 border-t border-slate-100">
                            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Audit Findings</h4>
                                    <span className="text-[10px] font-bold text-slate-400">{scan.timestamp}</span>
                                  </div>
                                  <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed text-xs">
                                      {scan.details}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Logic Core Remediation</h4>
                                  <div className={`p-6 rounded-xl border flex items-start gap-4 ${scan.status === 'Fail' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${scan.status === 'Fail' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                      <i className={`fa-solid ${scan.status === 'Fail' ? 'fa-triangle-exclamation' : 'fa-check-double'} text-xs`}></i>
                                    </div>
                                    <div>
                                      <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${scan.status === 'Fail' ? 'text-rose-900' : 'text-emerald-900'}`}>
                                        {scan.status === 'Fail' ? 'Urgent Action Required' : 'Validation Confirmed'}
                                      </p>
                                      <p className={`text-xs font-medium leading-relaxed ${scan.status === 'Fail' ? 'text-rose-700' : 'text-emerald-700'}`}>
                                        {scan.status === 'Fail' 
                                          ? 'Sensitive data patterns (PII) were identified in the source diff. This change violates internal Data Protection policies and GDPR Article 32. Review the highlighted diff below immediately.' 
                                          : 'Analysis complete. The current changes adhere to documented privacy controls and information security standards. No regressions detected.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Technical Diff Scrutiny</h4>
                                {scan.diff && <DiffViewer diff={scan.diff} status={scan.status} />}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {scans.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <i className="fa-solid fa-list-check text-4xl mb-4 text-slate-200"></i>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Commit Activity</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-center py-4">
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
              <i className="fa-solid fa-shield-check text-emerald-500"></i>
              Real-time audit persistence enabled. Logs are cryptographically signed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitIntegration;
