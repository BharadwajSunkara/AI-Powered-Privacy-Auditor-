
import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setAnalysis('');
    try {
      const base64 = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const result = await analyzeImage(base64, mimeType);
      setAnalysis(result || 'No specific privacy concerns identified.');
    } catch (error) {
      console.error(error);
      setAnalysis('Failed to analyze the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <header className="border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forensic UI Analysis</h2>
        <p className="text-slate-500 text-sm font-medium mt-1">Upload architectural diagrams or interface screenshots for automated risk assessment.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className={`relative border-2 border-dashed rounded-xl transition-all h-[400px] flex flex-col items-center justify-center p-6 bg-slate-50/50 overflow-hidden ${
            image ? 'border-slate-300' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}>
            {image ? (
              <>
                <img src={image} alt="Preview" className="h-full w-full object-contain" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 bg-white border border-slate-200 shadow-sm w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <i className="fa-solid fa-times text-xs"></i>
                </button>
              </>
            ) : (
              <div className="text-center group cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => document.getElementById('file-upload')?.click()}>
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-400 group-hover:text-blue-600 transition-colors"></i>
                </div>
                <p className="text-slate-900 font-bold text-sm">Upload Evidence</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (Max 5MB)</p>
              </div>
            )}
            <input 
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="w-full bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-microchip"></i>}
            Execute Visual Scan
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 text-white min-h-[400px] flex flex-col shadow-lg border border-slate-800">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <i className="fa-solid fa-file-contract text-xs"></i>
            </div>
            <div>
               <h3 className="font-bold text-sm">Assessment Report</h3>
               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">System Analysis Findings</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-2">
            {!analysis && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                <i className="fa-solid fa-chart-simple text-2xl opacity-20"></i>
                <p className="text-xs font-medium">Awaiting visual input data...</p>
              </div>
            )}
            {loading && (
              <div className="space-y-4 animate-pulse opacity-50">
                <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                <div className="h-3 bg-slate-700 rounded w-full"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            )}
            {analysis && (
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-xs font-medium">
                  {analysis}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
