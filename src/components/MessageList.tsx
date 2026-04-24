import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { MessageItem } from './MessageItem';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

export function MessageList() {
  const { state } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  if (state.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-[#1a1a1a] border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl rotate-3">
           <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-light tracking-widest text-[#e5e5e5] mb-2 uppercase">LUMINA STUDIO</h2>
        <p className="text-gray-400 max-w-md text-sm leading-relaxed mb-8 font-serif italic">
          Chat naturally, generate beautiful images, or upload images for vision analysis. 
          Use <span className="font-mono text-xs bg-white/10 px-1 rounded not-italic">@</span> to reference images natively.
        </p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg text-left">
          <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-xl">
            <div className="font-semibold tracking-wider uppercase text-gray-300 text-[10px] mb-1">Image Generation</div>
            <div className="text-xs text-gray-500 font-serif italic">Toggle mode to Generate and type your prompt.</div>
          </div>
          <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-xl">
            <div className="font-semibold tracking-wider uppercase text-gray-300 text-[10px] mb-1">Vision Analysis</div>
            <div className="text-xs text-gray-500 font-serif italic">Upload or @mention an image and ask "What's this?"</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 scroll-smooth">
      <div className="py-8">
        {state.messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
