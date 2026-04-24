import React, { useRef, useState, useEffect } from 'react';
import { Send, Image as ImageIcon, Paperclip, X, ImagePlus, SquareTerminal, Sparkles, MessageSquare } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { generateId, fileToBase64, cn } from '../lib/utils';
import { ImageAsset } from '../types';

export function ChatInput({ onSubmit }: { onSubmit: (text: string, referencedAssets: string[]) => void }) {
  const { state, dispatch } = useAppStore();
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const allAssetIds = Object.keys(state.assets);
  const referencedAssets = allAssetIds.filter(id => text.includes(`@${id}`));

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    // Simple mention detection
    const lastWord = value.split(/\s/).pop();
    if (lastWord && lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && referencedAssets.length === 0) return;
    onSubmit(text, referencedAssets);
    setText('');
    dispatch({ type: 'SET_QUOTED_MESSAGE', payload: null });
  };

  const insertMention = (assetId: string) => {
    const words = text.split(/\s/);
    words.pop(); // remove the partial @xx
    const newText = [...words, `@${assetId} `].join(' ');
    setText(newText.startsWith(' ') ? newText.trimStart() : newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const b64 = await fileToBase64(file);
      const id = generateId('IMG_');
      const newAsset: ImageAsset = {
        id,
        name: file.name,
        url: b64,
        source: 'upload',
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_ASSET', payload: newAsset });
      setText(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + `@${id} `);
    } catch (err) {
      console.error('Failed to parse image', err);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const quotedMessage = state.quotedMessageId ? state.messages.find(m => m.id === state.quotedMessageId) : null;

  return (
    <div className="relative w-full max-w-4xl mx-auto p-8 pt-4 mt-auto shrink-0 bg-gradient-to-t from-[#050505] to-transparent">
      
      {/* Mode Selector */}
      <div className="flex bg-[#1a1a1a] rounded-t-2xl p-1 w-fit border-x border-t border-white/10 ml-4 mb-[-1px] relative z-10">
        <button
          onClick={() => dispatch({ type: 'SET_INPUT_MODE', payload: 'chat' })}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300",
            state.inputMode === 'chat' ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-white"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          AI Chat & Vision
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_INPUT_MODE', payload: 'image' })}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300",
            state.inputMode === 'image' ? "bg-purple-500/20 text-purple-200 shadow-sm" : "text-neutral-400 hover:text-white"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Generate Image
        </button>
      </div>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3 shadow-2xl relative z-20">
        
        {/* Quoted Message / Context */}
        {quotedMessage && (
          <div className="flex items-start bg-black/40 rounded-lg p-3 mb-3 border border-white/5">
            <div className="flex-1 text-sm text-neutral-300 line-clamp-2">
              <span className="text-white/50 font-mono text-xs mr-2 border-r border-white/10 pr-2">Replying to</span>
              {quotedMessage.content || "[Image]"}
            </div>
            <button onClick={() => dispatch({ type: 'SET_QUOTED_MESSAGE', payload: null })} className="text-neutral-500 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mentions Popover */}
        {showMentions && allAssetIds.length > 0 && (
          <div className="absolute bottom-full left-0 mb-4 w-64 bg-neutral-800 border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col p-2 gap-1 z-50">
            <div className="text-xs text-neutral-400 px-2 pb-1 mb-1 border-b border-white/10">Select an image reference</div>
            {allAssetIds
              .filter(id => id.toLowerCase().includes(mentionFilter))
              .slice(0, 5)
              .map(id => (
                <button
                  key={id}
                  onClick={() => insertMention(id)}
                  className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <img src={state.assets[id].url} className="w-8 h-8 rounded object-cover" alt="ref" />
                  <span className="text-sm text-white font-mono">{id}</span>
                </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={state.inputMode === 'chat' ? "Message AI... Type @ to reference images" : "Describe the image you want to generate..."}
          className="w-full bg-transparent text-white placeholder-neutral-500 outline-none resize-none px-2 min-h-[44px] max-h-48"
          rows={1}
        />

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors group relative"
            >
              <Paperclip className="w-5 h-5" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Upload Ref Image
              </span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

            {/* Thumbnails of referenced images */}
            {referencedAssets.map(id => (
               <div key={id} className="flex items-center gap-1 bg-black/40 rounded-md p-1 border border-white/10">
                 <img src={state.assets[id]?.url} alt={id} className="w-5 h-5 rounded-sm object-cover" />
                 <span className="text-[10px] text-neutral-300 font-mono select-none px-1">@{id}</span>
               </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() && referencedAssets.length === 0}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold tracking-widest hover:bg-gray-200 uppercase transition-all duration-300",
              (text.trim() || referencedAssets.length > 0) 
                 ? (state.inputMode === 'chat' ? "bg-white text-black shrink-0" : "bg-indigo-500 text-white shrink-0 hover:bg-indigo-400") 
                 : "bg-[#2a2a2a] text-gray-500"
            )}
          >
            {state.inputMode === 'chat' ? 'Send' : 'Generate'}
          </button>
        </div>
      </div>
      <div className="text-center mt-3">
        <p className="text-[10px] text-neutral-600">AI can make mistakes. Remember to verify vital info.</p>
      </div>
    </div>
  );
}
