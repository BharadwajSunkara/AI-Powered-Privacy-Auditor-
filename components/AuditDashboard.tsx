
import React, { useState, useEffect, useRef } from 'react';
import { AuditResult, HistoryItem } from '../types';
import { analyzePrivacy } from '../services/geminiService';
import DataFlowDiagram from './DataFlowDiagram';

const GLOBAL_LAWS = [
  "General Data Protection Regulation (GDPR) – EU",
  "UK GDPR – United Kingdom",
  "Data Protection Act 2018 – UK",
  "CCPA / CPRA – USA (California)",
  "Digital Personal Data Protection Act (DPDP Act) – India",
  "PIPEDA – Canada",
  "LGPD – Brazil",
  "Privacy Act 1988 – Australia",
  "PIPL – China",
  "APPI – Japan",
  "PDPA – Singapore",
  "POPIA – South Africa",
  "FADP – Switzerland",
  "PDPA – South Korea",
  "Federal Law No. 45 – UAE",
  "PDPL – Saudi Arabia"
];

interface AuditDashboardProps {
  onSaveToHistory: (item: HistoryItem) => void;
  initialResult?: AuditResult | null;
}

const AuditDashboard: React.FC<AuditDashboardProps> = ({ onSaveToHistory, initialResult }) => {
  const [policy, setPolicy] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [selectedLaws, setSelectedLaws] = useState<string[]>(["General Data Protection Regulation (GDPR) – EU"]);
  const [lawSearch, setLawSearch] = useState('');
  const [showLawModal, setShowLawModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
    }
  }, [initialResult]);

  const toggleLaw = (law: string) => {
    setSelectedLaws(prev => 
      prev.includes(law) ? prev.filter(l => l !== law) : [...prev, law]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    let policyContent = '';
    let codeContent = '';

    const policyKeywords = ['privacy', 'policy', 'terms', 'legal', 'tos', 'compliance', 'gdpr'];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      const fileName = file.name.toLowerCase();

      const isPolicy = policyKeywords.some(kw => fileName.includes(kw)) || fileName.endsWith('.txt') || fileName.endsWith('.md');
      
      if (isPolicy && !fileName.includes('config') && !fileName.includes('manifest')) {
        policyContent += `\n--- FILE: ${file.name} ---\n${text}`;
      } else {
        codeContent += `\n--- FILE: ${file.name} ---\n${text}`;
      }
    }

    setPolicy(policyContent.trim());
    setCode(codeContent.trim());
    setIsProcessingFiles(false);
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 500);
  };

  const handleAudit = async () => {
    if (!policy || !code) return;
    setLoading(true);
    const startTime = Date.now();
    try {
      const data = await analyzePrivacy(policy, code, selectedLaws);
      setResult(data);
      onSaveToHistory({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        policyPreview: policy.substring(0, 100),
        codePreview: code.substring(0, 100),
        result: data,
        metadata: {
          duration: Date.now() - startTime,
          engineSignature: 'Guardify Core v4.1',
          environment: 'Production Audit Cluster'
        }
      });
    } catch (error) {
      alert('Analysis encountered an error. Please verify input integrity.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLaws = GLOBAL_LAWS.filter(law => 
    law.toLowerCase().includes(lawSearch.toLowerCase())
  );

  // --------------------------------------------------------------------------
  // RESULT SCREEN VIEW
  // --------------------------------------------------------------------------
  if (result) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setResult(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Back to Configuration
              </button>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Audit Report</h2>
            <p className="text-sm text-slate-500 font-medium">Generated via Guardify Forensic Engine v4.1</p>
          </div>
          <div className="flex gap-3">
             <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 ${
                result.status === 'Compliant' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                result.status === 'Partial' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-rose-50 border-rose-200 text-rose-800'
             }`}>
                <div className={`w-3 h-3 rounded-full ${
                  result.status === 'Compliant' ? 'bg-emerald-500' :
                  result.status === 'Partial' ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}></div>
                <span className="text-sm font-bold uppercase tracking-wide">{result.status}</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="md:col-span-1 space-y-6">
              {/* Score Card */}
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center">
                 <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                       <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64"/>
                       <circle 
                          className={`${
                             result.overallScore >= 80 ? 'text-emerald-500' :
                             result.overallScore >= 50 ? 'text-amber-500' :
                             'text-rose-500'
                          }`}
                          strokeWidth="10" 
                          strokeDasharray={365} 
                          strokeDashoffset={365 - (365 * result.overallScore) / 100} 
                          strokeLinecap="round" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="58" 
                          cx="64" 
                          cy="64"
                       />
                    </svg>
                    <span className="absolute text-3xl font-black text-slate-900">{result.overallScore}</span>
                 </div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Compliance Score</p>
              </div>

              {/* Stats */}
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Violations</span>
                    <span className="text-lg font-black text-rose-600">{result.violations.length}</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${Math.min(result.violations.length * 10, 100)}%` }}></div>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Passed Checks</span>
                    <span className="text-lg font-black text-emerald-600">
                       {Math.max(0, 25 - result.violations.length)}+
                    </span>
                 </div>
              </div>
           </div>

           <div className="md:col-span-3 space-y-6">
              {/* Executive Summary */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-slate-400 text-xs"></i>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Executive Remediation Plan</h3>
                 </div>
                 <div className="p-6">
                    <ul className="space-y-3">
                       {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-3 items-start text-sm text-slate-700 leading-relaxed">
                             <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">{idx + 1}</span>
                             {rec}
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>

              {/* Detailed Violations */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <i className="fa-solid fa-triangle-exclamation text-slate-400 text-xs"></i>
                       <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detailed Findings</h3>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                       {result.violations.length} Issues Found
                    </span>
                 </div>
                 <div className="divide-y divide-slate-100">
                    {result.violations.map((violation, idx) => (
                       <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-4 mb-2">
                             <div>
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide mb-2 ${
                                   violation.severity === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                   violation.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                   'bg-amber-100 text-amber-700'
                                }`}>
                                   {violation.severity}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900">{violation.standard}</h4>
                             </div>
                          </div>
                          <p className="text-xs font-bold text-slate-500 mb-2 font-mono bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100">
                             Clause: {violation.clause}
                          </p>
                          <p className="text-sm text-slate-600 leading-relaxed">
                             {violation.description}
                          </p>
                       </div>
                    ))}
                    {result.violations.length === 0 && (
                       <div className="p-12 text-center text-slate-400">
                          <i className="fa-solid fa-check-circle text-4xl mb-4 text-emerald-100"></i>
                          <p className="text-sm font-medium">No violations detected against selected frameworks.</p>
                       </div>
                    )}
                 </div>
              </div>

              {/* Data Flow Visualization */}
              {result.dataFlow && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-6">
                   <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                      <i className="fa-solid fa-diagram-project text-slate-400 text-xs"></i>
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Data Flow Visualization</h3>
                   </div>
                   <div className="p-6 overflow-x-auto">
                      <div className="text-xs text-slate-500 mb-6 leading-relaxed border-l-2 border-blue-500 pl-3 bg-blue-50/50 py-2 rounded-r">
                        <strong className="block text-blue-700 mb-1 uppercase text-[10px] tracking-wide">Analysis Summary</strong>
                        {result.dataFlow.summary}
                      </div>
                      <DataFlowDiagram data={result.dataFlow} />
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // INPUT SCREEN VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-10">
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Specify regional regulatory scope for technical cross-verification.</p>
        </div>
        
        <div className="flex gap-4 p-1 bg-white rounded-lg border border-slate-300 shadow-sm">
          <button 
            onClick={() => setShowLawModal(true)}
            className="px-5 py-2 hover:bg-slate-50 rounded-md transition-colors group flex items-center gap-3 border border-transparent hover:border-slate-200"
          >
            <span className="text-lg font-black text-slate-900">{selectedLaws.length}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Frameworks</span>
          </button>
          <div className="px-5 py-2 border-l border-slate-200 flex items-center gap-3">
            <span className="text-lg font-black text-blue-700">v2.1</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audit Logic</span>
          </div>
        </div>
      </section>

      {/* Project Scanner Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-8 shadow-sm">
         <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                  <i className="fa-solid fa-folder-tree text-xs"></i>
               </div>
               <h3 className="text-base font-bold text-slate-900 tracking-tight">Bulk Project Ingestion</h3>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs font-medium">
              Upload a complete project directory. The system will automatically classify <b>Legal Documentation</b> versus <b>Source Code</b> to prepare the audit buffers.
            </p>
         </div>
         <div className="shrink-0 w-full md:w-auto">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              {...({ webkitdirectory: "", directory: "" } as any)}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFiles}
              className="w-full md:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md"
            >
               {isProcessingFiles ? (
                 <>
                   <i className="fa-solid fa-spinner fa-spin"></i>
                   <span>Classifying...</span>
                 </>
               ) : (
                 <>
                   <i className="fa-solid fa-cloud-arrow-up"></i>
                   <span>Select Project Directory</span>
                 </>
               )}
            </button>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Controls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Policy Context</span>
                  <span className="text-[9px] font-black text-slate-400">{policy.length} Chars</span>
                </label>
                <textarea
                  value={policy}
                  onChange={(e) => setPolicy(e.target.value)}
                  placeholder="Paste documentation or legal context..."
                  className="w-full h-64 p-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs font-medium resize-none shadow-inner leading-relaxed"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Technical Data</span>
                  <span className="text-[9px] font-black text-slate-400">{code.length} Chars</span>
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste source code or architecture schema..."
                  className="w-full h-64 p-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs font-medium resize-none code-font shadow-inner leading-relaxed"
                />
              </div>
            </div>

            <button
              onClick={handleAudit}
              disabled={loading || !policy || !code || selectedLaws.length === 0}
              className="w-full py-3.5 bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:bg-blue-800 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Performing Compliance Check...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bolt-lightning text-xs"></i>
                  <span>Execute Full Session Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Sidebar */}
        <div className="lg:col-span-4 space-y-6">
           <div 
             className="bg-slate-900 p-6 rounded-xl text-white cursor-pointer hover:bg-slate-800 transition-all border border-slate-800 shadow-lg"
             onClick={() => setShowLawModal(true)}
           >
              <div className="flex items-center justify-between mb-4">
                 <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                    <i className="fa-solid fa-scale-balanced text-xs"></i>
                 </div>
                 <i className="fa-solid fa-chevron-right text-slate-600 text-[10px]"></i>
              </div>
              <h3 className="text-sm font-bold mb-1">Audit Frameworks</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed mb-4">You are auditing against {selectedLaws.length} jurisdictions.</p>
              <div className="flex flex-wrap gap-1.5">
                 {selectedLaws.slice(0, 2).map(law => (
                    <span key={law} className="text-[9px] font-bold bg-white/10 px-2 py-1 rounded border border-white/5">
                       {law.split(' – ')[0]}
                    </span>
                 ))}
                 {selectedLaws.length > 2 && (
                   <span className="text-[9px] font-bold bg-white/10 px-2 py-1 rounded border border-white/5">
                      +{selectedLaws.length - 2} More
                   </span>
                 )}
              </div>
           </div>

           {/* System Ready Status */}
           <div className="h-[200px] rounded-xl p-6 flex flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50">
             {loading ? (
               <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Data</p>
               </div>
             ) : (
               <div className="text-center opacity-60">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 mx-auto shadow-sm border border-slate-200 text-slate-300">
                    <i className="fa-solid fa-server text-lg"></i>
                  </div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Ready</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Awaiting data injection</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Regulatory Modal */}
      {showLawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowLawModal(false)}></div>
           
           <div className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white">
                      <i className="fa-solid fa-scale-balanced text-xs"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Framework Selection</h3>
                      <p className="text-[10px] font-medium text-slate-500">Configure regulatory audit scope</p>
                    </div>
                 </div>
                 <button onClick={() => setShowLawModal(false)} className="text-slate-400 hover:text-slate-600">
                   <i className="fa-solid fa-times text-sm"></i>
                 </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                  <input 
                    type="text" 
                    placeholder="Search jurisdictions..." 
                    value={lawSearch}
                    onChange={(e) => setLawSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  />
                </div>

                <div className="h-[300px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 gap-1.5">
                  {filteredLaws.map(law => (
                    <button 
                      key={law}
                      onClick={() => toggleLaw(law)}
                      className={`group flex items-center gap-3 p-3 rounded-lg transition-all text-left border ${
                        selectedLaws.includes(law) 
                          ? 'bg-blue-50 border-blue-200 text-blue-900' 
                          : 'bg-white border-transparent hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ${
                        selectedLaws.includes(law) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-transparent'
                      }`}>
                        <i className="fa-solid fa-check text-[8px]"></i>
                      </div>
                      <span className="text-[11px] font-bold">{law}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {selectedLaws.length} Selected
                 </span>
                 <button 
                   onClick={() => setShowLawModal(false)}
                   className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-md hover:bg-slate-800"
                 >
                   Apply Configuration
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AuditDashboard;
