import React from 'react';
import { TripSettings, RegionType, TransportType } from '../types';
import { Compass, Footprints, Bus, Car, PlusCircle, Hotel, Globe, Map, RotateCcw } from 'lucide-react';

interface TopHeaderProps {
  settings: TripSettings;
  onUpdateSettings: (newSettings: TripSettings) => void;
  onOpenAddPlace: () => void;
  onOpenAccommodation: () => void;
  onResetPlaces: () => void;
  onShare: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenAddPlace,
  onOpenAccommodation,
  onResetPlaces,
  onShare,
}) => {
  const setRegion = (region_type: RegionType) => {
    onUpdateSettings({
      ...settings,
      region_type,
    });
  };

  const setTransport = (transport: TransportType) => {
    onUpdateSettings({
      ...settings,
      transport,
    });
  };

  const handleResetClick = () => {
    if (window.confirm('저장된 모든 장소를 초기화하시겠습니까?')) {
      onResetPlaces();
    }
  };

  return (
    <header className="top-header-bar">
      {/* 1. Brand Title & Action Buttons (Single Row) */}
      <div className="brand-row">
        <div className="brand-title">
          <Compass size={18} className="text-emerald-400" />
          <span>이리가</span>
          <span className="brand-badge">{settings.region_type}</span>
        </div>

        <div className="header-actions">
          <button className="btn-icon-sm" onClick={onShare} title="일정 공유">
            <Globe size={12} />
            <span>공유</span>
          </button>
          <button className="btn-icon-sm" onClick={onOpenAccommodation} title="숙소 수정">
            <Hotel size={12} />
            <span>숙소</span>
          </button>
          <button className="btn-icon-sm btn-accent" onClick={onOpenAddPlace} title="장소 추가">
            <PlusCircle size={12} />
            <span>+ 장소</span>
          </button>
          <button className="btn-icon-sm btn-reset" onClick={handleResetClick} title="전체 장소 초기화">
            <RotateCcw size={12} />
            <span>리셋</span>
          </button>
        </div>
      </div>

      {/* 2. Region Switcher & Transport Mode Controls (Slim 2-Column Grid) */}
      <div className="header-controls-grid">
        {/* Region Switcher Segment */}
        <div className="segment-control region-segment">
          <button
            className={`segment-btn ${settings.region_type === '국내' ? 'active' : ''}`}
            onClick={() => setRegion('국내')}
          >
            <Map size={11} />
            <span>국내</span>
          </button>
          <button
            className={`segment-btn ${settings.region_type === '해외' ? 'active' : ''}`}
            onClick={() => setRegion('해외')}
          >
            <Globe size={11} />
            <span>해외</span>
          </button>
        </div>

        {/* Transport Mode 3-stage Segment */}
        <div className="segment-control transport-segment">
          <button
            className={`segment-btn ${settings.transport === '도보' ? 'active' : ''}`}
            onClick={() => setTransport('도보')}
            title="도보"
          >
            <Footprints size={11} />
            <span>도보</span>
          </button>
          <button
            className={`segment-btn ${settings.transport === '대중교통' ? 'active' : ''}`}
            onClick={() => setTransport('대중교통')}
            title="대중교통"
          >
            <Bus size={11} />
            <span>교통</span>
          </button>
          <button
            className={`segment-btn ${settings.transport === '차량' ? 'active' : ''}`}
            onClick={() => setTransport('차량')}
            title="차량"
          >
            <Car size={11} />
            <span>차량</span>
          </button>
        </div>
      </div>
    </header>
  );
};
