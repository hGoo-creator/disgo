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

  // Initial load
  useEffect(() => {
    const savedSettings = DB.getTripSettings();
    setTripSettings(savedSettings);
    setMyPlaces(DB.getMyPlaces(savedSettings.region_type));
    setAccommodation(DB.getAccommodation(savedSettings.region_type));
  }, []);

  // Update Settings handler (Region switch or Transport switch)
  const handleUpdateSettings = (newSettings: TripSettings) => {
    const isRegionChanged = newSettings.region_type !== tripSettings.region_type;
    setTripSettings(newSettings);
    DB.saveTripSettings(newSettings);

    if (isRegionChanged) {
      // Reload places and accommodation for the new region
      setMyPlaces(DB.getMyPlaces(newSettings.region_type));
      setAccommodation(DB.getAccommodation(newSettings.region_type));
      setActiveDay(1);
    }
  };

  // Add Place handler
  const handleAddPlace = (newPlaceData: Omit<MyPlace, 'id'>) => {
    DB.addMyPlace(newPlaceData, tripSettings.region_type);
    setMyPlaces(DB.getMyPlaces(tripSettings.region_type));
  };

  // Delete Place handler
  const handleDeletePlace = (id: string) => {
    DB.deleteMyPlace(id, tripSettings.region_type);
    setMyPlaces(DB.getMyPlaces(tripSettings.region_type));
  };

  // Reset All Places handler
  const handleResetPlaces = () => {
    DB.clearMyPlaces(tripSettings.region_type);
    setMyPlaces([]);
    setActiveDay(1);
  };

  // Save Accommodation handler
  const handleSaveAccommodation = (updatedAcc: Accommodation) => {
    DB.saveAccommodation(updatedAcc, tripSettings.region_type);
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
