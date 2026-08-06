import { MyPlace, Accommodation, TripSettings, RegionType } from '../types';
import { SupabaseDB, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  MY_PLACES_DOMESTIC: 'leeriga_places_domestic',
  MY_PLACES_INTL: 'leeriga_places_intl',
  ACC_DOMESTIC: 'leeriga_acc_domestic',
  ACC_INTL: 'leeriga_acc_intl',
  TRIP_SETTINGS: 'leeriga_trip_settings',
};

// Seed Domestic (Jeju Island)
const SEED_ACC_DOMESTIC: Accommodation = {
  id: 'acc-dom-1',
  hotel_name: '신라호텔 제주',
  latitude: 33.2475,
  longitude: 126.4078,
  check_in: '15:00',
  check_out: '10:00',
};

const SEED_PLACES_DOMESTIC: MyPlace[] = [
  {
    id: 'place-dom-1',
    place_name: '은희네해장국 본점',
    category: '식당',
    latitude: 33.5065,
    longitude: 126.5401,
    stay_time: 50,
    cost: 12000,
  },
  {
    id: 'place-dom-2',
    place_name: '울트라 드립 카페',
    category: '카페',
    latitude: 33.4990,
    longitude: 126.5312,
    stay_time: 45,
    cost: 7000,
  },
  {
    id: 'place-dom-3',
    place_name: '함덕 해수욕장 & 오름',
    category: '명소',
    latitude: 33.5432,
    longitude: 126.6690,
    stay_time: 90,
    cost: 0,
  },
  {
    id: 'place-dom-4',
    place_name: '흑돼지 구이 명가',
    category: '식당',
    latitude: 33.5180,
    longitude: 126.5290,
    stay_time: 80,
    cost: 32000,
  },
  {
    id: 'place-dom-5',
    place_name: '동문시장 오메기떡',
    category: '간식',
    latitude: 33.5126,
    longitude: 126.5284,
    stay_time: 30,
    cost: 5000,
  },
];

// Seed International (Tokyo, Japan)
const SEED_ACC_INTL: Accommodation = {
  id: 'acc-intl-1',
  hotel_name: '하얏트 리젠시 도쿄 (신주쿠)',
  latitude: 35.6905,
  longitude: 139.6917,
  check_in: '15:00',
  check_out: '11:00',
};

const SEED_PLACES_INTL: MyPlace[] = [
  {
    id: 'place-intl-1',
    place_name: '이치란 라멘 신주쿠점',
    category: '식당',
    latitude: 35.6918,
    longitude: 139.7020,
    stay_time: 40,
    cost: 1200,
  },
  {
    id: 'place-intl-2',
    place_name: '블루보틀 카페 신주쿠',
    category: '카페',
    latitude: 35.6888,
    longitude: 139.7042,
    stay_time: 45,
    cost: 700,
  },
  {
    id: 'place-intl-3',
    place_name: '신주쿠 교엔 정원',
    category: '명소',
    latitude: 35.6852,
    longitude: 139.7101,
    stay_time: 90,
    cost: 500,
  },
  {
    id: 'place-intl-4',
    place_name: '긴자 규카츠 모토무라',
    category: '식당',
    latitude: 35.6712,
    longitude: 139.7650,
    stay_time: 60,
    cost: 2200,
  },
  {
    id: 'place-intl-5',
    place_name: '도쿄 타워 전망대',
    category: '명소',
    latitude: 35.6586,
    longitude: 139.7454,
    stay_time: 80,
    cost: 1500,
  },
];

const SEED_SETTINGS: TripSettings = {
  region_type: '국내',
  transport: '도보',
};

