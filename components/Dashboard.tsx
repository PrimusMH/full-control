import React from 'react';
import { AppView } from '../types';
import { Terminal, Activity, Eye, ShieldCheck, Database, Radio, Globe } from 'lucide-react';

interface DashboardProps {
  onLaunch: (app: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLaunch }) => {
  const apps = [
    { id: AppView.TERMINAL, name: 'TERMINAL', icon: Terminal, color: 'text-emerald-400', desc: 'Command Line Interface' },
    { id: AppView.SYSTEM, name: 'SYSTEM', icon: Activity, color: 'text-blue-400', desc: 'Hardware Monitor' },
    { id: AppView.VISION, name: 'VISION', icon: Eye, color: 'text-purple-400', desc: 'Visual Analysis' },
    { id: null, name: 'NETWORK', icon: Globe, color: 'text-cyan-400', desc: 'Secure Connection: Active' },
    { id: null, name: 'SECURITY', icon: ShieldCheck, color: 'text-green-400', desc: 'Firewall: Enabled' },
    { id: null, name: 'DATA', icon: Database, color: 'text-orange-400', desc: 'Encrypted Storage' },
  ];

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tighter mb-1">NEXUS <span className="text-nexus-accent">OS</span></h1>
        <p className="text-nexus-400 font-mono text-sm">System Ready. Awaiting instructions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {apps.map((app, idx) => (
          <button
            key={idx}
            onClick={() => app.id && onLaunch(app.id)}
            disabled={!app.id}
            className={`
              relative p-6 rounded-xl border border-nexus-700 bg-nexus-800/40 backdrop-blur-sm
              hover:bg-nexus-800/70 hover:border-nexus-500 transition-all duration-300 group
              text-left flex flex-col justify-between h-32 md:h-40
              ${!app.id ? 'opacity-60 cursor-default' : 'cursor-pointer'}
            `}
          >
            <div className={`p-2 rounded-lg bg-nexus-900/50 w-fit mb-3 ${app.color}`}>
              <app.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-100 font-bold tracking-wide text-sm md:text-base group-hover:text-nexus-accent transition-colors">
                {app.name}
              </h3>
              <p className="text-[10px] md:text-xs text-nexus-400 mt-1 font-mono uppercase opacity-70">
                {app.desc}
              </p>
            </div>
            {app.id && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-nexus-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 border-t border-nexus-800 pt-6">
        <h3 className="text-xs font-mono text-nexus-500 mb-4 uppercase tracking-widest">Active Processes</h3>
        <div className="space-y-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between text-xs font-mono text-gray-400 bg-nexus-900/30 p-2 rounded">
                    <span className="flex items-center"><Radio className="w-3 h-3 mr-2 animate-pulse" /> DAEMON_0{i}</span>
                    <span className="text-green-500">RUNNING</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};