import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal as TerminalIcon, Cpu, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';

export const Terminal: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: 'system', text: 'NEXUS OS v4.2.0 initialized. Awaiting input...', timestamp: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
            systemInstruction: "You are the text interface of NEXUS OS. Respond like a futuristic computer terminal. Be concise, precise, and use technical terminology where appropriate. If asked to perform an action, simulate the confirmation of that action.",
        }
      });
      
      const text = response.text || "Command processed. No output returned.";
      setHistory(prev => [...prev, { role: 'model', text: text, timestamp: new Date() }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'system', text: `ERROR: Execution failed. ${e}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-nexus-900/90 backdrop-blur-md rounded-lg border border-nexus-700 overflow-hidden shadow-2xl">
      <div className="flex items-center px-4 py-2 bg-nexus-800 border-b border-nexus-700">
        <TerminalIcon className="w-4 h-4 text-nexus-accent mr-2" />
        <span className="text-xs font-mono text-nexus-400 uppercase tracking-widest">Command Protocol</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-3">
        {history.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded ${
              msg.role === 'user' 
                ? 'bg-nexus-700 text-nexus-accent border border-nexus-500/30' 
                : msg.role === 'system'
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}>
              <span className="opacity-70 text-[10px] block mb-1">
                {msg.role === 'user' ? 'USR_CMD' : 'SYS_OUT'} :: {msg.timestamp.toLocaleTimeString()}
              </span>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
            <div className="flex items-center text-nexus-accent animate-pulse">
                <Cpu className="w-4 h-4 mr-2" />
                <span>Processing...</span>
            </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 bg-nexus-800/50 border-t border-nexus-700">
        <div className="flex items-center bg-nexus-900 border border-nexus-600 rounded px-3 py-2 focus-within:border-nexus-accent transition-colors">
          <span className="text-nexus-accent mr-2">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
            placeholder="Enter system command..."
            className="flex-1 bg-transparent border-none outline-none text-gray-200 font-mono placeholder-gray-600"
            autoFocus
          />
          <button 
            onClick={handleCommand} 
            disabled={loading}
            className="ml-2 text-nexus-400 hover:text-nexus-accent disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};