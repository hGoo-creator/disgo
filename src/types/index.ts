export type PlaceCategory = '식당' | '카페' | '명소' | '간식';

export type RegionType = '국내' | '해외';

export type TransportType = '도보' | '대중교통' | '차량';

export interface MyPlace {
  id: string;
  place_name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  stay_time: number; // 분 단위
  cost: number; // 예상 비용 (원 또는 해당통화)
  dayNumber?: number; // 일자(Day) 할당
  isShared?: boolean; // 공유받은 장소인지 여부
  order?: number; // 순서 보정용
}

export interface Accommodation {
  id: string;
  hotel_name: string;
  latitude: number;
  longitude: number;
  check_in: string; // "15:00"
  check_out: string; // "11:00"
}

export interface TripSettings {
  region_type: RegionType; // '국내' | '해외'
  transport: TransportType; // '도보' | '대중교통' | '차량'
}

export interface TimelineItem {
  id: string;
  type: 'place' | 'accommodation' | 'transit_warning';
  time: string; // "09:00"
  title: string;
  category?: PlaceCategory | '숙소';
  stay_time?: number;
  cost?: number;
  lat?: number;
  lng?: number;
  stepNumber?: number;
  distanceKm?: number;
  warningText?: string;
  transitMode?: TransportType;
  dayNumber?: number; // Day 1, Day 2...
  isShared?: boolean;
}

export interface MultiDayTimelineResult {
  totalDays: number;
  suggestedDurationText: string;
  dayTimelines: Record<number, TimelineItem[]>;
}
