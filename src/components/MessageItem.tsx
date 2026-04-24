import React from 'react';
import { Reply, Download, Share2, ZoomIn } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message } from '../types';
import { useAppStore } from '../lib/store';
import ReactMarkdown from 'react-markdown';
import { t } from '../lib/i18n';

export function MessageItem({ message }: { message: Message }) {
  const { state, dispatch } = useAppStore();
  const isAI = message.role === 'assistant';
  const locale = state.locale;

  const assets = (message.imageAssets || []).map((id) => state.assets[id]).filter(Boolean);
  const workspaceMessages = state.messages.filter((item) => item.workspaceId === state.activeWorkspaceId);
  const quotedMessage = message.quotedMessageId ? workspaceMessages.find((m) => m.id === message.quotedMessageId) : null;

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
        await navigator.share({ files: [file], title: 'LUMINA Atelier' });
      } else {
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
      }
    } catch (e) {
      console.error(e);
      alert('Could not share or copy image.');
    }
  };

  return (
    <div className={cn('flex flex-col mb-8 animate-in fade-in slide-in-from-bottom-2', isAI ? 'items-start' : 'items-end')}>
      {quotedMessage && (
        <div className={cn('flex flex-col max-w-full text-xs text-white/40 mb-2 px-4 border-l border-white/15', isAI ? 'text-left' : 'text-right')}>
          <span className="mb-1 uppercase tracking-[0.25em] text-[10px]">{t(locale, 'quoteReplyingTo')}</span>
          <div className="truncate w-full max-w-[360px]">{quotedMessage.content || '[Image Attachment]'}</div>
        </div>
      )}

      <div className={cn('group relative flex flex-col gap-3 max-w-[88%]', isAI ? '' : 'items-end')}>
        {assets.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {assets.map((asset) => (
              <div key={asset.id} className="relative group/asset rounded-[24px] overflow-hidden border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] bg-black/50">
                <button onClick={() => dispatch({ type: 'SET_LIGHTBOX_ASSET', payload: asset.id })} className="block">
                  <img
                    src={asset.url}
                    alt={asset.id}
                    className={cn('object-cover block', message.mode === 'image' && isAI ? 'w-full max-w-lg' : 'w-52 max-h-56')}
                  />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-0 group-hover/asset:opacity-100 transition-opacity flex flex-col justify-between p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-white/80 font-mono text-xs">@{asset.id}</div>
                    <button onClick={() => dispatch({ type: 'SET_LIGHTBOX_ASSET', payload: asset.id })} className="p-2 bg-white/15 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition-colors">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => dispatch({ type: 'SET_QUOTED_MESSAGE', payload: message.id })} className="p-2 bg-white/15 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition-colors">
                      <Reply className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleShare(asset.id, asset.url)} className="p-2 bg-white/15 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDownload(asset.id, asset.url)} className="p-2 bg-white/15 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {message.content && (
          <div
            className={cn(
              'p-5 rounded-[26px] text-[15px] leading-8 break-words backdrop-blur-sm',
              isAI
                ? 'bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] text-white border border-white/10 rounded-tl-md max-w-2xl'
                : 'bg-[linear-gradient(145deg,rgba(233,213,255,0.15),rgba(255,255,255,0.06))] text-white border border-fuchsia-200/15 rounded-tr-md shadow-[0_18px_50px_rgba(0,0,0,0.22)] max-w-2xl',
              message.isError && 'bg-red-950/50 border-red-500/50 text-red-200',
            )}
          >
            <div className={cn(isAI ? 'markdown-body' : 'whitespace-pre-wrap')}>{isAI ? <ReactMarkdown>{message.content}</ReactMarkdown> : message.content}</div>
            <div className={cn('absolute top-0 -translate-y-1 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1', isAI ? '-right-12' : '-left-12')}>
              <button onClick={() => dispatch({ type: 'SET_QUOTED_MESSAGE', payload: message.id })} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Reply className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
