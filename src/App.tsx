import React, { useEffect } from 'react';
import { AppStateProvider, useAppStore } from './lib/store';
import { SettingsModal } from './components/SettingsModal';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { Settings, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import { generateId, cn } from './lib/utils';
import { fetchImageGeneration, fetchChatCompletionStream } from './lib/openai';
import { t } from './lib/i18n';
import { promptPresets, tagDefinitions } from './lib/promptLibrary';

function MainApp() {
  const { state, dispatch } = useAppStore();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const locale = state.locale;

  useEffect(() => {
    fetch('/api/provider/unlock')
      .then((res) => res.json())
      .then((config) => dispatch({ type: 'SET_RUNTIME_CONFIG', payload: config }))
      .catch(() => undefined);
  }, [dispatch]);

  const selectedPreset = promptPresets.find((preset) => preset.id === state.promptBuilder.selectedPresetId) || null;
  const selectedTags = tagDefinitions.filter((tag) => state.promptBuilder.selectedTagIds.includes(tag.id));

  const handleSubmit = async (text: string, referencedAssets: string[]) => {
    const { inputMode, settings } = state;

    const metadata = {
      presetId: state.promptBuilder.selectedPresetId || undefined,
      tags: selectedTags.map((tag) => tag.value),
    };

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
        timestamp: Date.now(),
        metadata,
      },
    });

    try {
      if (inputMode === 'image') {
        const tempMsgId = generateId('temp_');
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: tempMsgId,
            role: 'assistant',
            content: locale === 'zh' ? '正在生成图像，请稍候…' : 'Generating your image…',
            mode: 'image',
            timestamp: Date.now(),
          },
        });

        const b64Url = await fetchImageGeneration(settings, text);
        const imgId = generateId('IMG_');

        dispatch({ type: 'REMOVE_MESSAGE', payload: tempMsgId });
        dispatch({
          type: 'ADD_ASSET',
          payload: {
            id: imgId,
            name: `Gen_${imgId}`,
            url: b64Url,
            source: 'generation',
            createdAt: Date.now(),
            prompt: text,
          },
        });

        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: generateId('msg_'),
            role: 'assistant',
            content: selectedPreset
              ? `${locale === 'zh' ? '已根据预设生成：' : 'Generated with preset:'} ${selectedPreset.title[locale]}`
              : locale === 'zh'
                ? '图像生成完成。'
                : 'Image generation complete.',
            mode: 'image',
            imageAssets: [imgId],
            timestamp: Date.now(),
            metadata,
          },
        });
      } else {
        const aiMsgId = generateId('msg_');
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { id: aiMsgId, role: 'assistant', content: '', mode: 'chat', timestamp: Date.now() },
        });

        const history = [...state.messages, { id: userMsgId, role: 'user', content: text, imageAssets: referencedAssets }].map((m) => {
          if (!m.imageAssets || m.imageAssets.length === 0) {
            return { role: m.role, content: m.content };
          }
          const contentParts: any[] = [{ type: 'text', text: m.content || '(Included Image)' }];
          m.imageAssets.forEach((assetId: string) => {
            const asset = state.assets[assetId];
            if (asset) {
              contentParts.push({ type: 'image_url', image_url: { url: asset.url } });
            }
          });
          return { role: m.role, content: contentParts };
        });

        const systemPrompt =
          locale === 'zh'
            ? '你是一位智能视觉助理。你可以理解用户上传的图片，回答时使用 Markdown，并在合适时提供更有审美和结构性的建议。'
            : 'You are an intelligent visual assistant. You can understand user images, respond in Markdown, and provide tasteful, structured creative suggestions when helpful.';

        const stream = fetchChatCompletionStream(settings, systemPrompt, history);
        for await (const chunk of stream) {
          dispatch({ type: 'UPDATE_MESSAGE', payload: { id: aiMsgId, content: chunk } });
        }
      }
    } catch (err: any) {
      console.error(err);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: generateId('err_'),
          role: 'assistant',
          content: err.message || (locale === 'zh' ? '发生错误。' : 'An error occurred.'),
          mode: inputMode,
          timestamp: Date.now(),
          isError: true,
        },
      });
    }
  };

  const assetList = Object.values(state.assets).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex h-screen w-full overflow-hidden text-[#f4efe9]">
      <aside
        className={cn(
          'border-r border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] backdrop-blur-xl transition-all duration-300 z-40 shrink-0',
          showSidebar ? 'w-80' : 'w-0 overflow-hidden border-r-0',
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-400 via-amber-200 to-purple-500 flex items-center justify-center text-black shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm uppercase tracking-[0.32em] text-white/35">LUMINA</div>
                <div className="text-lg text-white font-light">Atelier</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="text-[11px] uppercase tracking-[0.28em] text-white/35 mb-3 block">
                {t(locale, 'gallery')} ({assetList.length})
              </label>
              <div className="grid grid-cols-2 gap-3">
                {assetList.map((asset) => (
                  <div key={asset.id} className="group relative aspect-square overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
                    <img src={asset.url} alt={asset.id} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-[11px] text-white/70 font-mono truncate">
                      @{asset.id}
                    </div>
                  </div>
                ))}
                {assetList.length === 0 && <div className="col-span-2 text-sm text-white/35 italic leading-7">{t(locale, 'noImages')}</div>}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/8">
            <button
              onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              {t(locale, 'newWorkspace')}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        <header className="h-16 shrink-0 border-b border-white/8 flex items-center justify-between px-4 md:px-8 backdrop-blur-xl bg-black/10">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setShowSidebar((prev) => !prev)} className="rounded-full p-2 text-white/55 hover:text-white hover:bg-white/8">
              {showSidebar ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div>
              <div className="text-[11px] uppercase tracking-[0.32em] text-white/35">{t(locale, 'navWorkspace')}</div>
              <div className="text-sm text-white/75 mt-0.5">{state.runtimeConfig.appName}</div>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/8"
          >
            <Settings className="w-4 h-4" />
            {t(locale, 'settings')}
          </button>
        </header>

        <MessageList />
        <ChatInput onSubmit={handleSubmit} />
      </main>

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
