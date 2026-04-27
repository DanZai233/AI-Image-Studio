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
  FolderOpen,
  Plus,
  Pencil,
  Image as ImageIcon,
  Archive,
} from 'lucide-react';
import { generateId, cn } from './lib/utils';
import { fetchImageGeneration, fetchChatCompletionStream } from './lib/openai';
import { t, tf } from './lib/i18n';
import { promptPresets, tagDefinitions } from './lib/promptLibrary';
import { ContextSnapshot } from './types';

const IMAGE_CONTEXT_MESSAGE_LIMIT = 6;
const IMAGE_CONTEXT_CHAR_LIMIT = 220;
const IMAGE_CONTEXT_ASSET_LIMIT = 4;

function SidebarContent({
  imageContextSnapshot,
  onCloseMobile,
}: {
  imageContextSnapshot: ContextSnapshot | null;
  onCloseMobile?: () => void;
}) {
  const { state, dispatch } = useAppStore();
  const locale = state.locale;
  const activeWorkspace = state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || state.workspaces[0];
  const assetList = Object.values(state.assets)
    .filter((asset) => asset.workspaceId === state.activeWorkspaceId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const workspaceMessages = state.messages.filter((message) => message.workspaceId === state.activeWorkspaceId);

  const handleRename = () => {
    if (!activeWorkspace) return;
    const nextName = window.prompt(locale === 'zh' ? '输入新的工作区名称' : 'Enter a new workspace name', activeWorkspace.name);
    if (nextName) {
      dispatch({ type: 'RENAME_WORKSPACE', payload: { id: activeWorkspace.id, name: nextName } });
    }
  };

  const handleArchive = () => {
    if (!activeWorkspace || state.workspaces.length <= 1) return;
    const confirmed = window.confirm(
      `${t(locale, 'workspaceDeleteConfirmPrefix')}${activeWorkspace.name}${t(locale, 'workspaceDeleteConfirmSuffix')}`,
    );
    if (confirmed) {
      dispatch({ type: 'ARCHIVE_WORKSPACE', payload: activeWorkspace.id });
    }
  };

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
            ? '每个工作区都会保存自己的聊天、参考图与生成结果，并默认作为同一上下文继续创作。'
            : 'Each workspace keeps its own chat, references, and generations, then reuses them as shared context.'}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-6 space-y-6">
        <div className="rounded-[28px] border border-white/8 bg-black/15 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/35">
              <FolderOpen className="w-4 h-4" />
              {locale === 'zh' ? '工作区' : 'Workspaces'}
            </div>
            <button
              onClick={() => {
                dispatch({ type: 'CREATE_WORKSPACE' });
                onCloseMobile?.();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/75 hover:bg-white/10"
            >
              <Plus className="w-4 h-4" />
              {locale === 'zh' ? '新建' : 'New'}
            </button>
          </div>

          <div className="space-y-2">
            {state.workspaces
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((workspace) => {
                const isActive = workspace.id === state.activeWorkspaceId;
                const workspaceAssetCount = Object.values(state.assets).filter((asset) => asset.workspaceId === workspace.id).length;
                const workspaceMessageCount = state.messages.filter((message) => message.workspaceId === workspace.id).length;
                return (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: workspace.id });
                      onCloseMobile?.();
                    }}
                    className={cn(
                      'w-full rounded-[22px] border p-3 text-left transition-all',
                      isActive ? 'border-fuchsia-300/30 bg-fuchsia-300/12' : 'border-white/8 bg-white/[0.03] hover:bg-white/8',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white font-medium">{workspace.name}</div>
                        <div className="mt-1 text-xs text-white/45">
                          {workspaceMessageCount} {locale === 'zh' ? '条消息' : 'messages'} · {workspaceAssetCount} {locale === 'zh' ? '张图片' : 'images'}
                        </div>
                      </div>
                      {isActive && <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">LIVE</span>}
                    </div>
                  </button>
                );
              })}
          </div>

          {activeWorkspace && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={handleRename} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/65 hover:bg-white/10">
                <Pencil className="w-4 h-4" />
                {locale === 'zh' ? '重命名当前工作区' : 'Rename current workspace'}
              </button>
              <button
                onClick={handleArchive}
                disabled={state.workspaces.length <= 1}
                className="inline-flex items-center gap-2 rounded-full border border-rose-300/15 bg-rose-300/8 px-3 py-1.5 text-xs text-rose-100/75 hover:bg-rose-300/12 disabled:opacity-40"
              >
                <Archive className="w-4 h-4" />
                {locale === 'zh' ? '删除当前工作区' : 'Delete current workspace'}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/8 bg-black/15 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/35 mb-3">
            <GalleryVerticalEnd className="w-4 h-4" />
            {t(locale, 'gallery')} ({assetList.length})
          </div>
          <div className="grid grid-cols-2 gap-3">
            {assetList.map((asset) => (
              <button
                key={asset.id}
                onClick={() => dispatch({ type: 'SET_LIGHTBOX_ASSET', payload: asset.id })}
                className="group relative aspect-square overflow-hidden rounded-[22px] border border-white/10 bg-black/20 text-left"
              >
                <img src={asset.url} alt={asset.id} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-[11px] text-white/70 font-mono truncate">@{asset.id}</div>
              </button>
            ))}
            {assetList.length === 0 && <div className="col-span-2 text-sm text-white/35 italic leading-7">{t(locale, 'noImages')}</div>}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/8 bg-black/15 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/35 mb-3">
            <ImageIcon className="w-4 h-4" />
            {locale === 'zh' ? '当前上下文' : 'Current context'}
          </div>
          <p className="text-sm text-white/58 leading-7">
            {locale === 'zh'
              ? `当前工作区已保存 ${workspaceMessages.length} 条消息与 ${assetList.length} 张图片；聊天和生成都会默认带上这些上下文。`
              : `This workspace keeps ${workspaceMessages.length} messages and ${assetList.length} images; chat and generation automatically reuse them as context.`}
          </p>
          <div className="mt-4 rounded-[22px] border border-fuchsia-300/10 bg-fuchsia-300/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-fuchsia-100/65 mb-2">{t(locale, 'contextPreviewTitle')}</div>
            <p className="text-sm text-white/62 leading-6">{t(locale, 'contextPreviewHint')}</p>
            <div className="mt-3 text-xs text-white/45 leading-6">
              {tf(locale, 'contextPreviewStats', {
                messages: imageContextSnapshot?.messageCount || Math.min(workspaceMessages.length, IMAGE_CONTEXT_MESSAGE_LIMIT),
                images: imageContextSnapshot?.imageCount || Math.min(assetList.length, IMAGE_CONTEXT_ASSET_LIMIT),
                modes: (imageContextSnapshot?.modes || ['chat', 'image'])
                  .map((mode) => (mode === 'chat' ? t(locale, 'contextModeChat') : t(locale, 'contextModeImage')))
                  .join(' / '),
              })}
            </div>
            <div className="mt-2 text-xs text-white/38 leading-6">
              {imageContextSnapshot?.clipped ?? workspaceMessages.length > IMAGE_CONTEXT_MESSAGE_LIMIT
                ? t(locale, 'contextPreviewClipped')
                : t(locale, 'contextPreviewRaw')}
            </div>
            <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-xs text-white/52 leading-6">
              {t(locale, 'workspaceContinuityLabel')} · {t(locale, 'workspaceContinuityHint')}
            </div>
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
            dispatch({ type: 'CREATE_WORKSPACE' });
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

function Lightbox() {
  const { state, dispatch } = useAppStore();
  const asset = state.lightboxAssetId ? state.assets[state.lightboxAssetId] : null;
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8">
      <button className="absolute inset-0 bg-black/88 backdrop-blur-md" onClick={() => dispatch({ type: 'SET_LIGHTBOX_ASSET', payload: null })} />
      <div className="relative max-w-6xl w-full flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-black/35 px-4 py-3 text-white/75 backdrop-blur-xl">
          <div className="min-w-0 truncate font-mono text-sm">@{asset.id}</div>
          <button onClick={() => dispatch({ type: 'SET_LIGHTBOX_ASSET', payload: null })} className="rounded-full border border-white/10 bg-white/6 p-2 hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/30 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
          <img src={asset.url} alt={asset.id} className="max-h-[78vh] w-full object-contain bg-black" />
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { state, dispatch } = useAppStore();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const [imageContextSnapshot, setImageContextSnapshot] = React.useState<ContextSnapshot | null>(null);
  const locale = state.locale;
  const activeWorkspace = state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) || state.workspaces[0];
  const workspaceMessages = state.messages.filter((message) => message.workspaceId === state.activeWorkspaceId);

  useEffect(() => {
    fetch('/api/provider/unlock')
      .then((res) => res.json())
      .then((config) => dispatch({ type: 'SET_RUNTIME_CONFIG', payload: config }))
      .catch(() => undefined);
  }, [dispatch]);

  const selectedPreset = promptPresets.find((preset) => preset.id === state.promptBuilder.selectedPresetId) || null;
  const selectedTags = tagDefinitions.filter((tag) => state.promptBuilder.selectedTagIds.includes(tag.id));

  const buildImageGenerationContext = (nextUserMessage?: { id: string; content: string; imageAssets: string[] }): ContextSnapshot => {
    const candidateMessages = nextUserMessage ? [...workspaceMessages, {
      id: nextUserMessage.id,
      role: 'user' as const,
      content: nextUserMessage.content,
      mode: 'image' as const,
      imageAssets: nextUserMessage.imageAssets,
      timestamp: Date.now(),
      workspaceId: state.activeWorkspaceId,
    }] : [...workspaceMessages];

    const recentMessages = candidateMessages.slice(-IMAGE_CONTEXT_MESSAGE_LIMIT);
    const uniqueModes = Array.from(new Set(recentMessages.map((message) => message.mode)));
    const imageCueLines: string[] = [];
    const messageLines = recentMessages.map((message) => {
      const clippedContent = (message.content || '').trim().replace(/\s+/g, ' ').slice(0, IMAGE_CONTEXT_CHAR_LIMIT);
      const referencedAssets = (message.imageAssets || [])
        .map((assetId) => state.assets[assetId])
        .filter(Boolean)
        .slice(0, IMAGE_CONTEXT_ASSET_LIMIT);

      referencedAssets.forEach((asset) => {
        imageCueLines.push(`@${asset.id}${asset.prompt ? `: ${asset.prompt.slice(0, 120)}` : ''}`);
      });

      return `${message.role === 'user' ? 'User' : 'Assistant'} (${message.mode}): ${clippedContent || '(empty)'}${referencedAssets.length ? ` [images: ${referencedAssets.map((asset) => `@${asset.id}`).join(', ')}]` : ''}`;
    });

    const uniqueImageCues = Array.from(new Set(imageCueLines)).slice(0, IMAGE_CONTEXT_ASSET_LIMIT);
    const summaryParts = [
      locale === 'zh'
        ? '以下是当前工作区最近的关键创作上下文，请延续这些视觉线索、构图倾向与语义约束。'
        : 'Below is the latest high-signal workspace context. Continue these visual cues, composition tendencies, and semantic constraints.',
      ...messageLines,
      uniqueImageCues.length
        ? `${locale === 'zh' ? '重点图像线索' : 'Key image cues'}: ${uniqueImageCues.join(' | ')}`
        : '',
    ].filter(Boolean);

    const originalTextLength = candidateMessages.map((message) => (message.content || '').trim().length).reduce((sum, value) => sum + value, 0);
    const summary = summaryParts.join('\n');
    const clipped = candidateMessages.length > recentMessages.length || originalTextLength > summary.length;

    return {
      summary,
      messageCount: recentMessages.length,
      imageCount: uniqueImageCues.length,
      clipped,
      modes: uniqueModes.length ? uniqueModes : ['image'],
    };
  };

  const buildWorkspaceContextMessages = (nextUserMessage?: { id: string; content: string; imageAssets: string[] }) => {
    const baseMessages = [...workspaceMessages];

    if (nextUserMessage) {
      baseMessages.push({
        id: nextUserMessage.id,
        role: 'user',
        content: nextUserMessage.content,
        mode: state.inputMode,
        imageAssets: nextUserMessage.imageAssets,
        timestamp: Date.now(),
        workspaceId: state.activeWorkspaceId,
      });
    }

    return baseMessages.map((m) => {
      const contentParts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];
      const textContent = m.content?.trim();
      if (textContent) {
        contentParts.push({ type: 'text', text: textContent });
      }
      (m.imageAssets || []).forEach((assetId) => {
        const asset = state.assets[assetId];
        if (asset) {
          contentParts.push({ type: 'image_url', image_url: { url: asset.url } });
        }
      });

      if (contentParts.length === 0) {
        contentParts.push({ type: 'text', text: '(Empty message)' });
      }

      return {
        role: m.role,
        content: contentParts.length === 1 && contentParts[0].type === 'text' ? contentParts[0].text : contentParts,
      };
    });
  };

  const handleSubmit = async (text: string, referencedAssets: string[]) => {
    const { inputMode, settings } = state;

    const metadata = {
      presetId: state.promptBuilder.selectedPresetId || undefined,
      tags: selectedTags.map((tag) => tag.value),
    };

    const userMsgId = generateId('msg_');
    const userMessage = {
      id: userMsgId,
      role: 'user' as const,
      content: text,
      mode: inputMode,
      imageAssets: referencedAssets,
      quotedMessageId: state.quotedMessageId,
      timestamp: Date.now(),
      metadata,
      workspaceId: state.activeWorkspaceId,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

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
            workspaceId: state.activeWorkspaceId,
          },
        });

        try {
          const referenceAssets = referencedAssets.map((assetId) => state.assets[assetId]).filter(Boolean);
          const contextSnapshot = buildImageGenerationContext({ id: userMsgId, content: text, imageAssets: referencedAssets });
          const fallbackContext = contextSnapshot.summary;

          const requestedImageMode = settings.imageMode === 'auto' ? (referenceAssets.length > 0 ? 'edit' : 'generate') : settings.imageMode;
          const generationResult = await fetchImageGeneration(
            settings,
            text,
            referenceAssets,
            fallbackContext,
            requestedImageMode,
            workspaceMessages.slice(-IMAGE_CONTEXT_MESSAGE_LIMIT).map((message) => ({
              id: message.id,
              content: message.content,
              mode: message.mode,
              imageAssets: message.imageAssets || [],
            })),
          );
          const b64Url = generationResult.image;
          setImageContextSnapshot(generationResult.contextSnapshot || contextSnapshot);
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
              workspaceId: state.activeWorkspaceId,
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
              workspaceId: state.activeWorkspaceId,
            },
          });
        } catch (err) {
          dispatch({ type: 'REMOVE_MESSAGE', payload: tempMsgId });
          throw err;
        }
      } else {
        const aiMsgId = generateId('msg_');
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { id: aiMsgId, role: 'assistant', content: '', mode: 'chat', timestamp: Date.now(), workspaceId: state.activeWorkspaceId },
        });

        const history = buildWorkspaceContextMessages({ id: userMsgId, content: text, imageAssets: referencedAssets });

        const systemPrompt =
          locale === 'zh'
            ? '你是一位智能视觉助理。你可以理解用户上传的图片、工作区内已有的参考图和历史对话。回答时使用 Markdown，并在合适时提供更有审美和结构性的建议。'
            : 'You are an intelligent visual assistant. You can understand user-uploaded images, workspace reference images, and prior dialogue. Respond in Markdown and offer tasteful, structured creative suggestions when helpful.';

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
          workspaceId: state.activeWorkspaceId,
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
          <SidebarContent imageContextSnapshot={imageContextSnapshot} />
        </div>
      </aside>

      {state.isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/72 backdrop-blur-md" onClick={closeMobileSidebar} aria-label="Close sidebar" />
          <aside className="absolute inset-y-0 left-0 w-[88vw] max-w-sm border-r border-white/10 bg-[#0d0c12]/95 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <SidebarContent imageContextSnapshot={imageContextSnapshot} onCloseMobile={closeMobileSidebar} />
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
                <div className="text-sm text-white/78 mt-0.5 truncate">{activeWorkspace?.name || state.runtimeConfig.appName}</div>
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
                <div className="text-[11px] uppercase tracking-[0.34em] text-white/36">{t(locale, 'creativeRitual')}</div>
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
                      ? '当前工作区会自动带上历史对话、参考图与生成结果作为上下文，并优先把引用图片直接送入生成接口。'
                      : 'Your active workspace carries prior dialogue, references, and generations as context, and now forwards referenced images directly to the generation API when supported.'
                    : locale === 'zh'
                      ? '聊天模式下会读取当前工作区中的图片与文字上下文，适合对图像进行分析、追问和创意延展。'
                      : 'Chat mode reads the current workspace images and text context, ideal for analysis, follow-up questions, and ideation.'}
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
      <Lightbox />
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
