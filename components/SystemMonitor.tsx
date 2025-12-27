import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Battery, Wifi, Shield, Disc } from 'lucide-react';

const generateData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    time: i,
    cpu: Math.floor(Math.random() * 40) + 20,
    memory: Math.floor(Math.random() * 30) + 40,
    network: Math.floor(Math.random() * 80) + 10,
  }));
};

export const SystemMonitor: React.FC = () => {
  const [data, setData] = useState(generateData(20));
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const next = [...prev.slice(1)];
        next.push({
          time: prev[prev.length - 1].time + 1,
          cpu: Math.max(10, Math.min(90, prev[prev.length - 1].cpu + (Math.random() - 0.5) * 20)),
          memory: Math.max(20, Math.min(80, prev[prev.length - 1].memory + (Math.random() - 0.5) * 10)),
          network: Math.floor(Math.random() * 100),
        });
        return next;
      });
      setUptime(u => u + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto">
      
      {/* Primary Metrics */}
      <div className="bg-nexus-900/80 border border-nexus-700 rounded-lg p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-nexus-accent font-mono text-sm flex items-center">
            <Activity className="w-4 h-4 mr-2" /> CPU & MEMORY LOAD
          </h3>
          <span className="text-xs text-nexus-400">{formatTime(uptime)}</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2a6d" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff2a6d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#050a14', borderColor: '#1e3a8a' }} 
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="cpu" stroke="#00f0ff" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
              <Area type="monotone" dataKey="memory" stroke="#ff2a6d" fillOpacity={1} fill="url(#colorMem)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network Activity */}
      <div className="bg-nexus-900/80 border border-nexus-700 rounded-lg p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-nexus-400 font-mono text-sm flex items-center">
            <Wifi className="w-4 h-4 mr-2" /> NETWORK TRAFFIC
          </h3>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-500">CONNECTED</span>
          </div>
        </div>
        <div className="h-48 w-full">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <Bar dataKey="network" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="col-span-1 lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-nexus-800/50 p-4 rounded border border-nexus-700 flex flex-col items-center justify-center">
            <Shield className="w-8 h-8 text-emerald-400 mb-2" />
            <span className="text-xs text-nexus-400">SECURITY</span>
            <span className="text-lg font-bold text-emerald-400">ACTIVE</span>
        </div>

        <div className="bg-nexus-800/50 p-4 rounded border border-nexus-700 flex flex-col items-center justify-center">
            <Battery className="w-8 h-8 text-nexus-accent mb-2" />
            <span className="text-xs text-nexus-400">POWER</span>
            <span className="text-lg font-bold text-nexus-accent">98%</span>
        </div>

        <div className="bg-nexus-800/50 p-4 rounded border border-nexus-700 flex flex-col items-center justify-center">
            <Disc className="w-8 h-8 text-purple-400 mb-2" />
            <span className="text-xs text-nexus-400">STORAGE</span>
            <span className="text-lg font-bold text-purple-400">1.2 TB</span>
        </div>

        <div className="bg-nexus-800/50 p-4 rounded border border-nexus-700 flex flex-col items-center justify-center">
            <Activity className="w-8 h-8 text-orange-400 mb-2" />
            <span className="text-xs text-nexus-400">THREADS</span>
            <span className="text-lg font-bold text-orange-400">84</span>
        </div>

      </div>
    </div>
  );
};