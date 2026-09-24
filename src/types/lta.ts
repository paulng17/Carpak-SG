export interface LTACarParkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location?: string; // "1.29375 103.85718"
  AvailableLots: number;
  LotType: string; // "C" for Cars, "H" for Heavy, "Y" for Motorcycles
  Agency: string; // "LTA", "URA", "HDB"
  lat?: number;
  lng?: number;
}

export interface LTACarParkAvailabilityResponse {
  'odata.metadata'?: string;
  value: LTACarParkItem[];
  partial?: boolean;
}

export interface LTAHealthResponse {
  keyConfigured: boolean;
  ltaAnswered: boolean;
  upstreamStatus?: number | null;
  recordCount?: number;
  error?: string;
  message?: string;
}
