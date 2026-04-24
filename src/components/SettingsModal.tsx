import React, { useMemo, useState } from 'react';
import { X, ShieldCheck, KeyRound, Globe2, ImagePlus } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { t } from '../lib/i18n';
import { unlockSharedProvider } from '../lib/openai';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state, dispatch } = useAppStore();
  const { settings, locale, runtimeConfig } = state;
  const [unlockStatus, setUnlockStatus] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');
  const sharedDescription = runtimeConfig.sharedProviderDescription || t(locale, 'sharedProviderDescriptionFallback');

  const modeLabel = useMemo(
    () => (settings.useSharedProvider ? t(locale, 'sharedProviderBadge') : t(locale, 'personalProviderBadge')),
    [settings.useSharedProvider, locale],
  );

  if (!isOpen) return null;

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SETTINGS', payload: { [e.target.name]: e.target.value } });
  };

  const handleUnlock = async () => {
    setUnlockError('');
    setUnlockStatus('');
    try {
      await unlockSharedProvider(settings.sharedPassword);
      dispatch({ type: 'SET_SETTINGS', payload: { useSharedProvider: true } });
      setUnlockStatus(t(locale, 'unlockSuccess'));
    } catch (error: any) {
      setUnlockError(error.message || t(locale, 'invalidPassword'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0f0f13]/95 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-white/40">{t(locale, 'modelConfiguration')}</div>
            <div className="mt-2 text-white text-xl font-light">{runtimeConfig.appName}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/45 hover:bg-white/8 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-[26px] border border-white/8 bg-white/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-2xl bg-amber-300/12 p-3 text-amber-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-white">{runtimeConfig.sharedProviderLabel}</div>
                  <div className="text-xs text-white/45 mt-1">{modeLabel}</div>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-6">{sharedDescription}</p>

              {runtimeConfig.sharedProviderEnabled && (
                <div className="mt-5 space-y-3">
                  <label className="block text-[11px] uppercase tracking-[0.28em] text-white/40">{t(locale, 'sharedPassword')}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        name="sharedPassword"
                        type="password"
                        value={settings.sharedPassword}
                        onChange={handleFieldChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-fuchsia-300/30"
                        placeholder="••••••••"
                      />
                    </div>
                    <button onClick={handleUnlock} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90">
                      {t(locale, 'unlockShared')}
                    </button>
                  </div>
                  <p className="text-xs text-white/40 leading-5">{t(locale, 'unlockHint')}</p>
                  {unlockStatus && <p className="text-xs text-emerald-300">{unlockStatus}</p>}
                  {unlockError && <p className="text-xs text-rose-300">{unlockError}</p>}
                </div>
              )}
            </div>

            <div className="rounded-[26px] border border-white/8 bg-white/5 p-5 space-y-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/40">{t(locale, 'providerMode')}</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => dispatch({ type: 'SET_SETTINGS', payload: { useSharedProvider: true } })}
                  disabled={!runtimeConfig.sharedProviderEnabled}
                  className={`rounded-2xl border p-4 text-left ${settings.useSharedProvider ? 'border-fuchsia-300/30 bg-fuchsia-400/10' : 'border-white/8 bg-black/15'} disabled:opacity-40`}
                >
                  <div className="text-sm text-white mb-1">{t(locale, 'sharedProvider')}</div>
                  <div className="text-xs text-white/45">{sharedDescription}</div>
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_SETTINGS', payload: { useSharedProvider: false } })}
                  className={`rounded-2xl border p-4 text-left ${!settings.useSharedProvider ? 'border-white/20 bg-white/8' : 'border-white/8 bg-black/15'}`}
                >
                  <div className="text-sm text-white mb-1">{t(locale, 'personalProvider')}</div>
                  <div className="text-xs text-white/45">Bring your own compatible endpoint and API key.</div>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-white/5 p-5 space-y-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40">
              <Globe2 className="w-4 h-4" />
              {t(locale, 'locale')}
            </div>
            <div className="flex gap-2">
              <button onClick={() => dispatch({ type: 'SET_LOCALE', payload: 'zh' })} className={`rounded-full px-4 py-2 text-sm ${locale === 'zh' ? 'bg-white text-black' : 'bg-black/20 text-white/60'}`}>中文</button>
              <button onClick={() => dispatch({ type: 'SET_LOCALE', payload: 'en' })} className={`rounded-full px-4 py-2 text-sm ${locale === 'en' ? 'bg-white text-black' : 'bg-black/20 text-white/60'}`}>EN</button>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/40 mb-2">
                <ImagePlus className="w-4 h-4" />
                {t(locale, 'referenceImageGeneration')}
              </div>
              <p className="text-sm text-white/58 leading-6">
                {runtimeConfig.imageReferenceHint || t(locale, 'referenceImageHint')}
              </p>
            </div>

            <div className="space-y-3 pt-3">
              <label className="block text-[11px] uppercase tracking-[0.28em] text-white/40">{t(locale, 'endpoint')}</label>
              <input name="endpoint" type="text" value={settings.endpoint} onChange={handleFieldChange} placeholder="https://api.openai.com/v1" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-fuchsia-300/30" />
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] uppercase tracking-[0.28em] text-white/40">{t(locale, 'apiKey')}</label>
              <input name="apiKey" type="password" value={settings.apiKey} onChange={handleFieldChange} placeholder="sk-..." className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-fuchsia-300/30" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-[11px] uppercase tracking-[0.28em] text-white/40">{t(locale, 'chatModel')}</label>
                <input name="chatModel" type="text" value={settings.chatModel} onChange={handleFieldChange} placeholder="gpt-4o-mini" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-fuchsia-300/30" />
              </div>
              <div className="space-y-3">
                <label className="block text-[11px] uppercase tracking-[0.28em] text-white/40">{t(locale, 'imageModel')}</label>
                <input name="imageModel" type="text" value={settings.imageModel} onChange={handleFieldChange} placeholder="gpt-image-1" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-fuchsia-300/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 px-6 py-5 bg-black/15 flex justify-end">
          <button onClick={onClose} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90">
            {t(locale, 'done')}
          </button>
        </div>
      </div>
    </div>
  );
}
