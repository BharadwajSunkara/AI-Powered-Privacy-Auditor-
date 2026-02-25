
import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI, textToSpeech, playPCM } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithAI(input, messages);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response || 'System unable to generate response.'
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Consultation unavailable. Check local network status.'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const speak = async (text: string) => {
    const audio = await textToSpeech(text);
    if (audio) await playPCM(audio);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <header className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <i className="fa-solid fa-microchip text-sm"></i>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Compliance Consultant</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Logic Engine Online</span>
            </div>
          </div>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-40">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
              <i className="fa-solid fa-scale-balanced text-xl text-slate-400"></i>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">System Consult</h3>
            <p className="text-slate-500 text-[11px] font-medium">Inquire regarding GDPR, CCPA, PIPL, or infrastructure security protocols.</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div 
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] group relative p-4 ${
              m.role === 'user' 
                ? 'bg-slate-900 text-white rounded-xl rounded-tr-none shadow-sm' 
                : 'bg-white text-slate-800 rounded-xl rounded-tl-none shadow-sm border border-slate-200'
            }`}>
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap font-medium">{m.text}</p>
              {m.role === 'model' && (
                <button 
                  onClick={() => speak(m.text)}
                  className="absolute -right-8 top-1 text-slate-300 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                >
                  <i className="fa-solid fa-volume-high text-[10px]"></i>
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-xl rounded-tl-none px-4 py-3 border border-slate-200 shadow-sm flex gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce"></div>
              <div className="w-1 h-1 rounded-full bg-slate-400 animate-bounce [animation-delay:0.1s]"></div>
              <div className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]"></div>
            </div>
          </div>
        )}
      </div>

      <footer className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type technical inquiry..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-slate-900 text-white w-12 h-12 rounded-lg flex items-center justify-center shadow-md hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatInterface;
