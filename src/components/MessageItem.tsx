import React from 'react';
import { Reply, Download, Share2, Eye, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message } from '../types';
import { useAppStore } from '../lib/store';
import ReactMarkdown from 'react-markdown';

export function MessageItem({ message }: { message: Message }) {
  const { state, dispatch } = useAppStore();
  const isAI = message.role === 'assistant';

  const assets = (message.imageAssets || []).map(id => state.assets[id]).filter(Boolean);
  const quotedMessage = message.quotedMessageId ? state.messages.find(m => m.id === message.quotedMessageId) : null;

  const handleDownload = (id: string, url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async (id: string, url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `${id}.png`, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'AI Image Studio Result',
        });
      } else {
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        alert('Image copied to clipboard!');
      }
    } catch (e) {
      console.error(e);
      alert('Could not share or copy image.');
    }
  };

  const handleMentionImage = (id: string) => {
    // This is basically "Analyze/Describe" action - setting it in the input area
    // Just copy the ID into the clipboard or auto-fill input? We can dispatch to an input ref theoretically, but simpler to set context.
    // For now we'll just set it as quoted message. 
    dispatch({ type: 'SET_QUOTED_MESSAGE', payload: message.id });
  };

  // Convert text markers like @IMG_XYZ into actual visual chips within text if we wanted,
  // but Markdown might mess it up. Wait, ReactMarkdown will just render it as text, which is fine since we have the assets array above/below it.

  return (
    <div className={cn("flex flex-col mb-8 animate-in fade-in slide-in-from-bottom-2", isAI ? "items-start" : "items-end")}>
      {quotedMessage && (
        <div className={cn("flex flex-col max-w-full text-xs text-neutral-500 mb-1 px-4 border-l-2 border-neutral-700/50", isAI ? "text-left" : "text-right")}>
          <span className="mb-0.5 opacity-70">Replying to msg:</span>
          <div className="truncate w-full max-w-[300px]">
            {quotedMessage.content || "[Image Attachment]"}
          </div>
        </div>
      )}

      <div className={cn(
        "group relative flex flex-col gap-2 max-w-[85%]",
        isAI ? "" : "items-end"
      )}>
        
        {/* Render Attached Images */}
        {assets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {assets.map((asset) => (
              <div key={asset.id} className="relative group/asset rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/50">
                <img 
                  src={asset.url} 
                  alt={asset.id} 
                  className={cn(
                     "object-cover block",
                     message.mode === 'image' && isAI ? "w-full max-w-sm" : "w-48 max-h-48"
                  )} 
                />
                
                {/* Image Toolbar Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/asset:opacity-100 transition-opacity flex flex-col justify-between p-3">
                   <div className="text-white/80 font-mono text-xs drop-shadow-md">
                      @{asset.id}
                   </div>
                   <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleMentionImage(asset.id)} title="Quote/Analyze Image" className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-md text-white transition-colors">
                        <Reply className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleShare(asset.id, asset.url)} title="Share / Copy" className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-md text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownload(asset.id, asset.url)} title="Download" className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-md text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Text Bubble */}
        {message.content && (
          <div className={cn(
            "p-4 rounded-2xl text-[15px] leading-relaxed break-words",
            isAI ? "bg-indigo-500/5 text-[#e5e5e5] border border-indigo-500/20 rounded-tl-sm max-w-xl" : "bg-white/5 text-[#e5e5e5] border border-white/10 rounded-tr-sm shadow-2xl max-w-xl",
            message.isError && "bg-red-950/50 border-red-500/50 text-red-200"
          )}>
            <div className={cn(isAI ? "markdown-body" : "whitespace-pre-wrap")}>
               {isAI ? (
                 <ReactMarkdown>{message.content}</ReactMarkdown>
               ) : (
                 message.content
               )}
            </div>
            
            {/* Action Bar for Message */}
            <div className={cn(
              "absolute top-0 -translate-y-1 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1",
              isAI ? "-right-12" : "-left-12"
            )}>
              <button onClick={() => dispatch({ type: 'SET_QUOTED_MESSAGE', payload: message.id })} className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Reply / Quote">
                <Reply className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
