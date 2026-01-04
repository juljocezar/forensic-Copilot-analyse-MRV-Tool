import React from 'react';
import { LayoutDashboard, FileText, UploadCloud, ShieldCheck, Settings, Network, DollarSign } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'upload', label: 'Analyse', icon: UploadCloud },
    { id: 'cases', label: 'Akten', icon: FileText },
    { id: 'intelligence', label: 'Beziehungen', icon: Network },
    { id: 'costs', label: 'Kostenstellen', icon: DollarSign },
    { id: 'vault', label: 'Tresor', icon: ShieldCheck },
    { id: 'reports', label: 'Berichte', icon: FileText },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-primary-500 font-bold text-xl">
          <ShieldCheck className="w-8 h-8" />
          <span>HR-Certify</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Menschenrechts-Auditor</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 text-slate-400 hover:text-white w-full px-4 py-2 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Einstellungen</span>
        </button>
      </div>
    </div>
  );
};
