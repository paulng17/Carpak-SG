import { LTACarParkAvailabilityResponse, LTACarParkItem, LTAHealthResponse } from '../types/lta';
import { Carpark, CARPARKS } from '../data/carparks';

/**
 * Verified baseline LTA DataMall CarParkAvailability sample payload
 */
export const INITIAL_LTA_DATA: LTACarParkAvailabilityResponse = {
  "odata.metadata": "http://datamall2.mytransport.sg/ltaodataservice/$metadata#CarParkAvailability",
  "value": [
    {
      "CarParkID": "1",
      "Area": "Marina",
      "Development": "Suntec City",
      "Location": "1.29375 103.85718",
      "AvailableLots": 1104,
      "LotType": "C",
      "Agency": "LTA"
    },
    {
      "CarParkID": "2",
      "Area": "Marina",
      "Development": "Marina Square",
      "Location": "1.29115 103.85728",
      "AvailableLots": 1091,
      "LotType": "C",
      "Agency": "LTA"
    },
    {
      "CarParkID": "3",
      "Area": "Marina",
      "Development": "Raffles City",
      "Location": "1.29382 103.85319",
      "AvailableLots": 453,
      "LotType": "C",
      "Agency": "LTA"
    },
    {
      "CarParkID": "4",
      "Area": "Marina",
      "Development": "The Esplanade",
      "Location": "1.29011 103.85561",
      "AvailableLots": 448,
      "LotType": "C",
      "Agency": "LTA"
    },
    {
      "CarParkID": "5",
      "Area": "Marina",
      "Development": "Millenia Singapore",
      "Location": "1.29251 103.86009",
      "AvailableLots": 532,
      "LotType": "C",
      "Agency": "LTA"
    }
  ]
};

/**
 * Determines status strictly from lot count:
 * 0 to 10: almost-full
 * 11 to 50: moderate
 * above 50: optimal
 */
export function getStatusFromLotCount(lots: number): 'optimal' | 'moderate' | 'almost-full' {
  if (lots <= 10) return 'almost-full';
  if (lots <= 50) return 'moderate';
  return 'optimal';
}

/**
 * Parses LTA "lat lng" string into numbers
 */
