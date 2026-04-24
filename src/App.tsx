import React, { useState } from 'react';
import { AppStateProvider, useAppStore } from './lib/store';
import { SettingsModal } from './components/SettingsModal';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { Settings, Sparkle, LayoutPanelLeft } from 'lucide-react';
import { generateId, cn } from './lib/utils';
import { fetchImageGeneration, fetchChatCompletionStream } from './lib/openai';

function MainApp() {
  const { state, dispatch } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleSubmit = async (text: string, referencedAssets: string[]) => {
    const { inputMode, settings } = state;
    
    // Add user message
    const userMsgId = generateId('msg_');
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: userMsgId,
        role: 'user',
        content: text,
        mode: inputMode,
        imageAssets: referencedAssets,
        quotedMessageId: state.quotedMessageId,
        timestamp: Date.now()
      }
    });

    try {
      if (inputMode === 'image') {
        const tempMsgId = generateId('temp_');
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: tempMsgId,
            role: 'assistant',
            content: 'Generating image... ✨',
            mode: 'image',
            timestamp: Date.now()
          }
        });

        const b64Url = await fetchImageGeneration(settings, text);
        const imgId = generateId('IMG_');
        
        // Remove temp message
        dispatch({ type: 'REMOVE_MESSAGE', payload: tempMsgId });

        // Add the asset and then the actual message
        dispatch({
          type: 'ADD_ASSET',
          payload: { id: imgId, name: `Gen_${imgId}`, url: b64Url, source: 'generation', createdAt: Date.now() }
        });
        
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { id: generateId('msg_'), role: 'assistant', content: '', mode: 'image', imageAssets: [imgId], timestamp: Date.now() }
        });
        
      } else {
        // Chat Mode
        const aiMsgId = generateId('msg_');
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { id: aiMsgId, role: 'assistant', content: '', mode: 'chat', timestamp: Date.now() }
        });

        // Current snapshot plus previous history context
        // Map messages into proper OpenAI format
        const history = [...state.messages, { id: userMsgId, role: 'user', content: text, imageAssets: referencedAssets }].map(m => {
          if (!m.imageAssets || m.imageAssets.length === 0) {
             return { role: m.role, content: m.content };
          }
          // Vision formatting
          const contentParts: any[] = [{ type: 'text', text: m.content || '(Included Image)' }];
          m.imageAssets.forEach(assetId => {
             const asset = state.assets[assetId];
             if (asset) {
               contentParts.push({ type: 'image_url', image_url: { url: asset.url } });
             }
          });
          return { role: m.role, content: contentParts };
        });

        const systemPrompt = "You are an intelligent visual assistant. You can see images the user provides. Respond in Markdown.";

        const stream = fetchChatCompletionStream(settings, systemPrompt, history);
        for await (const chunk of stream) {
           dispatch({ type: 'UPDATE_MESSAGE', payload: { id: aiMsgId, content: chunk } });
        }
      }
    } catch (err: any) {
       console.error(err);
       dispatch({
          type: 'ADD_MESSAGE',
          payload: { id: generateId('err_'), role: 'assistant', content: err.message || "An error occurred.", mode: inputMode, timestamp: Date.now(), isError: true }
       });
    }
  };

  const assetList = Object.values(state.assets).sort((a,b) => b.createdAt - a.createdAt);

  return (
    <div className="flex h-screen w-full bg-[#050505] text-[#e5e5e5] overflow-hidden font-sans">
      
      {/* Sidebar: Asset Gallery visually hidden on small screens unless toggled */}
      <div className={cn(
        "flex flex-col w-72 bg-[#0a0a0a] border-r border-white/10 transition-all duration-300 z-40 shrink-0",
        showSidebar ? "translate-x-0" : "-translate-x-full absolute md:relative md:translate-x-0"
      )}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h1 className="text-xl font-light tracking-widest text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
            LUMINA.AI
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 block">Asset Gallery ({assetList.length})</label>
          <div className="grid grid-cols-2 gap-2">
            {assetList.map(asset => (
               <div key={asset.id} className="aspect-square bg-white/5 rounded border border-white/10 overflow-hidden relative group cursor-pointer">
                 <img src={asset.url} alt={asset.id} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center pointer-events-none">
                   <span className="text-[10px] text-white break-all">@{asset.id}</span>
                 </div>
               </div>
            ))}
            {assetList.length === 0 && (
              <div className="col-span-2 py-8 text-center text-xs text-gray-600 font-serif italic">No images yet. Upload or generate!</div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-white/5 mt-auto">
          <button 
            onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}
            className="w-full bg-white text-black text-xs font-bold py-3 rounded hover:bg-gray-200 transition-colors uppercase tracking-widest"
          >
            New Workspace
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 bg-black/20">
        
        {/* Top Header */}
        <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <LayoutPanelLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm tracking-wide text-gray-300 truncate">WORKSPACE <span className="opacity-50">#1</span></h1>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </header>

        {/* Chat History */}
        <MessageList />

        {/* Input Region */}
        <ChatInput onSubmit={handleSubmit} />
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <MainApp />
    </AppStateProvider>
  );
}
