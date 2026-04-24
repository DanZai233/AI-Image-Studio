import React from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { AIModelSettings } from '../types';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state, dispatch } = useAppStore();
  const { settings } = state;

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_SETTINGS',
      payload: { ...settings, [e.target.name]: e.target.value }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">Model Configuration</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 block">OpenAI Endpoint</label>
            <input 
              name="endpoint"
              type="text" 
              value={settings.endpoint}
              onChange={handleChange}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            <p className="text-[10px] text-gray-600 font-serif italic">Must include /v1 (or compatible custom route).</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 block">API Key</label>
            <input 
              name="apiKey"
              type="password" 
              value={settings.apiKey}
              onChange={handleChange}
              placeholder="sk-..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 block">Chat Model</label>
              <input 
                name="chatModel"
                type="text" 
                value={settings.chatModel}
                onChange={handleChange}
                placeholder="gpt-4o"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 block">Image Model</label>
              <input 
                name="imageModel"
                type="text" 
                value={settings.imageModel}
                onChange={handleChange}
                placeholder="dall-e-3"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/5 bg-black/20">
          <button 
            onClick={onClose}
            className="w-full bg-white text-black text-xs font-bold py-3 rounded hover:bg-gray-200 transition-colors uppercase tracking-widest"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
