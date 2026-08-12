import React, { useState } from 'react';
import { PlaceCategory, MyPlace } from '../types';
import { X, Plus, Sparkles } from 'lucide-react';
import { PlaceSearchInput } from './PlaceSearchInput';

interface PlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Omit<MyPlace, 'id'>) => void;
}

export const PlaceModal: React.FC<PlaceModalProps> = ({ isOpen, onClose, onAddPlace }) => {
  const [placeName, setPlaceName] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  if (!isOpen) return null;

  const handlePlaceSelect = (selectedName: string, selectedLat: number, selectedLng: number) => {
    setPlaceName(selectedName);
    setLat(selectedLat);
    setLng(selectedLng);
  };

  // 3. 스마트 장소 추가 알고리즘 (Smart Auto-Assign)
  const autoAssignDetails = (name: string): { category: PlaceCategory; stay_time: number; cost: number } => {
    const text = name.toLowerCase();
    
    // 식당 키워드
    if (text.includes('식당') || text.includes('가든') || text.includes('해장국') || text.includes('라멘') || text.includes('규카츠') || text.includes('고기') || text.includes('횟집') || text.includes('맛집')) {
      return { category: '식당', stay_time: 60, cost: 20000 };
    }
    // 카페 키워드
    if (text.includes('카페') || text.includes('커피') || text.includes('베이커리') || text.includes('다방') || text.includes('스타벅스') || text.includes('블루보틀')) {
      return { category: '카페', stay_time: 45, cost: 6500 };
    }
    // 간식 키워드
    if (text.includes('떡') || text.includes('아이스크림') || text.includes('시장') || text.includes('포장마차') || text.includes('김밥')) {
      return { category: '간식', stay_time: 30, cost: 5000 };
    }
    // 기본(명소) 키워드
    return { category: '명소', stay_time: 90, cost: 0 };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) return;

    // Use selected coordinates or default to center
    const finalLat = lat !== null ? lat : 33.5065;
    const finalLng = lng !== null ? lng : 126.5401;

    // 카테고리, 비용, 체류시간 스마트 자동 할당
    const smartDetails = autoAssignDetails(placeName);

    onAddPlace({
      place_name: placeName,
      category: smartDetails.category,
      latitude: finalLat,
      longitude: finalLng,
      stay_time: smartDetails.stay_time,
      cost: smartDetails.cost,
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
            <label>장소 검색 (구글 맵 API 연동)</label>
            <PlaceSearchInput
              initialName={placeName}
              placeholder="장소명을 입력해 검색하세요 (예: 은희네해장국, 성산일출봉)"
              onPlaceSelect={handlePlaceSelect}
            />
          </div>

          <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} className="text-cyan-400 shrink-0" />
            <span>장소를 선택하면 <strong>카테고리, 예상 비용, 권장 체류 시간</strong>이 스마트 알고리즘에 의해 자동 할당됩니다.</span>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Plus size={16} />
            <span>장소 자동 최적화 추가하기</span>
          </button>
        </form>
      </div>
    </div>
  );
};
