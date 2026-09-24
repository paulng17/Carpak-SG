import React, { useEffect } from 'react';

export type ViewMode = 'desktop' | 'mobile';
export type MobileFrameMode = 'frame' | 'fluid';

interface DeviceViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  mobileFrameMode: MobileFrameMode;
  onMobileFrameModeChange: (mode: MobileFrameMode) => void;
  onToast: (msg: string) => void;
}

export const DeviceViewSwitcher: React.FC<DeviceViewSwitcherProps> = ({
  viewMode,
  onViewModeChange,
  mobileFrameMode,
  onMobileFrameModeChange,
  onToast,
}) => {
  // Global keyboard shortcuts (D = Desktop, M = Mobile) when not typing in inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        if (viewMode !== 'desktop') {
          onViewModeChange('desktop');
          onToast('Switched to Desktop Dashboard view (Press M for mobile)');
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (viewMode !== 'mobile') {
          onViewModeChange('mobile');
          onToast('Switched to Mobile App view (Press D for desktop)');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, onViewModeChange, onToast]);

  return (
    <>
      {/* TOP BAR VIEW SWITCHER */}
      <header className="w-full bg-[#0b1c30] text-white py-2 px-3 sm:px-6 shadow-md border-b border-white/10 z-50 sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Brand info & Active Mode Status */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e599] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00e599]"></span>
            </span>
            <div className="flex items-center gap-2 font-medium">
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>ParkSG</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#00e599]/20 text-[#00e599] font-bold">
                  Live
                </span>
              </span>
              <span className="text-white/30 hidden md:inline">|</span>
              <span className="text-white/80 hidden md:inline text-[11px]">
                Platform Mode:
                <strong className="text-white ml-1 font-semibold">
                  {viewMode === 'desktop' ? '💻 Desktop Dashboard (Widescreen)' : '📱 Mobile App View (iOS / Android)'}
                </strong>
              </span>
            </div>
          </div>

          {/* Center / Right: Primary Segmented Switch Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile frame sub-toggle if mobile mode is selected */}
            {viewMode === 'mobile' && (
              <div className="hidden sm:flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/15 text-[11px]">
                <button
                  type="button"
                  onClick={() => onMobileFrameModeChange('frame')}
                  className={`px-2 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                    mobileFrameMode === 'frame'
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  title="View inside simulated smartphone frame"
                >
                  <span className="material-symbols-outlined text-[14px]">phone_iphone</span>
                  <span>Frame</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMobileFrameModeChange('fluid')}
                  className={`px-2 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                    mobileFrameMode === 'fluid'
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  title="View full width / fluid layout"
                >
                  <span className="material-symbols-outlined text-[14px]">width_full</span>
                  <span>Full Width</span>
                </button>
              </div>
            )}

            {/* Desktop / Mobile Main Toggle */}
            <div className="inline-flex items-center bg-[#152942] p-1 rounded-xl border border-white/15 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  onViewModeChange('desktop');
                  onToast('Switched to Desktop Dashboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'desktop'
                    ? 'bg-[#00b87a] text-white shadow-md shadow-[#00b87a]/25 ring-1 ring-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={viewMode === 'desktop'}
              >
                <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
                <span>Desktop</span>
                <span className="hidden lg:inline text-[9px] px-1 py-0.2 rounded bg-black/25 font-mono text-white/80">
                  D
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onViewModeChange('mobile');
                  onToast('Switched to Mobile App');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'mobile'
                    ? 'bg-[#00b87a] text-white shadow-md shadow-[#00b87a]/25 ring-1 ring-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={viewMode === 'mobile'}
              >
                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                <span>Mobile</span>
                <span className="hidden lg:inline text-[9px] px-1 py-0.2 rounded bg-black/25 font-mono text-white/80">
                  M
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* FLOATING QUICK-TOGGLE PILL (Docked at bottom-right for instant switching) */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden select-none">
        <div className="bg-[#0b1c30]/90 hover:bg-[#0b1c30] backdrop-blur-md text-white p-1 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-1 transition-all duration-200">
          <span className="text-[10px] text-white/60 font-semibold px-2 hidden sm:inline uppercase tracking-wider">
            View:
          </span>
          <button
            type="button"
            onClick={() => {
              const nextMode = viewMode === 'desktop' ? 'mobile' : 'desktop';
              onViewModeChange(nextMode);
              onToast(`Switched to ${nextMode === 'desktop' ? 'Desktop Dashboard' : 'Mobile App'}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00b87a] to-[#008f5d] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
            title={`Currently in ${viewMode} mode. Click to switch to ${
              viewMode === 'desktop' ? 'Mobile' : 'Desktop'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {viewMode === 'desktop' ? 'smartphone' : 'desktop_windows'}
            </span>
            <span>
              {viewMode === 'desktop' ? 'Switch to Mobile' : 'Switch to Desktop'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
