import React from 'react';
import { TimelineItem, PlaceCategory, RegionType, TransportType } from '../types';
import { Clock, DollarSign, AlertTriangle, Trash2, MapPin, Bus, Footprints, Car, Calendar, Sparkles } from 'lucide-react';

interface TimelineViewProps {
  items: TimelineItem[];
  totalDays: number;
  activeDay: number;
  onSelectDay: (day: number) => void;
  suggestedDurationText: string;
  regionType: RegionType;
  transportType: TransportType;
  onDeletePlace: (id: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  items,
  totalDays,
  activeDay,
  onSelectDay,
  suggestedDurationText,
  regionType,
  transportType,
  onDeletePlace,
}) => {
  const getCategoryTag = (category?: PlaceCategory | '숙소') => {
    switch (category) {
      case '식당':
        return <span className="category-tag cat-restaurant">🍔 식당</span>;
      case '카페':
        return <span className="category-tag cat-cafe">☕ 카페</span>;
      case '명소':
        return <span className="category-tag cat-spot">🏰 명소</span>;
      case '간식':
        return <span className="category-tag cat-snack">🍡 간식</span>;
      case '숙소':
        return <span className="category-tag cat-hotel">🏨 숙소</span>;
      default:
        return <span className="category-tag cat-spot">📍 장소</span>;
    }
  };

  // Format: [이동 | (아이콘)]
  const getTransportBadge = () => {
    switch (transportType) {
      case '도보':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#34d399', fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <span>이동</span> <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>|</span> <Footprints size={12} />
          </span>
        );
      case '대중교통':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#60a5fa', fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <span>이동</span> <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>|</span> <Bus size={12} />
          </span>
        );
      case '차량':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#c084fc', fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.15)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <span>이동</span> <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>|</span> <Car size={12} />
          </span>
        );
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`'${name}' 장소를 동선에서 삭제하시겠습니까?`)) {
      onDeletePlace(id);
    }
  };

  const currencySymbol = regionType === '해외' ? '¥' : '원';
  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0);
  const placeCount = items.filter((i) => i.type === 'place').length;

  return (
    <div className="timeline-view-container">
      {/* 1. Suggested Duration Recommendation Banner */}
      {suggestedDurationText ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '10px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#38bdf8',
            marginBottom: '4px',
          }}
        >
          <Sparkles size={14} className="text-cyan-400 shrink-0" />
          <span>{suggestedDurationText}</span>
        </div>
      ) : null}

      {/* 2. Day Tabs (Day 1, Day 2, Day 3...) Segmented Control */}
      {totalDays > 1 ? (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: '#1e293b',
            padding: '3px',
            borderRadius: '10px',
            marginBottom: '4px',
          }}
        >
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => onSelectDay(d)}
              style={{
                flex: 1,
                border: 'none',
                background: activeDay === d ? '#10b981' : 'transparent',
                color: activeDay === d ? '#022c22' : '#94a3b8',
                fontWeight: activeDay === d ? 800 : 600,
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Calendar size={11} />
              <span>Day {d}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* 3. Timeline Header Info */}
      <div className="timeline-header-info">
        <div className="timeline-title-text">
          <MapPin size={15} className="text-emerald-400" />
          <span>
            {totalDays > 1 ? `Day ${activeDay} 추천 동선 (${placeCount}개)` : `이리가 추천 동선 (${placeCount}개)`}
          </span>
        </div>
        {getTransportBadge()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
        <span>지역: {regionType === '국내' ? '🇰🇷 국내 (제주/서울)' : '✈️ 해외 (도쿄)'}</span>
        <span>Day {activeDay} 비용: {regionType === '해외' ? `¥${totalCost.toLocaleString()}` : `${totalCost.toLocaleString()}원`}</span>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          저장된 장소가 없습니다. 상단의 [+ 장소 추가] 버튼으로 장소를 추가해 주세요!
        </div>
      ) : (
        items.map((item) => {
          if (item.type === 'transit_warning') {
            return (
              <div key={item.id} className="transit-warning-card">
                <AlertTriangle size={18} className="warning-icon text-amber-400 shrink-0" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{item.title}</div>
                  <div style={{ opacity: 0.9, fontSize: '0.7rem' }}>{item.warningText}</div>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="timeline-item">
              <div className="timeline-left-axis">
                <span className="timeline-time-text">{item.time}</span>
                <div className="timeline-line-connector" />
              </div>

              <div className="timeline-card">
                <div className="card-top">
                  {getCategoryTag(item.category)}
                  {item.type === 'place' ? (
                    <button
                      onClick={() => handleDeleteClick(item.id, item.title)}
                      className="btn-card-delete"
                      title="장소 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>

                <div className="card-title">{item.title}</div>

                <div className="card-details">
                  {item.stay_time !== undefined ? (
                    <div className="detail-item">
                      <Clock size={12} className="text-emerald-400" />
                      <span>체류 {item.stay_time}분</span>
                    </div>
                  ) : null}
                  {item.cost !== undefined && item.cost > 0 ? (
                    <div className="detail-item">
                      <DollarSign size={12} className="text-cyan-400" />
                      <span>{currencySymbol}{item.cost.toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>

                {item.warningText && item.type === 'place' ? (
                  <div style={{ marginTop: '4px', fontSize: '0.68rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '3px 6px', borderRadius: '5px' }}>
                    {item.warningText}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