export function parseLtaLocation(locationStr?: string): { lat: number; lng: number } | null {
  if (!locationStr) return null;
  const parts = locationStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Projects Singapore Marina/CBD Latitude & Longitude to SVG viewBox (0 0 420 780)
 */
export function projectCoordinatesToSvg(lat: number, lng: number): { x: number; y: number } {
  const minLat = 1.2800;
  const maxLat = 1.3000;
  const minLng = 103.8480;
  const maxLng = 103.8680;

  const clampLat = Math.min(Math.max(lat, minLat), maxLat);
  const clampLng = Math.min(Math.max(lng, minLng), maxLng);

  const normX = (clampLng - minLng) / (maxLng - minLng);
  const normY = (maxLat - clampLat) / (maxLat - minLat);

  const x = Math.round(normX * 360 + 30);
  const y = Math.round(normY * 640 + 60);

  return { x, y };
}

/**
 * Merges LTA DataMall items with application carpark models.
 * Applies LotType 'C' only for the screen.
 * Derives status from AvailableLots count alone (0-10 almost-full, 11-50 moderate, >50 optimal).
 * Flags unmonitored carparks with hasLiveLots = false.
 */
export function mapLtaToCarparks(
  ltaResponse: LTACarParkAvailabilityResponse,
  baseCarparks: Carpark[] = CARPARKS,
  updatedTimeStr?: string
): Carpark[] {
  const allItems = ltaResponse?.value || [];
  // Screen shows LotType C only
  const carItems = allItems.filter(
    (item) => !item.LotType || item.LotType.toUpperCase() === 'C'
  );

  const updatedCarparks: Carpark[] = baseCarparks.map((cp) => {
    // Look for matching item in LTA carItems
    const matchedItem = carItems.find((item) => {
      if (cp.ltaCarParkId && String(item.CarParkID).trim() === String(cp.ltaCarParkId).trim()) {
        return true;
      }
      const itemDev = (item.Development || '').toLowerCase().trim();
      const cpName = cp.name.toLowerCase();
      const cpShort = cp.shortName.toLowerCase();
      if (itemDev && (cpName.includes(itemDev) || cpShort.includes(itemDev) || itemDev.includes(cpShort))) {
        return true;
      }
      if (cp.id === item.CarParkID || cp.id === `lta-${item.CarParkID}`) {
        return true;
      }
      return false;
    });

    if (matchedItem && Number.isFinite(matchedItem.AvailableLots)) {
      const liveLots = Math.round(matchedItem.AvailableLots);
      return {
        ...cp,
        availableLots: liveLots,
        hasLiveLots: true,
        status: getStatusFromLotCount(liveLots),
        ltaVerified: true,
        lastUpdatedTime: updatedTimeStr || cp.lastUpdatedTime,
        area: matchedItem.Area ? `${matchedItem.Area} District` : cp.area,
      };
    }

    // Carpark is not in LTA's list
    return {
      ...cp,
      hasLiveLots: false,
      lastUpdatedTime: updatedTimeStr || cp.lastUpdatedTime,
    };
  });

  // Also include any prominent Marina area LTA carparks from feed not in base list
  carItems.forEach((ltaItem) => {
    const itemDev = (ltaItem.Development || '').toLowerCase().trim();
    const alreadyExists = updatedCarparks.some(
      (cp) =>
        (cp.ltaCarParkId && cp.ltaCarParkId === ltaItem.CarParkID) ||
        cp.name.toLowerCase().includes(itemDev) ||
        cp.shortName.toLowerCase().includes(itemDev) ||
        itemDev.includes(cp.shortName.toLowerCase())
    );

    if (!alreadyExists && (ltaItem.Area?.toLowerCase().includes('marina') || ['3', '4', '5'].includes(ltaItem.CarParkID))) {
      let coords = null;
      if (ltaItem.lat !== undefined && ltaItem.lng !== undefined) {
        coords = { lat: ltaItem.lat, lng: ltaItem.lng };
      } else if (ltaItem.Location) {
        coords = parseLtaLocation(ltaItem.Location);
      }
      const svgPos = coords ? projectCoordinatesToSvg(coords.lat, coords.lng) : { x: 180, y: 300 };
      const liveLots = Math.round(ltaItem.AvailableLots);

      const newId = `lta-${ltaItem.CarParkID}-${itemDev.replace(/[^a-z0-9]/g, '-')}`;
      const newCarpark: Carpark = {
        id: newId,
        name: ltaItem.Development,
        shortName: ltaItem.Development,
        address: `${ltaItem.Development}, ${ltaItem.Area || 'Marina'} Bay, Singapore`,
        area: `${ltaItem.Area || 'Marina'} District`,
        pinPosition: { x: (svgPos.x / 420) * 100, y: (svgPos.y / 780) * 100 },
        availableLots: liveLots,
        totalLots: liveLots + 50,
        ratePerFirstHour: 2.6,
        rateSubsequent: 1.3,
        subsequentIntervalMin: 30,
        eveningFlatRate: 3.8,
        eveningStartTime: '18:00',
        gracePeriodMinutes: 10,
        maxClearance: 2.05,
        clearanceNote: 'Standard Urban Clearance',
        erpGantry: {
          name: 'Marina Gateway',
          rate: 2.0,
          activeTill: '18:30',
          status: 'active',
        },
        distanceKm: 1.4,
        etaMin: 5,
        status: getStatusFromLotCount(liveLots),
        ltaVerified: true,
        hasLiveLots: true,
        ltaCarParkId: ltaItem.CarParkID,
        lastUpdatedTime: updatedTimeStr,
        evSummary: {
          operator: 'SP Mobility Grid',
          locationDetail: 'Basement Level, Near Lift Lobby',
          freeCount: Math.min(6, Math.max(2, Math.round(liveLots * 0.01))),
          totalCount: 6,
          powerDesc: '(2x 60kW DC, 4x 22kW AC)',
          speedBadge: '60kW DC Fast',
          tariffKwh: 0.59,
          hasFastCharging: true,
        },
        evBays: [
          { id: `${ltaItem.CarParkID}-01`, connector: 'CCS2 DC', type: 'DC Fast', powerKw: 60, status: 'available', tariffKwh: 0.59 },
          { id: `${ltaItem.CarParkID}-02`, connector: 'CCS2 DC', type: 'DC Fast', powerKw: 60, status: 'available', tariffKwh: 0.59 },
        ],
        shelteredWalk: 'Direct underpass to MRT',
        seasonPassAccepted: true,
        description: `Live LTA DataMall carpark at ${ltaItem.Development}.`,
        operatingHours: '24 Hours Daily',
        historicalOccupancyToday: [
          { time: '08:00', pct: 28 },
          { time: '10:00', pct: 45 },
          { time: '12:00', pct: 72 },
          { time: '14:00', pct: 68 },
          { time: '16:00', pct: 54 },
          { time: '18:00', pct: 65 },
          { time: '20:00', pct: 40 },
        ],
      };
      updatedCarparks.push(newCarpark);
    }
  });

  return updatedCarparks;
}

/**
 * Fetch live data from internal /api/carparks route (server-side proxy to LTA DataMall).
 * Browser code never directly calls datamall2.mytransport.sg.
 */
export async function fetchLtaDataMall(carParkId?: string): Promise<{
  success: boolean;
  data: LTACarParkAvailabilityResponse;
  timestamp: string;
  updatedTimeHHMM: string;
  source: 'api' | 'cached' | 'error';
  error?: string;
}> {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const updatedTimeHHMM = now.toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  try {
    const url = carParkId ? `/api/carparks?CarParkID=${encodeURIComponent(carParkId)}` : '/api/carparks';
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const json = await res.json();
      const items: LTACarParkItem[] = Array.isArray(json) ? json : json?.value || [];
      return {
        success: true,
        data: {
          value: items,
          partial: json?.partial,
        },
        timestamp,
        updatedTimeHHMM,
        source: 'api',
      };
    } else {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        data: { value: [] },
        timestamp,
        updatedTimeHHMM,
        source: 'error',
        error: errJson?.error || `HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      data: { value: [] },
      timestamp,
      updatedTimeHHMM,
      source: 'error',
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Fetch service health status from /api/health
 */
export async function fetchLtaHealth(): Promise<LTAHealthResponse> {
  try {
    const res = await fetch('/api/health');
    const json = await res.json();
    return json as LTAHealthResponse;
  } catch (err) {
    return {
      keyConfigured: false,
      ltaAnswered: false,
      upstreamStatus: null,
      recordCount: 0,
      error: err instanceof Error ? err.message : 'Failed to reach /api/health',
    };
  }
}