export const DB = {
  // Synchronous LocalStorage Fallbacks
  getMyPlaces(region: RegionType = '국내'): MyPlace[] {
    const key = region === '해외' ? STORAGE_KEYS.MY_PLACES_INTL : STORAGE_KEYS.MY_PLACES_DOMESTIC;
    const seed = region === '해외' ? SEED_PLACES_INTL : SEED_PLACES_DOMESTIC;
    const data = localStorage.getItem(key);
    if (!data) {
      this.saveMyPlaces(seed, region);
      return seed;
    }
    try {
      return JSON.parse(data);
    } catch {
      return seed;
    }
  },

  saveMyPlaces(places: MyPlace[], region: RegionType = '국내'): void {
    const key = region === '해외' ? STORAGE_KEYS.MY_PLACES_INTL : STORAGE_KEYS.MY_PLACES_DOMESTIC;
    localStorage.setItem(key, JSON.stringify(places));
  },

  addMyPlace(place: Omit<MyPlace, 'id'>, region: RegionType = '국내'): MyPlace {
    const places = this.getMyPlaces(region);
    const newPlace: MyPlace = {
      ...place,
      id: 'place-' + Date.now(),
    };
    places.push(newPlace);
    this.saveMyPlaces(places, region);
    return newPlace;
  },

  deleteMyPlace(id: string, region: RegionType = '국내'): void {
    const places = this.getMyPlaces(region).filter((p) => p.id !== id);
    this.saveMyPlaces(places, region);
  },

  clearMyPlaces(region: RegionType = '국내'): void {
    const key = region === '해외' ? STORAGE_KEYS.MY_PLACES_INTL : STORAGE_KEYS.MY_PLACES_DOMESTIC;
    localStorage.setItem(key, JSON.stringify([]));
  },

  getAccommodation(region: RegionType = '국내'): Accommodation {
    const key = region === '해외' ? STORAGE_KEYS.ACC_INTL : STORAGE_KEYS.ACC_DOMESTIC;
    const seed = region === '해외' ? SEED_ACC_INTL : SEED_ACC_DOMESTIC;
    const data = localStorage.getItem(key);
    if (!data) {
      this.saveAccommodation(seed, region);
      return seed;
    }
    try {
      return JSON.parse(data);
    } catch {
      return seed;
    }
  },

  saveAccommodation(acc: Accommodation, region: RegionType = '국내'): void {
    const key = region === '해외' ? STORAGE_KEYS.ACC_INTL : STORAGE_KEYS.ACC_DOMESTIC;
    localStorage.setItem(key, JSON.stringify(acc));
  },

  getTripSettings(): TripSettings {
    const data = localStorage.getItem(STORAGE_KEYS.TRIP_SETTINGS);
    if (!data) {
      this.saveTripSettings(SEED_SETTINGS);
      return SEED_SETTINGS;
    }
    try {
      const parsed = JSON.parse(data);
      return {
        region_type: parsed.region_type || '국내',
        transport: parsed.transport || '도보',
      };
    } catch {
      return SEED_SETTINGS;
    }
  },

  saveTripSettings(settings: TripSettings): void {
    localStorage.setItem(STORAGE_KEYS.TRIP_SETTINGS, JSON.stringify(settings));
  },

  // --------------------------------------------------------------------------
  // Supabase Cloud Synchronized Methods (Primary Cloud Source of Truth)
  // --------------------------------------------------------------------------
  async fetchMyPlacesAsync(region: RegionType = '국내'): Promise<MyPlace[]> {
    if (isSupabaseConfigured) {
      const cloudPlaces = await SupabaseDB.getMyPlaces(region);
      // Sync cloud places to local cache
      this.saveMyPlaces(cloudPlaces, region);
      return cloudPlaces;
    }
    return this.getMyPlaces(region);
  },

  async addMyPlaceAsync(place: Omit<MyPlace, 'id'>, region: RegionType = '국내'): Promise<MyPlace> {
    if (isSupabaseConfigured) {
      const inserted = await SupabaseDB.addMyPlace(place, region);
      if (inserted) {
        const places = this.getMyPlaces(region);
        places.push(inserted);
        this.saveMyPlaces(places, region);
        return inserted;
      }
    }
    return this.addMyPlace(place, region);
  },

  async deleteMyPlaceAsync(id: string, region: RegionType = '국내'): Promise<void> {
    if (isSupabaseConfigured) {
      await SupabaseDB.deleteMyPlace(id, region);
    }
    this.deleteMyPlace(id, region);
  },

  async clearMyPlacesAsync(region: RegionType = '국내'): Promise<void> {
    if (isSupabaseConfigured) {
      await SupabaseDB.clearMyPlaces(region);
    }
    this.clearMyPlaces(region);
  },

  async fetchAccommodationAsync(region: RegionType = '국내'): Promise<Accommodation> {
    if (isSupabaseConfigured) {
      const cloudAcc = await SupabaseDB.getAccommodation(region);
      if (cloudAcc) {
        this.saveAccommodation(cloudAcc, region);
        return cloudAcc;
      }
    }
    return this.getAccommodation(region);
  },

  async saveAccommodationAsync(acc: Accommodation, region: RegionType = '국내'): Promise<void> {
    if (isSupabaseConfigured) {
      await SupabaseDB.saveAccommodation(acc, region);
    }
    this.saveAccommodation(acc, region);
  },
};
