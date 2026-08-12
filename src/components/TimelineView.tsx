import React from 'react';
import { TimelineItem, PlaceCategory, RegionType, TransportType, MyPlace } from '../types';
import { Clock, DollarSign, AlertTriangle, Trash2, MapPin, Bus, Footprints, Car, Calendar, Sparkles, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TimelineViewProps {
  items: TimelineItem[];
  allPlaces: MyPlace[];
  totalDays: number;
  activeDay: number;
  onSelectDay: (day: number) => void;
  suggestedDurationText: string;
  regionType: RegionType;
  transportType: TransportType;
  onDeletePlace: (id: string) => void;
  onUpdatePlaces: (places: MyPlace[]) => void;
}

// Sortable Item Component
const SortableTimelineItem = ({ id, children, isDraggable }: { id: string, children: React.ReactNode, isDraggable: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isDraggable });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as any,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* 20px drag handle area on the left side of the card */}
      {isDraggable && (
        <div {...attributes} {...listeners} style={{ position: 'absolute', left: '40px', top: '50%', transform: 'translateY(-50%)', cursor: 'grab', zIndex: 5, padding: '10px' }}>
          <GripVertical size={16} color="#475569" />
        </div>
      )}
      {children}
    </div>
  );
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  items,
  allPlaces,
  totalDays,
  activeDay,
  onSelectDay,
  suggestedDurationText,
  regionType,
  transportType,
  onDeletePlace,
  onUpdatePlaces
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Find original MyPlace items for this day
      const dayPlaces = allPlaces.filter(p => p.dayNumber === activeDay || (!p.dayNumber && activeDay === 1));
      
      const oldIndex = dayPlaces.findIndex(p => p.id === active.id);
      const newIndex = dayPlaces.findIndex(p => p.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedDayPlaces = arrayMove(dayPlaces, oldIndex, newIndex);
        // Re-assign order for day places
        reorderedDayPlaces.forEach((p, idx) => {
          p.order = idx;
        });

        // Merge back into allPlaces
        const newAllPlaces = allPlaces.map(p => {
          const reordered = reorderedDayPlaces.find(rdp => rdp.id === p.id);
          return reordered ? reordered : p;
        });
        
        onUpdatePlaces(newAllPlaces);
      }
    }
  };

  const getCategoryTag = (category?: PlaceCategory | '숙소', isShared?: boolean) => {
    let tag = <span className="category-tag cat-spot">📍 장소</span>;
    switch (category) {
      case '식당': tag = <span className="category-tag cat-restaurant">🍔 식당</span>; break;
      case '카페': tag = <span className="category-tag cat-cafe">☕ 카페</span>; break;
      case '명소': tag = <span className="category-tag cat-spot">🏰 명소</span>; break;
      case '간식': tag = <span className="category-tag cat-snack">🍡 간식</span>; break;
      case '숙소': tag = <span className="category-tag cat-hotel">🏨 숙소</span>; break;
    }
    
    if (isShared) {
      return (
        <div style={{ display: 'flex', gap: '6px' }}>
          {tag}
          <span className="category-tag" style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>🤝 지인 추천</span>
        </div>
      );
    }
    return tag;
  };

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
  const sortableItemIds = items.filter(i => i.type === 'place').map(i => i.id);

  return (
    <div className="timeline-view-container">
      {suggestedDurationText ? (
        <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '10px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
          <Sparkles size={14} className="text-cyan-400 shrink-0" />
          <span>{suggestedDurationText}</span>
        </div>
      ) : null}

      {totalDays >= 1 ? (
        <div style={{ display: 'flex', gap: '6px', background: '#1e293b', padding: '6px', borderRadius: '12px', marginBottom: '12px', overflowX: 'auto', overflowY: 'hidden', flexShrink: 0, minHeight: '52px' }}>
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => onSelectDay(d)}
              style={{ flex: 1, minWidth: '85px', border: 'none', background: activeDay === d ? '#10b981' : 'transparent', color: activeDay === d ? '#022c22' : '#94a3b8', fontWeight: activeDay === d ? 800 : 600, fontSize: '0.85rem', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Calendar size={14} />
              <span>Day {d}</span>
            </button>
          ))}
          <button
            onClick={() => {
              const newDay = totalDays + 1;
              const emptyPlace = { id: 'temp-' + Date.now(), place_name: '임시', category: '명소' as PlaceCategory, latitude: 0, longitude: 0, stay_time: 0, cost: 0, dayNumber: newDay };
              onUpdatePlaces([...allPlaces, emptyPlace]);
              setTimeout(() => onDeletePlace(emptyPlace.id), 100);
            }}
            style={{ flex: '0 0 auto', minWidth: '52px', border: '1px dashed #475569', background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: '1.2rem', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            +
          </button>
        </div>
      ) : null}

      <div className="timeline-header-info">
        <div className="timeline-title-text">
          <MapPin size={15} className="text-emerald-400" />
          <span>Day {activeDay} 추천 동선 ({placeCount}개)</span>
        </div>
        {getTransportBadge()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
        <span>지역: {regionType === '국내' ? '🇰🇷 국내 (제주/서울)' : '✈️ 해외 (도쿄)'}</span>
        <span>Day {activeDay} 비용: {regionType === '해외' ? `¥${totalCost.toLocaleString()}` : `${totalCost.toLocaleString()}원`}</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableItemIds} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              저장된 장소가 없습니다. 상단의 [+ 장소 추가] 버튼으로 장소를 추가해 주세요!
            </div>
          ) : (
            items.map((item) => {
              const isDraggable = item.type === 'place';
              
              const cardContent = (
                <div className="timeline-item">
                  <div className="timeline-left-axis">
                    <span className="timeline-time-text">{item.time}</span>
                    <div className="timeline-line-connector" />
                  </div>

                  <div className="timeline-card" style={{ paddingLeft: isDraggable ? '24px' : '12px' }}>
                    <div className="card-top">
                      {getCategoryTag(item.category, item.isShared)}
                      {isDraggable && (
                        <button onClick={() => handleDeleteClick(item.id, item.title)} className="btn-card-delete" title="장소 삭제">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="card-title">{item.title}</div>

                    <div className="card-details">
                      {item.stay_time !== undefined && (
                        <div className="detail-item">
                          <Clock size={12} className="text-emerald-400" />
                          <span>체류 {item.stay_time}분</span>
                        </div>
                      )}
                      {item.cost !== undefined && item.cost > 0 && (
                        <div className="detail-item">
                          <DollarSign size={12} className="text-cyan-400" />
                          <span>{currencySymbol}{item.cost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {item.warningText && item.type === 'place' && (
                      <div style={{ marginTop: '4px', fontSize: '0.68rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '3px 6px', borderRadius: '5px' }}>
                        {item.warningText}
                      </div>
                    )}
                  </div>
                </div>
              );

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
                <SortableTimelineItem key={item.id} id={item.id} isDraggable={isDraggable}>
                  {cardContent}
                </SortableTimelineItem>
              );
            })
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
};
