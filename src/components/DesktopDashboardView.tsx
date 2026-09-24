import React, { useState } from 'react';
import { Carpark, USER_VEHICLE } from '../data/carparks';
import { MapCanvas } from './MapCanvas';
import { TripPlannerTab } from './TripPlannerTab';
import { EvHubTab } from './EvHubTab';
import { PassesTab } from './PassesTab';

interface Props {
  carparks: Carpark[];
  selectedCarpark: Carpark;
  onSelectCarpark: (carpark: Carpark) => void;
  onStartGps: (carpark: Carpark) => void;
  onOpenReserve: (carpark: Carpark) => void;
  onOpenTopUp: () => void;
  obuBalance: number;
  bookmarkedCarparkIds: string[];
  onToggleBookmark: (carparkId: string) => void;
  onSwitchToMobile: () => void;
}

export const DesktopDashboardView: React.FC<Props> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  onStartGps,
  onOpenReserve,
  onOpenTopUp,
  obuBalance,
  bookmarkedCarparkIds,
  onToggleBookmark,
  onSwitchToMobile,
}) => {
  const [navTab, setNavTab] = useState<'map' | 'planner' | 'ev' | 'passes'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ev' | 'price' | 'grace' | 'clearance'>('all');
  const [showTraffic, setShowTraffic] = useState(true);
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite' | 'density'>('standard');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [calcHours, setCalcHours] = useState(2);

  const filteredCarparks = carparks.filter((cp) => {
    if (searchQuery && !cp.name.toLowerCase().includes(searchQuery.toLowerCase()) && !cp.area.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeFilter === 'ev' && cp.evSummary.freeCount === 0) return false;
    if (activeFilter === 'price' && cp.ratePerFirstHour >= 3.0) return false;
    if (activeFilter === 'grace' && cp.gracePeriodMinutes < 10) return false;
    if (activeFilter === 'clearance' && cp.maxClearance < 2.0) return false;
    return true;
  });

  const isBookmarked = bookmarkedCarparkIds.includes(selectedCarpark.id);
  const calculatedFee = (
    selectedCarpark.ratePerFirstHour +
    Math.max(0, (calcHours - 1) * 2 * selectedCarpark.rateSubsequent)
  ).toFixed(2);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      {/* 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-[#e5eeff] px-6 flex items-center justify-between shadow-sm">
        {/* Zone 1: Single text element brand mark with logo */}
        <div className="flex items-center gap-3">
          <img
            alt="ParkSG Brand Logo"
            className="h-9 w-auto object-contain flex-shrink-0"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VbNxf9PLobrPGRxb0T2Z_vTpRPdVgAsvI_BE8_SrTvAFIcUYt16w7YrBLc6pe-G8k1vKhvc4uRih7SvDFky3GprIt21fnZZmhzwatk00u2UaFVokgxyM4tsZ4uS5IFfNHqc9jEDN5YX_GQML-1I_Kx86MJ3WQfPgj7s2x3N7RvukZQEWFENL87NxV3SjuPqWcKL2E_t4ZKEzONrZlf-j5GIDEhM-vDk6BnSGvtpFD_a8NIHYJ1ZoqZP2-I"
          />
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#0b1c30] tracking-tight">ParkSG</span>
            <span className="text-xs font-semibold text-[#006c46] bg-[#00b87a]/15 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
              LTA & URA Live Feeds
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Clean text with active indicator) */}
        <nav className="flex items-center gap-6">
          <button
            onClick={() => setNavTab('map')}
            className={`text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              navTab === 'map'
                ? 'text-[#006c46] border-[#00b87a]'
                : 'text-[#3c4a41] border-transparent hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">local_parking</span>
            Live Map & Rates
          </button>
          <button
            onClick={() => setNavTab('planner')}
            className={`text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              navTab === 'planner'
                ? 'text-[#006c46] border-[#00b87a]'
                : 'text-[#3c4a41] border-transparent hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">alt_route</span>
            Trip Planner
          </button>
          <button
            onClick={() => setNavTab('ev')}
            className={`text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              navTab === 'ev'
                ? 'text-[#006c46] border-[#00b87a]'
                : 'text-[#3c4a41] border-transparent hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">ev_station</span>
            EV Fast Charging Grid
          </button>
          <button
            onClick={() => setNavTab('passes')}
            className={`text-sm font-semibold transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
              navTab === 'passes'
                ? 'text-[#006c46] border-[#00b87a]'
                : 'text-[#3c4a41] border-transparent hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            Season Passes & OBU
          </button>
        </nav>

        {/* Zone 3: Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* Switch to Mobile Version Button */}
          <button
            onClick={onSwitchToMobile}
            title="Switch to Mobile App View (Press M)"
            aria-label="Switch to Mobile App View"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#00b87a]/40 bg-[#00b87a]/10 hover:bg-[#00b87a]/20 text-[#006c46] text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#006c46]">smartphone</span>
            <span>Mobile App View</span>
            <span className="hidden xl:inline text-[9px] px-1 py-0.2 rounded bg-[#006c46]/10 font-mono text-[#006c46]">M</span>
          </button>

          {/* Vehicle Telemetry Chip */}
          <div className="hidden lg:flex items-center gap-2 bg-[#eff4ff] px-3 py-1 rounded-xl border border-[#bbcabf]/30">
            <div className="w-2 h-2 rounded-full bg-[#00b87a] animate-pulse" />
            <span className="font-mono text-xs font-bold text-[#0b1c30]">{USER_VEHICLE.plateNumber}</span>
            <span className="text-[11px] text-[#6c7a70] font-mono">OBU: ${obuBalance.toFixed(2)}</span>
          </div>

          {/* Profile Avatar */}
          <button
            onClick={() => setNavTab('passes')}
            className="w-9 h-9 rounded-full ring-2 ring-[#00b87a]/40 overflow-hidden hover:opacity-90 transition-opacity"
            title="Vehicle Profile"
          >
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VFmD2SuqZU_DSwx9ZqMHYVjfyBG7xZPOktu-9kGOIIBP3ruq0JqW7xjKPRiMdb9cN0ZlwO7Q5KczHHyqJmFcCtC8jB463iS5AriJeWrS7wSoNEvD3m0deQAxJ7_4FXUeOeMd4dgQqR1mA7j2VK2J5xi5en4Fv_aXSLjUd0sTQUwH7MIt2Ovz4Fe4yvoyKJECumBoM1gkNO4RRc01OO7sPsd3oS99EBOA_V_jsQ73v-7rL0xhT6QBBbDC2o"
            />
          </button>
        </div>
      </header>

      {/* BODY CONTENT */}
      {navTab === 'map' && (
        <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
          {/* LEFT SIDEBAR: Carpark List & Live Directory (380px) */}
          <aside className="w-96 flex-shrink-0 bg-white border-r border-[#e5eeff] flex flex-col h-full z-10 shadow-sm">
            {/* Search and Filters Header */}
            <div className="p-4 border-b border-[#e5eeff] flex flex-col gap-2.5">
              <div className="relative">
                <span className="material-symbols-outlined text-[#006398] text-[20px] absolute left-3 top-2.5">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search carparks, buildings, CBD..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#bbcabf]/40 rounded-xl pl-9 pr-3 py-2 text-xs text-[#0b1c30] placeholder:text-[#6c7a70] focus:outline-none focus:border-[#006398]"
                />
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setActiveFilter(activeFilter === 'all' ? 'all' : 'all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'all'
                      ? 'bg-[#006c46] text-white'
                      : 'bg-[#eff4ff] text-[#3c4a41] hover:bg-[#e5eeff]'
                  }`}
                >
                  All ({carparks.length})
                </button>
                <button
                  onClick={() => setActiveFilter(activeFilter === 'ev' ? 'all' : 'ev')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
                    activeFilter === 'ev'
                      ? 'bg-[#00b87a] text-white font-bold'
                      : 'bg-[#eff4ff] text-[#3c4a41] hover:bg-[#e5eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  EV Ready
                </button>
                <button
                  onClick={() => setActiveFilter(activeFilter === 'price' ? 'all' : 'price')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'price'
                      ? 'bg-[#006398] text-white'
                      : 'bg-[#eff4ff] text-[#3c4a41] hover:bg-[#e5eeff]'
                  }`}
                >
                  &lt; $3/hr
                </button>
                <button
                  onClick={() => setActiveFilter(activeFilter === 'clearance' ? 'all' : 'clearance')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeFilter === 'clearance'
                      ? 'bg-[#006c46] text-white'
                      : 'bg-[#eff4ff] text-[#3c4a41] hover:bg-[#e5eeff]'
                  }`}
                >
                  &gt; 2.0m SUV
                </button>
              </div>
            </div>

            {/* Carpark Items Scroll List */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              {filteredCarparks.map((cp) => {
                const isSelected = cp.id === selectedCarpark.id;
                const occupancyPct = Math.round(((cp.totalLots - cp.availableLots) / cp.totalLots) * 100);

                return (
                  <div
                    key={cp.id}
                    onClick={() => onSelectCarpark(cp)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#eff4ff] border-[#00b87a] ring-2 ring-[#00b87a]/30 shadow-md'
                        : 'bg-white border-[#bbcabf]/30 hover:border-[#006398] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6c7a70] block">
                          {cp.area}
                        </span>
                        <h4 className="font-bold text-sm text-[#0b1c30] truncate">{cp.name}</h4>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-mono text-base font-bold text-[#006c46]">
                          ${cp.ratePerFirstHour.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#6c7a70] block font-mono">/ 1st hr</span>
                      </div>
                    </div>

                    {/* Occupancy Bar */}
                    <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
                      <span className="text-[#3c4a41]">
                        <strong className="text-[#006c46]">{cp.availableLots}</strong> lots vacant
                      </span>
                      <span className="text-[11px] text-[#6c7a70]">{occupancyPct}% full</span>
                    </div>
                    <div className="w-full bg-[#e5eeff] rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          occupancyPct > 90
                            ? 'bg-[#ba1a1a]'
                            : occupancyPct > 70
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#00b87a]'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>

                    {/* Meta row */}
                    <div className="mt-2.5 pt-2 border-t border-[#e5eeff] flex items-center justify-between text-[11px] text-[#3c4a41]">
                      <span className="flex items-center gap-1 font-mono">
                        <span className="material-symbols-outlined text-[#006398] text-[14px]">bolt</span>
                        {cp.evSummary.freeCount} EV Slots
                      </span>
                      <span className="font-mono text-[#6c7a70]">
                        {cp.distanceKm} km · {cp.etaMin} min
                      </span>
                      <span className="font-mono font-semibold text-[#006398]">
                        ERP ${cp.erpGantry.rate.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* CENTER: Expansive Vector Map Canvas */}
          <div className="flex-1 relative h-full bg-[#eff4ff]">
            <MapCanvas
              carparks={filteredCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={onSelectCarpark}
              evOnlyFilter={activeFilter === 'ev'}
              onToggleEvFilter={() => setActiveFilter((prev) => (prev === 'ev' ? 'all' : 'ev'))}
              showTraffic={showTraffic}
              onToggleTraffic={() => setShowTraffic(!showTraffic)}
              mapLayer={mapLayer}
              onChangeLayer={() =>
                setMapLayer((prev) =>
                  prev === 'standard' ? 'satellite' : prev === 'satellite' ? 'density' : 'standard'
                )
              }
              onRecenter={() => {
                setZoomLevel(1);
                onSelectCarpark(carparks[0]);
              }}
              zoomLevel={zoomLevel}
              onZoomIn={() => setZoomLevel((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
              onZoomOut={() => setZoomLevel((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
            />

            {/* Quick Status Legend Banner on Top Center of Map */}
            <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md border border-[#bbcabf]/30 rounded-xl px-4 py-2 shadow-md flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00b87a]" />
                <span>Available Lots (&gt;50)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span>Filling Fast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
                <span>Almost Full (&lt;10)</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Carpark Inspector & Rate Calculator (420px) */}
          <aside className="w-[420px] flex-shrink-0 bg-white border-l border-[#e5eeff] flex flex-col h-full overflow-y-auto p-5 gap-4 z-10 shadow-sm">
            {/* Header with verified badges */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#006c46]/10 text-[#006c46] font-mono text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[13px] material-symbols-fill">
                    verified
                  </span>
                  LTA Sensor Verified
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73] font-mono text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  {selectedCarpark.evSummary.speedBadge}
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#0b1c30] mt-1.5">{selectedCarpark.name}</h2>
              <p className="text-xs text-[#3c4a41] flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[16px] text-[#6c7a70]">location_on</span>
                {selectedCarpark.address}
              </p>
            </div>

            {/* 3 Metrics Matrix */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#eff4ff] rounded-xl p-3 border border-[#bbcabf]/20">
                <span className="font-mono text-[10px] text-[#6c7a70] uppercase block">Available Lots</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-2xl font-bold text-[#006c46]">
                    {selectedCarpark.availableLots}
                  </span>
                  <span className="font-mono text-xs text-[#6c7a70]">/ {selectedCarpark.totalLots}</span>
                </div>
                <span className="font-mono text-[10px] text-[#006c46] font-semibold mt-1 block">
                  ● Optimal Capacity
                </span>
              </div>

              <div className="bg-[#eff4ff] rounded-xl p-3 border border-[#bbcabf]/20">
                <span className="font-mono text-[10px] text-[#6c7a70] uppercase block">Max Clearance</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-2xl font-bold text-[#0b1c30]">
                    {selectedCarpark.maxClearance.toFixed(2)}
                  </span>
                  <span className="font-mono text-xs text-[#3c4a41]">m</span>
                </div>
                <span className="font-mono text-[10px] text-[#3c4a41] mt-1 block truncate">
                  {selectedCarpark.clearanceNote}
                </span>
              </div>

              <div className="bg-[#eff4ff] rounded-xl p-3 border border-[#bbcabf]/20">
                <span className="font-mono text-[10px] text-[#6c7a70] uppercase block">ERP Gantry</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-2xl font-bold text-[#006398]">
                    ${selectedCarpark.erpGantry.rate.toFixed(2)}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#006398] font-medium mt-1 block truncate">
                  Active till {selectedCarpark.erpGantry.activeTill}
                </span>
              </div>
            </div>

            {/* EV Charging Status Card */}
            <div className="bg-[#e5eeff] rounded-2xl p-4 flex flex-col gap-2.5 border border-[#bbcabf]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#00b87a] text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">ev_station</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0b1c30] leading-tight">
                      {selectedCarpark.evSummary.operator}
                    </h4>
                    <p className="text-xs text-[#3c4a41]">{selectedCarpark.evSummary.locationDetail}</p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenReserve(selectedCarpark)}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f8f9ff] text-[#006c46] font-mono text-xs font-bold shadow-sm transition-transform active:scale-95 border border-[#00b87a]/30"
                >
                  Reserve Plug
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#bbcabf]/20 text-xs">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#00b87a]" />
                  <span className="font-bold text-[#0b1c30]">
                    {selectedCarpark.evSummary.freeCount} / {selectedCarpark.evSummary.totalCount} Chargers Free
                  </span>
                  <span className="text-[#6c7a70]">{selectedCarpark.evSummary.powerDesc}</span>
                </div>
                <span className="font-mono font-semibold text-[#0b1c30]">
                  ${selectedCarpark.evSummary.tariffKwh.toFixed(2)}/kWh
                </span>
              </div>
            </div>

            {/* Dynamic Tariff Schedule & Calculator */}
            <div className="bg-[#eff4ff] rounded-2xl p-4 border border-[#bbcabf]/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0b1c30]">
                  Weekday Tariff (07:00 - {selectedCarpark.eveningStartTime})
                </span>
                <span className="font-mono text-[10px] font-bold text-[#006c46] bg-[#00b87a]/15 px-2.5 py-0.5 rounded-full">
                  {selectedCarpark.gracePeriodMinutes}m Grace Period
                </span>
              </div>

              <p className="text-xs text-[#0b1c30]">
                <strong className="font-bold">${selectedCarpark.ratePerFirstHour.toFixed(2)}</strong> for 1st
                hour ·{' '}
                <strong className="font-bold">${selectedCarpark.rateSubsequent.toFixed(2)}</strong> per
                subsequent {selectedCarpark.subsequentIntervalMin} mins.
              </p>

              {/* Interactive Duration Slider */}
              <div className="pt-2 border-t border-[#bbcabf]/30 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#3c4a41]">Simulate Duration:</span>
                  <span className="font-mono font-bold text-sm text-[#006c46]">{calcHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={calcHours}
                  onChange={(e) => setCalcHours(Number(e.target.value))}
                  className="w-full accent-[#00b87a] cursor-pointer"
                />
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#e5eeff] text-xs font-mono">
                  <span>Projected Parking Fee:</span>
                  <span className="font-bold text-base text-[#006c46]">${calculatedFee}</span>
                </div>
              </div>
            </div>

            {/* Historical Occupancy Bar Graph Today */}
            <div className="bg-white rounded-2xl p-4 border border-[#bbcabf]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0b1c30]">Today's Occupancy Pattern</span>
                <span className="text-[10px] font-mono text-[#6c7a70]">Peak: 12:00 – 14:00</span>
              </div>
              <div className="flex items-end justify-between h-24 pt-2 gap-1">
                {selectedCarpark.historicalOccupancyToday.map((item) => (
                  <div key={item.time} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-[#eff4ff] rounded-t-sm h-full flex items-end">
                      <div
                        className={`w-full rounded-t-sm ${
                          item.pct > 80 ? 'bg-[#ba1a1a]' : item.pct > 60 ? 'bg-[#f59e0b]' : 'bg-[#00b87a]'
                        }`}
                        style={{ height: `${item.pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-[#6c7a70]">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onToggleBookmark(selectedCarpark.id)}
                className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all ${
                  isBookmarked
                    ? 'bg-[#00b87a] text-white border-[#00b87a]'
                    : 'bg-[#eff4ff] text-[#0b1c30] border-[#bbcabf]/40 hover:bg-[#e5eeff]'
                }`}
                title={isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
              >
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    isBookmarked ? 'material-symbols-fill' : ''
                  }`}
                >
                  bookmark
                </span>
              </button>

              <button
                onClick={() => onStartGps(selectedCarpark)}
                className="flex-1 h-12 px-4 rounded-xl bg-[#00b87a] hover:bg-[#006c46] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">navigation</span>
                Start Turn-By-Turn GPS
              </button>
            </div>
          </aside>
        </div>
      )}

      {navTab === 'planner' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          <TripPlannerTab
            carparks={carparks}
            onSelectCarpark={(cp) => {
              onSelectCarpark(cp);
              setNavTab('map');
            }}
            onStartGps={onStartGps}
          />
        </div>
      )}

      {navTab === 'ev' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          <EvHubTab
            carparks={carparks}
            onOpenReserve={onOpenReserve}
            onStartGps={onStartGps}
          />
        </div>
      )}

      {navTab === 'passes' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          <PassesTab obuBalance={obuBalance} onOpenTopUp={onOpenTopUp} />
        </div>
      )}
    </div>
  );
};
