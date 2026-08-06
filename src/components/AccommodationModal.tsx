import React, { useState, useEffect } from 'react';
import { Accommodation } from '../types';
import { X, Save } from 'lucide-react';
import { PlaceSearchInput } from './PlaceSearchInput';

interface AccommodationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodation: Accommodation;
  onSave: (acc: Accommodation) => void;
}

export const AccommodationModal: React.FC<AccommodationModalProps> = ({
  isOpen,
  onClose,
  accommodation,
  onSave,
}) => {
  const [hotelName, setHotelName] = useState(accommodation.hotel_name);
  const [lat, setLat] = useState(accommodation.latitude);
  const [lng, setLng] = useState(accommodation.longitude);
  const [checkIn, setCheckIn] = useState(accommodation.check_in);
  const [checkOut, setCheckOut] = useState(accommodation.check_out);

  useEffect(() => {
    setHotelName(accommodation.hotel_name);
    setLat(accommodation.latitude);
    setLng(accommodation.longitude);
    setCheckIn(accommodation.check_in);
    setCheckOut(accommodation.check_out);
  }, [accommodation, isOpen]);

  if (!isOpen) return null;

  const handlePlaceSelect = (selectedName: string, selectedLat: number, selectedLng: number) => {
    setHotelName(selectedName);
    setLat(selectedLat);
    setLng(selectedLng);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: accommodation.id,
      hotel_name: hotelName,
      latitude: lat,
      longitude: lng,
      check_in: checkIn,
      check_out: checkOut,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>숙소 정보 설정</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Google Places Hotel Search Bar */}
          <div className="form-group">
            <label>숙소 검색 (구글맵 / 숙소 자동 완성)</label>
            <PlaceSearchInput
              initialName={hotelName}
              placeholder="숙소명을 입력해 검색하세요 (예: 신라호텔, 하얏트 도쿄)"
              onPlaceSelect={handlePlaceSelect}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>체크인 시간 (check_in)</label>
              <input
                type="text"
                placeholder="15:00"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>체크아웃 시간 (check_out)</label>
              <input
                type="text"
                placeholder="10:00"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Save size={16} />
            <span>숙소 정보 저장</span>
          </button>
        </form>
      </div>
    </div>
  );
};
