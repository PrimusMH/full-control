import React, { useState } from 'react';
import { AppView } from './types';
import { Terminal } from './components/Terminal';
import { SystemMonitor } from './components/SystemMonitor';
import { Vision } from './components/Vision';
import { Dashboard } from './components/Dashboard';
import { useLiveAPI } from './hooks/useLiveAPI';
import { Mic, MicOff, Home, Battery, Wifi, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [transcript, setTranscript] = useState<{text: string, isUser: boolean} | null>(null);
  
  const { connect, disconnect, isConnected, isSpeaking, volumeLevel } = useLiveAPI({
    onTranscript: (text, isUser) => {
        setTranscript({text, isUser});
        // Auto-clear transcript after a delay
        setTimeout(() => setTranscript(null), 5000);
    }
  });

  const toggleLive = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.TERMINAL: return <Terminal />;
      case AppView.SYSTEM: return <SystemMonitor />;
      case AppView.VISION: return <Vision />;
      case AppView.DASHBOARD:
      default: return <Dashboard onLaunch={setCurrentView} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-nexus-900 text-gray-100 flex flex-col overflow-hidden font-sans selection:bg-nexus-accent selection:text-black">
      
      {/* Top Status Bar */}
      <header className="h-12 bg-nexus-900 border-b border-nexus-800 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center">
            {currentView !== AppView.DASHBOARD && (
                <button 
                    onClick={() => setCurrentView(AppView.DASHBOARD)}
                    className="mr-3 p-1 hover:bg-nexus-800 rounded transition-colors text-nexus-400 hover:text-white"
                >
                    <Home className="w-5 h-5" />
                </button>
            )}
            <span className="font-mono font-bold tracking-widest text-nexus-accent text-sm">
                NEXUS<span className="text-white opacity-50">OS</span>
            </span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono text-nexus-400">
          <div className="hidden md:flex items-center space-x-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>ONLINE</span>
          </div>
          <Wifi className="w-4 h-4" />
          <Battery className="w-4 h-4" />
          <span>20:42</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center">
        {/* Overlay for background darkening */}
        <div className="absolute inset-0 bg-nexus-900/80 backdrop-blur-sm z-0"></div>
        
        {/* App Container */}
        <div className="relative z-10 w-full h-full p-2 md:p-6 max-w-7xl mx-auto">
             <div className="w-full h-full bg-nexus-900/60 backdrop-blur-md rounded-2xl border border-nexus-700/50 shadow-2xl overflow-hidden relative">
                {renderView()}
             </div>
        </div>
      </main>

      {/* Voice Assistant Overlay (Always available) */}
      <div className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50 
        flex flex-col items-center transition-all duration-500
        ${isConnected ? 'translate-y-0' : 'translate-y-0'}
      `}>
         
         {/* Transcript Bubble */}
         {transcript && isConnected && (
             <div className="mb-4 px-6 py-3 bg-black/80 backdrop-blur-md border border-nexus-500/30 rounded-full max-w-md text-center shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4">
                 <p className={`text-sm ${transcript.isUser ? 'text-gray-300' : 'text-nexus-accent font-semibold'}`}>
                     {transcript.text}
                 </p>
             </div>
         )}

         {/* Voice Button / Visualizer */}
         <button
            onClick={toggleLive}
            className={`
                relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                shadow-[0_0_30px_rgba(0,0,0,0.5)]
                ${isConnected ? 'bg-red-500/10 border-red-500' : 'bg-nexus-accent/10 border-nexus-accent hover:bg-nexus-accent/20'}
                border-2
            `}
         >
            {/* Ping animation when active */}
            {isConnected && (
                <span className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-20"></span>
            )}
            
            {/* Dynamic Volume Visualizer Ring */}
            {isConnected && (
                 <span 
                    className="absolute inset-0 rounded-full bg-red-500 transition-all duration-75 opacity-30 blur-md"
                    style={{ transform: `scale(${1 + volumeLevel})` }}
                 ></span>
            )}

            {isConnected ? (
                <Mic className={`w-6 h-6 ${isSpeaking ? 'text-white animate-pulse' : 'text-red-500'}`} />
            ) : (
                <MicOff className="w-6 h-6 text-nexus-accent" />
            )}
         </button>
         
         <span className="mt-2 text-[10px] uppercase font-mono tracking-widest text-nexus-400 bg-black/50 px-2 rounded">
             {isConnected ? (isSpeaking ? 'NEXUS SPEAKING' : 'LISTENING...') : 'VOICE OFF'}
         </span>
      </div>

    </div>
  );
};

export default App;