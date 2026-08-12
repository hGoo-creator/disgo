import { MyPlace, Accommodation, TripSettings, RegionType } from '../types';
import { SupabaseDB, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  MY_PLACES_DOMESTIC: 'leeriga_places_domestic',
  MY_PLACES_INTL: 'leeriga_places_intl',
  ACC_DOMESTIC: 'leeriga_acc_domestic',
  ACC_INTL: 'leeriga_acc_intl',
  TRIP_SETTINGS: 'leeriga_trip_settings',
};

// Default Domestic Accommodation (My Home)
const DEFAULT_DOMESTIC_ACC: Accommodation = {
  id: 'acc-dom-default',
  hotel_name: '나의 집 (서울시 동작구 보라매로9라길 25)',
  latitude: 37.493,
  longitude: 126.924,
  check_in: '09:00',
  check_out: '09:00',
};

const SEED_SETTINGS: TripSettings = {
  region_type: '국내',
  transport: '도보',
};

export const DB = {
  // Synchronous LocalStorage Fallbacks
  getMyPlaces(region: RegionType = '국내'): MyPlace[] {
    const key = region === '해외' ? STORAGE_KEYS.MY_PLACES_INTL : STORAGE_KEYS.MY_PLACES_DOMESTIC;
    const data = localStorage.getItem(key);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
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

  getAccommodation(region: RegionType = '국내'): Accommodation | null {
    const key = region === '해외' ? STORAGE_KEYS.ACC_INTL : STORAGE_KEYS.ACC_DOMESTIC;
    const defaultAcc = region === '해외' ? null : DEFAULT_DOMESTIC_ACC;
    const data = localStorage.getItem(key);
    if (!data) {
      if (defaultAcc) {
        this.saveAccommodation(defaultAcc, region);
      }
      return defaultAcc;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultAcc;
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

  async fetchSharedPlacesAsync(ids: string[]): Promise<MyPlace[]> {
    if (isSupabaseConfigured) {
      return await SupabaseDB.getPlacesByIds(ids);
    }
    return [];
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

  async fetchAccommodationAsync(region: RegionType = '국내'): Promise<Accommodation | null> {
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
