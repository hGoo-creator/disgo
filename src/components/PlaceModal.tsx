import React, { useState } from 'react';
import { PlaceCategory, MyPlace } from '../types';
import { X, Plus } from 'lucide-react';
import { PlaceSearchInput } from './PlaceSearchInput';

interface PlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Omit<MyPlace, 'id'>) => void;
}

export const PlaceModal: React.FC<PlaceModalProps> = ({ isOpen, onClose, onAddPlace }) => {
  const [placeName, setPlaceName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('식당');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [stayTime, setStayTime] = useState('60');
  const [cost, setCost] = useState('15000');

  if (!isOpen) return null;

  const handlePlaceSelect = (selectedName: string, selectedLat: number, selectedLng: number) => {
    setPlaceName(selectedName);
    setLat(selectedLat);
    setLng(selectedLng);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) return;

    // Use selected coordinates or default to Jeju center if none selected
    const finalLat = lat !== null ? lat : 33.5065;
    const finalLng = lng !== null ? lng : 126.5401;

    onAddPlace({
      place_name: placeName,
      category,
      latitude: finalLat,
      longitude: finalLng,
      stay_time: parseInt(stayTime, 10) || 30,
      cost: parseInt(cost, 10) || 0,
    });

    setPlaceName('');
    setLat(null);
    setLng(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>새 여행 장소 추가</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Google Places Autocomplete Search Bar */}
          <div className="form-group">
            <label>장소 검색 (구글맵 / 장소 자동 완성)</label>
            <PlaceSearchInput
              initialName={placeName}
              placeholder="장소명을 입력해 검색하세요 (예: 은희네해장국, 성산일출봉)"
              onPlaceSelect={handlePlaceSelect}
            />
          </div>

          <div className="form-group">
            <label>카테고리 (category)</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as PlaceCategory)}>
              <option value="식당">식당 🍔</option>
              <option value="카페">카페 ☕</option>
              <option value="명소">명소 🏰</option>
              <option value="간식">간식 🍡</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>체류 시간 (분)</label>
              <input
                type="number"
                value={stayTime}
                onChange={(e) => setStayTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>예상 비용 (원/외화)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Plus size={16} />
            <span>장소 저장하기</span>
          </button>
        </form>
      </div>
    </div>
  );
};
