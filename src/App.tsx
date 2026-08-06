import { useState, useEffect, useMemo } from 'react';
import { MyPlace, Accommodation, TripSettings } from './types';
import { DB } from './services/db';
import { generateMultiDayTimeline } from './utils/optimizer';
import { TopHeader } from './components/TopHeader';
import { MapView } from './components/MapView';
import { TimelineView } from './components/TimelineView';
import { PlaceModal } from './components/PlaceModal';
import { AccommodationModal } from './components/AccommodationModal';

export function App() {
  const [tripSettings, setTripSettings] = useState<TripSettings>({
    region_type: '국내',
    transport: '도보',
  });

  const [myPlaces, setMyPlaces] = useState<MyPlace[]>([]);
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);

  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);

  // Load initial data (LocalStorage + Supabase Cloud Sync)
  useEffect(() => {
    const savedSettings = DB.getTripSettings();
    setTripSettings(savedSettings);

    // Initial sync
    const loadInitialData = async () => {
      const places = await DB.fetchMyPlacesAsync(savedSettings.region_type);
      const acc = await DB.fetchAccommodationAsync(savedSettings.region_type);
      setMyPlaces(places);
      setAccommodation(acc);
    };

    loadInitialData();
  }, []);

  // Update Settings handler (Region switch or Transport switch)
  const handleUpdateSettings = async (newSettings: TripSettings) => {
    const isRegionChanged = newSettings.region_type !== tripSettings.region_type;
    setTripSettings(newSettings);
    DB.saveTripSettings(newSettings);

    if (isRegionChanged) {
      // Reload places and accommodation for the new region from Supabase Cloud / Local DB
      const places = await DB.fetchMyPlacesAsync(newSettings.region_type);
      const acc = await DB.fetchAccommodationAsync(newSettings.region_type);
      setMyPlaces(places);
      setAccommodation(acc);
      setActiveDay(1);
    }
  };

  // Add Place handler (Supabase INSERT + Local state sync)
  const handleAddPlace = async (newPlaceData: Omit<MyPlace, 'id'>) => {
    await DB.addMyPlaceAsync(newPlaceData, tripSettings.region_type);
    const updatedPlaces = await DB.fetchMyPlacesAsync(tripSettings.region_type);
    setMyPlaces(updatedPlaces);
  };

  // Delete Place handler (Supabase DELETE + Local state sync)
  const handleDeletePlace = async (id: string) => {
    await DB.deleteMyPlaceAsync(id, tripSettings.region_type);
    const updatedPlaces = await DB.fetchMyPlacesAsync(tripSettings.region_type);
    setMyPlaces(updatedPlaces);
  };

  // Reset All Places handler (Supabase DELETE ALL + Local clear)
  const handleResetPlaces = async () => {
    await DB.clearMyPlacesAsync(tripSettings.region_type);
    setMyPlaces([]);
    setActiveDay(1);
  };

  // Save Accommodation handler (Supabase UPSERT + Local save)
  const handleSaveAccommodation = async (updatedAcc: Accommodation) => {
    await DB.saveAccommodationAsync(updatedAcc, tripSettings.region_type);
    setAccommodation(updatedAcc);
  };

  // Dynamic Multi-Day Timeline Calculation
  const multiDayResult = useMemo(() => {
    if (!accommodation) return { totalDays: 1, suggestedDurationText: '', dayTimelines: { 1: [] } };
    return generateMultiDayTimeline(myPlaces, accommodation, tripSettings);
  }, [myPlaces, accommodation, tripSettings]);

  // Adjust activeDay if out of bounds when places change
  useEffect(() => {
    if (activeDay > multiDayResult.totalDays) {
      setActiveDay(Math.max(1, multiDayResult.totalDays));
    }
  }, [multiDayResult.totalDays, activeDay]);

  const activeTimelineItems = multiDayResult.dayTimelines[activeDay] || [];

  if (!accommodation) {
    return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>이리가 플래너 로딩 중...</div>;
  }

  return (
    <div className="mobile-app-wrapper">
      {/* 1. Top Header Bar (Controls: region_type domestic/intl tab, 3-stage transport, Reset button) */}
      <TopHeader
        settings={tripSettings}
        onUpdateSettings={handleUpdateSettings}
        onOpenAddPlace={() => setIsPlaceModalOpen(true)}
        onOpenAccommodation={() => setIsAccModalOpen(true)}
        onResetPlaces={handleResetPlaces}
      />

      {/* App Content Split Container */}
      <div className="app-content-split">
        {/* 2. Top 30% Google Maps View (Shows active day's pins & route) */}
        <MapView timelineItems={activeTimelineItems} />

        {/* 3. Bottom Timeline List View with Day Tabs & Duration Recommendation */}
        <TimelineView
          items={activeTimelineItems}
          totalDays={multiDayResult.totalDays}
          activeDay={activeDay}
          onSelectDay={setActiveDay}
          suggestedDurationText={multiDayResult.suggestedDurationText}
          regionType={tripSettings.region_type}
          transportType={tripSettings.transport}
          onDeletePlace={handleDeletePlace}
        />
      </div>

      {/* Place Modal */}
      <PlaceModal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        onAddPlace={handleAddPlace}
      />

      {/* Accommodation Modal */}
      <AccommodationModal
        isOpen={isAccModalOpen}
        onClose={() => setIsAccModalOpen(false)}
        accommodation={accommodation}
        onSave={handleSaveAccommodation}
      />
    </div>
  );
}

export default App;
