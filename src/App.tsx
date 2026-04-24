import React, { useEffect } from 'react';
import { AppStateProvider, useAppStore } from './lib/store';
import { SettingsModal } from './components/SettingsModal';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import {
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Menu,
  X,
  Compass,
  GalleryVerticalEnd,
  BadgeCheck,
} from 'lucide-react';
import { generateId, cn } from './lib/utils';
import { fetchImageGeneration, fetchChatCompletionStream } from './lib/openai';
import { t } from './lib/i18n';
import { promptPresets, tagDefinitions } from './lib/promptLibrary';

function SidebarContent({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const { state, dispatch } = useAppStore();
  const locale = state.locale;
  const assetList = Object.values(state.assets).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="p-5 md:p-6 border-b border-white/8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[20px] bg-gradient-to-br from-fuchsia-300 via-amber-200 to-violet-500 flex items-center justify-center text-black shadow-[0_18px_50px_rgba(196,140,255,0.35)] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.36em] text-white/35">LUMINA</div>
              <div className="text-lg text-white font-light truncate">Atelier</div>
            </div>
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="md:hidden rounded-full p-2 text-white/50 hover:text-white hover:bg-white/8">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-5 rounded-[24px] border border-white/8 bg-white/5 p-4 text-sm text-white/68 leading-7">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/35 mb-2">
            <Compass className="w-4 h-4" />
            Atelier Notes
          </div>
          {locale === 'zh'
            ? '把灵感、参考图与生成结果收在同一个工作台里，让创作更连贯。'
            : 'Keep inspiration, references, and generations in one elegant workspace.'}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-6 space-y-6">
        <div className="rounded-[28px] border border-white/8 bg-black/15 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/35 mb-3">
            <GalleryVerticalEnd className="w-4 h-4" />
            {t(locale, 'gallery')} ({assetList.length})
          </div>
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

      <div className="p-5 md:p-6 border-t border-white/8 shrink-0 space-y-3">
        <div className="rounded-[22px] border border-emerald-300/12 bg-emerald-300/8 px-4 py-3 text-xs text-white/65 leading-6">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-emerald-100/70 mb-1">
            <BadgeCheck className="w-4 h-4" />
            {state.settings.useSharedProvider ? t(locale, 'sharedProviderBadge') : t(locale, 'personalProviderBadge')}
          </div>
          {state.settings.useSharedProvider
            ? state.runtimeConfig.sharedProviderDescription || t(locale, 'sharedProviderDescriptionFallback')
            : locale === 'zh'
              ? '当前使用你自己的模型配置，可以自由切换 endpoint / model / key。'
              : 'Currently using your own provider setup with full endpoint / model / key control.'}
        </div>
        <button
          onClick={() => {
            dispatch({ type: 'CLEAR_HISTORY' });
            onCloseMobile?.();
          }}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
        >
          {t(locale, 'newWorkspace')}
        </button>
      </div>
    </div>
  );
}

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

  const closeMobileSidebar = () => dispatch({ type: 'SET_MOBILE_SIDEBAR_OPEN', payload: false });
  const openMobileSidebar = () => dispatch({ type: 'SET_MOBILE_SIDEBAR_OPEN', payload: true });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent text-[#f4efe9]">
      <aside
        className={cn(
          'hidden md:flex border-r border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] backdrop-blur-2xl transition-all duration-300 z-30 shrink-0',
          showSidebar ? 'md:w-[22rem]' : 'md:w-0 md:overflow-hidden md:border-r-0',
        )}
      >
        <div className="h-full min-h-0 w-full">
          <SidebarContent />
        </div>
      </aside>

      {state.isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/72 backdrop-blur-md" onClick={closeMobileSidebar} aria-label="Close sidebar" />
          <aside className="absolute inset-y-0 left-0 w-[88vw] max-w-sm border-r border-white/10 bg-[#0d0c12]/95 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <SidebarContent onCloseMobile={closeMobileSidebar} />
          </aside>
        </div>
      )}

      <main className="relative flex-1 min-w-0 min-h-0 flex flex-col bg-transparent">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.08),transparent_26%)]" />

        <header className="relative shrink-0 border-b border-white/8 backdrop-blur-xl bg-black/10">
          <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={openMobileSidebar} className="md:hidden rounded-full p-2 text-white/55 hover:text-white hover:bg-white/8">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => setShowSidebar((prev) => !prev)} className="hidden md:inline-flex rounded-full p-2 text-white/55 hover:text-white hover:bg-white/8">
                {showSidebar ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </button>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.32em] text-white/35">{t(locale, 'navWorkspace')}</div>
                <div className="text-sm text-white/78 mt-0.5 truncate">{state.runtimeConfig.appName}</div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs text-white/60">
              <Sparkles className="w-4 h-4 text-fuchsia-200" />
              {t(locale, 'studioModeEnabled')}
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 md:px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/8 shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t(locale, 'settings')}</span>
            </button>
          </div>
        </header>

        <section className="relative shrink-0 px-4 md:px-8 pt-4 md:pt-5">
          <div className="mx-auto max-w-6xl rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 md:px-6 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.34em] text-white/36">
                  {t(locale, 'creativeRitual')}
                </div>
                <h1 className="mt-2 text-xl md:text-2xl text-white font-light tracking-[0.04em]">
                  {state.inputMode === 'image'
                    ? locale === 'zh'
                      ? '把灵感拼成一张能直接出图的提示词'
                      : 'Compose cinematic prompts from curated inspiration'
                    : locale === 'zh'
                      ? '和你的视觉助理一起打磨灵感与画面'
                      : 'Shape ideas with an AI visual assistant'}
                </h1>
                <p className="mt-2 text-sm md:text-[15px] text-white/58 max-w-3xl leading-7">
                  {state.inputMode === 'image'
                    ? locale === 'zh'
                      ? '从预设、风格标签、构图与材质细节中快速搭建高质量提示词，输入区与商店分层滚动，不再互相遮挡。'
                      : 'Build polished prompts from presets, style tags, composition, and materials with layered scrolling that keeps the editor visible.'
                    : locale === 'zh'
                      ? '聊天模式下保留稳定的消息流与底部输入区，适合对图像进行分析、追问和创意延展。'
                      : 'Chat mode keeps a clean message flow and anchored composer for image analysis, follow-up questions, and ideation.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[24rem]">
                <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/35 mb-2">{t(locale, 'modeLabel')}</div>
                  <div className="text-sm text-white/85">{state.inputMode === 'image' ? t(locale, 'imageGeneration') : t(locale, 'aiChatVision')}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/35 mb-2">{t(locale, 'libraryLabel')}</div>
                  <div className="text-sm text-white/85">{promptPresets.length} {t(locale, 'presetCountText')}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3 col-span-2 sm:col-span-1">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/35 mb-2">{t(locale, 'tagCountLabel')}</div>
                  <div className="text-sm text-white/85">{tagDefinitions.length} {t(locale, 'tagCountText')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden pt-3">
          <MessageList />
          <ChatInput onSubmit={handleSubmit} />
        </div>
      </main>

      {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />}
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
