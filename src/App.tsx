import { useState, useEffect } from 'react';
import { CARPARKS, Carpark, USER_VEHICLE } from './data/carparks';
import { MobileAppView } from './components/MobileAppView';
import { DesktopDashboardView } from './components/DesktopDashboardView';
import { DeviceViewSwitcher, ViewMode, MobileFrameMode } from './components/DeviceViewSwitcher';
import { TurnByTurnGpsModal } from './components/TurnByTurnGpsModal';
import { ReservePlugModal } from './components/ReservePlugModal';
import { TopUpModal } from './components/TopUpModal';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parksg_view_mode') as ViewMode | null;
      if (saved === 'desktop' || saved === 'mobile') return saved;
      return window.innerWidth < 768 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });

  const [mobileFrameMode, setMobileFrameMode] = useState<MobileFrameMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parksg_mobile_frame_mode') as MobileFrameMode | null;
      if (saved === 'frame' || saved === 'fluid') return saved;
    }
    return 'frame';
  });

  const [carparks, setCarparks] = useState<Carpark[]>(CARPARKS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark>(CARPARKS[0]);
  const [activeGpsCarpark, setActiveGpsCarpark] = useState<Carpark | null>(null);
  const [reserveModalCarpark, setReserveModalCarpark] = useState<Carpark | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [obuBalance, setObuBalance] = useState(USER_VEHICLE.obuBalance);
  const [bookmarkedCarparkIds, setBookmarkedCarparkIds] = useState<string[]>(['suntec-city', 'marina-square']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parksg_view_mode', mode);
    }
  };

  const handleMobileFrameModeChange = (mode: MobileFrameMode) => {
    setMobileFrameMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parksg_mobile_frame_mode', mode);
    }
  };

  const handleToggleBookmark = (carparkId: string) => {
    setBookmarkedCarparkIds((prev) => {
      const exists = prev.includes(carparkId);
      if (exists) {
        showToast('Removed from saved carparks');
        return prev.filter((id) => id !== carparkId);
      } else {
        showToast('Saved to your favourite carparks ⭐');
        return [...prev, carparkId];
      }
    });
  };

  const handleReservedBay = (bayId: string) => {
    showToast(`EV Bay ${bayId} locked for 15 mins!`);
    // Update local bay state
    if (reserveModalCarpark) {
      setCarparks((prev) =>
        prev.map((cp) => {
          if (cp.id === reserveModalCarpark.id) {
            return {
              ...cp,
              evSummary: {
                ...cp.evSummary,
                freeCount: Math.max(0, cp.evSummary.freeCount - 1),
              },
              evBays: cp.evBays.map((bay) =>
                bay.id === bayId ? { ...bay, status: 'reserved' as const } : bay
              ),
            };
          }
          return cp;
        })
      );
    }
  };

  const handleTopUpSuccess = (amount: number) => {
    setObuBalance((prev) => prev + amount);
    showToast(`$${amount.toFixed(2)} added to OBU smart cashcard!`);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0b1c30] flex flex-col items-center relative selection:bg-[#00b87a]/20">
      {/* GLOBAL VIEWPORT SWITCHER TOP BAR & FLOATING QUICK SWITCH */}
      <DeviceViewSwitcher
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        mobileFrameMode={mobileFrameMode}
        onMobileFrameModeChange={handleMobileFrameModeChange}
        onToast={showToast}
      />

      {/* RENDER SELECTED VERSION */}
      {viewMode === 'mobile' ? (
        <div className={`w-full flex-1 flex justify-center items-start ${
          mobileFrameMode === 'frame' ? 'py-0 md:py-6 px-0 md:px-4' : 'py-0 px-0'
        }`}>
          {/* Mobile Device Frame Container for authentic app look */}
          <div
            className={`w-full ${
              mobileFrameMode === 'frame'
                ? 'max-w-[430px] bg-white shadow-2xl rounded-none md:rounded-[44px] overflow-hidden border-0 md:border-[10px] md:border-[#0b1c30] relative min-h-screen md:min-h-[880px] md:max-h-[900px] flex flex-col'
                : 'max-w-2xl bg-white shadow-md min-h-screen flex flex-col'
            }`}
            style={{ transform: 'translateZ(0)' }}
          >
            {/* Simulated iPhone Speaker / Dynamic Island on desktop framed view */}
            {mobileFrameMode === 'frame' && (
              <div className="hidden md:flex justify-center items-center h-6 bg-[#0b1c30] w-full pt-1 flex-shrink-0 z-50">
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-between px-3">
                  <span className="w-2 h-2 rounded-full bg-[#1b2a3d]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#142334] border border-white/20" />
                </div>
              </div>
            )}

            {/* Mobile App Component */}
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative">
              <MobileAppView
                carparks={carparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => setSelectedCarpark(cp)}
                onStartGps={(cp) => setActiveGpsCarpark(cp)}
                onOpenReserve={(cp) => setReserveModalCarpark(cp)}
                onOpenTopUp={() => setShowTopUpModal(true)}
                obuBalance={obuBalance}
                bookmarkedCarparkIds={bookmarkedCarparkIds}
                onToggleBookmark={handleToggleBookmark}
                onSwitchToDesktop={() => handleViewModeChange('desktop')}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Full-Width Webpage / Desktop Dashboard Version */
        <div className="w-full flex-1 flex flex-col">
          <DesktopDashboardView
            carparks={carparks}
            selectedCarpark={selectedCarpark}
            onSelectCarpark={(cp) => setSelectedCarpark(cp)}
            onStartGps={(cp) => setActiveGpsCarpark(cp)}
            onOpenReserve={(cp) => setReserveModalCarpark(cp)}
            onOpenTopUp={() => setShowTopUpModal(true)}
            obuBalance={obuBalance}
            bookmarkedCarparkIds={bookmarkedCarparkIds}
            onToggleBookmark={handleToggleBookmark}
            onSwitchToMobile={() => handleViewModeChange('mobile')}
          />
        </div>
      )}

      {/* MODALS */}
      {/* 1. Turn-by-Turn GPS Modal */}
      {activeGpsCarpark && (
        <TurnByTurnGpsModal
          carpark={activeGpsCarpark}
          onClose={() => setActiveGpsCarpark(null)}
        />
      )}

      {/* 2. EV Plug Reservation Modal */}
      {reserveModalCarpark && (
        <ReservePlugModal
          carpark={reserveModalCarpark}
          onClose={() => setReserveModalCarpark(null)}
          onReserved={handleReservedBay}
        />
      )}

      {/* 3. OBU CashCard Top-Up Modal */}
      {showTopUpModal && (
        <TopUpModal
          currentBalance={obuBalance}
          onClose={() => setShowTopUpModal(false)}
          onTopUp={handleTopUpSuccess}
        />
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0b1c30] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[#00e599] text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
