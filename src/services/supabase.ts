import { createClient } from '@supabase/supabase-js';
import { MyPlace, Accommodation, RegionType } from '../types';

// Safe environment variable extraction for Vite & Next.js style
const getEnvVar = (key: string): string => {
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv[key]) return metaEnv[key];

  const procEnv = (globalThis as any)?.process?.env;
  if (procEnv && procEnv[key]) return procEnv[key];

  return '';
};

const SUPABASE_URL =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  'https://placeholder.supabase.co';

const SUPABASE_ANON_KEY =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  'placeholder-key';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('placeholder') &&
    !SUPABASE_ANON_KEY.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.info('[Supabase Info]: Environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured. Running in LocalStorage offline mode.');
} else {
  console.info(`[Supabase Connected]: Target Cloud URL: ${SUPABASE_URL}`);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SupabaseDB = {
  // 1. MyPlaces CRUD (Table: my_places)
  async getMyPlaces(region: RegionType = '국내'): Promise<MyPlace[]> {
    if (!isSupabaseConfigured) return [];
    try {
      console.info(`[Supabase SELECT]: Fetching places for region: '${region}'`);
      const { data, error } = await supabase
        .from('my_places')
        .select('*')
        .eq('region_type', region)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Supabase Error - SELECT my_places]:', error.message || error);
        return [];
      }

      console.info(`[Supabase SELECT Success]: Loaded ${data?.length || 0} places from Cloud DB`);
      return (data || []).map((item: any) => ({
        id: item.id?.toString() || 'place-' + Date.now(),
        place_name: item.place_name,
        category: item.category,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        stay_time: parseInt(item.stay_time, 10) || 30,
        cost: parseInt(item.cost, 10) || 0,
      }));
    } catch (err: any) {
      console.error('[Supabase Network/Connection Error]:', err?.message || err);
      return [];
    }
  },

  async getPlacesByIds(ids: string[]): Promise<MyPlace[]> {
    if (!isSupabaseConfigured || ids.length === 0) return [];
    try {
      console.info(`[Supabase SELECT]: Fetching places by IDs: ${ids.join(', ')}`);
      const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      
      const { data, error } = await supabase
        .from('my_places')
        .select('*')
        .in('id', numericIds);

      if (error) {
        console.error('[Supabase Error - SELECT IN my_places]:', error.message || error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id?.toString() || 'place-' + Date.now(),
        place_name: item.place_name,
        category: item.category,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        stay_time: parseInt(item.stay_time, 10) || 30,
        cost: parseInt(item.cost, 10) || 0,
        isShared: true
      }));
    } catch (err: any) {
      console.error('[Supabase Network/Connection Error]:', err?.message || err);
      return [];
    }
  },

  async addMyPlace(place: Omit<MyPlace, 'id'>, region: RegionType = '국내'): Promise<MyPlace | null> {
    if (!isSupabaseConfigured) return null;
    try {
      console.info(`[Supabase INSERT]: Inserting new place '${place.place_name}' into my_places`);
      const payload = {
        place_name: place.place_name,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        stay_time: place.stay_time,
        cost: place.cost,
        region_type: region,
      };

      const { data, error } = await supabase.from('my_places').insert([payload]).select();

      if (error || !data || data.length === 0) {
        console.error('[Supabase Error - INSERT my_places]:', error?.message || error);
        return null;
      }

      const inserted = data[0];
      console.info(`[Supabase INSERT Success]: Inserted row ID #${inserted.id}`);
      return {
        id: inserted.id.toString(),
        place_name: inserted.place_name,
        category: inserted.category,
        latitude: parseFloat(inserted.latitude),
        longitude: parseFloat(inserted.longitude),
        stay_time: parseInt(inserted.stay_time, 10),
        cost: parseInt(inserted.cost, 10),
      };
    } catch (err: any) {
      console.error('[Supabase Network/Connection Error]:', err?.message || err);
      return null;
    }
  },

  async deleteMyPlace(id: string, region: RegionType = '국내'): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      console.info(`[Supabase DELETE]: Deleting place ID '${id}' from my_places`);

      let query = supabase.from('my_places').delete().eq('region_type', region);
      const numId = parseInt(id, 10);

      if (!isNaN(numId) && String(numId) === id) {
        query = query.eq('id', numId);
      } else {
        query = query.eq('id', id);
      }

      const { error } = await query;

      if (error) {
        console.error('[Supabase Error - DELETE my_places]:', error.message || error);
        return false;
      }
      console.info(`[Supabase DELETE Success]: Deleted place ID #${id}`);
      return true;
    } catch (err: any) {
      console.error('[Supabase Network/Connection Error]:', err?.message || err);
      return false;
    }
  },

  async clearMyPlaces(region: RegionType = '국내'): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      console.info(`[Supabase DELETE ALL]: Clearing all places for region: '${region}'`);
      const { error } = await supabase
        .from('my_places')
        .delete()
        .eq('region_type', region);

      if (error) {
        console.error('[Supabase Error - DELETE ALL my_places]:', error.message || error);
        return false;
      }
      console.info(`[Supabase DELETE ALL Success]: Cleared all places for region '${region}'`);
      return true;
    } catch (err: any) {
      console.error('[Supabase Network/Connection Error]:', err?.message || err);
      return false;
    }
  },

  // 2. Accommodations CRUD (Table: accommodations)
  async getAccommodation(region: RegionType = '국내'): Promise<Accommodation | null> {
    if (!isSupabaseConfigured) return null;
    try {
      console.info(`[Supabase SELECT]: Fetching accommodation for region: '${region}'`);
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('region_type', region)
        .limit(1);

      if (error || !data || data.length === 0) {
        if (error) console.error('[Supabase Error - SELECT accommodations]:', error.message || error);
        return null;
      }

      const item = data[0];
      console.info(`[Supabase SELECT Success]: Loaded accommodation '${item.hotel_name}'`);
      return {
        id: item.id.toString(),
        hotel_name: item.hotel_name,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        check_in: item.check_in,
        check_out: item.check_out,
      };
    } catch (err: any) {
      console.error('[Supabase Network/Connection Error]:', err?.message || err);
      return null;
    }
  },

  async saveAccommodation(acc: Accommodation, region: RegionType = '국내'): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      console.info(`[Supabase UPSERT]: Saving accommodation '${acc.hotel_name}'`);
      const payload = {
        hotel_name: acc.hotel_name,
        latitude: acc.latitude,
        longitude: acc.longitude,
        check_in: acc.check_in,
        check_out: acc.check_out,
        region_type: region,
      };

      const { error } = await supabase.from('accommodations').upsert([payload]);
      if (error) {
        console.error('[Supabase Error - UPSERT accommodations]:', error.message || error);
        return false;
      }
      console.info(`[Supabase UPSERT Success]: Saved accommodation '${acc.hotel_name}'`);
      return true;
    } catch (err: any) {
      console.error('[Supabase Network/Connection Error]:', err?.message || err);
      return false;
    }
  },
};
