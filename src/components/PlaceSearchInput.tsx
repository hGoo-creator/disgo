import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Check, Loader2 } from 'lucide-react';

export interface PlaceSearchResult {
  display_name: string;
  name: string;
  lat: number;
  lng: number;
}

interface PlaceSearchInputProps {
  initialName?: string;
  placeholder?: string;
  onPlaceSelect: (placeName: string, lat: number, lng: number) => void;
}

// Pre-seeded popular spots for instant offline / fast suggestions
const PRESET_PLACES: PlaceSearchResult[] = [
  // 제주
  { name: '은희네해장국 본점', display_name: '제주특별자치도 제주시 고성8길 1', lat: 33.5065, lng: 126.5401 },
  { name: '울트라 드립 카페', display_name: '제주특별자치도 제주시 관덕로 15', lat: 33.4990, lng: 126.5312 },
  { name: '함덕 해수욕장 & 오름', display_name: '제주특별자치도 제주시 조천읍 함덕리', lat: 33.5432, lng: 126.6690 },
  { name: '흑돼지 구이 명가', display_name: '제주특별자치도 제주시 노형동', lat: 33.5180, lng: 126.5290 },
  { name: '동문시장 오메기떡', display_name: '제주특별자치도 제주시 동문로 16', lat: 33.5126, lng: 126.5284 },
  { name: '신라호텔 제주', display_name: '제주특별자치도 서귀포시 중문관광로72번길 75', lat: 33.2475, lng: 126.4078 },
  { name: '성산일출봉', display_name: '제주특별자치도 서귀포시 성산읍 성산리 1', lat: 33.4581, lng: 126.9426 },
  { name: '협재 해수욕장', display_name: '제주특별자치도 제주시 한림읍 협재리 2497-1', lat: 33.3938, lng: 126.2396 },
  // 서울
  { name: 'N서울타워 (남산타워)', display_name: '서울특별시 용산구 남산공원길 105', lat: 37.5512, lng: 126.9882 },
  { name: '경복궁', display_name: '서울특별시 종로구 사직로 161', lat: 37.5796, lng: 126.9770 },
  { name: '성수동 블루보틀', display_name: '서울특별시 성동구 아차산로 7', lat: 37.5453, lng: 127.0441 },
  { name: '신라호텔 서울', display_name: '서울특별시 중구 동호로 249', lat: 37.5562, lng: 127.0053 },
  // 도쿄
  { name: '하얏트 리젠시 도쿄', display_name: 'Shinjuku City, Tokyo, Japan', lat: 35.6905, lng: 139.6917 },
  { name: '이치란 라멘 신주쿠점', display_name: 'Shinjuku, Tokyo, Japan', lat: 35.6918, lng: 139.7020 },
  { name: '블루보틀 카페 신주쿠', display_name: 'Shinjuku, Tokyo, Japan', lat: 35.6888, lng: 139.7042 },
  { name: '신주쿠 교엔 정원', display_name: 'Shinjuku, Tokyo, Japan', lat: 35.6852, lng: 139.7101 },
  { name: '긴자 규카츠 모토무라', display_name: 'Chuo City, Tokyo, Japan', lat: 35.6712, lng: 139.7650 },
  { name: '도쿄 타워 전망대', display_name: 'Minato City, Tokyo, Japan', lat: 35.6586, lng: 139.7454 },
];

export const PlaceSearchInput: React.FC<PlaceSearchInputProps> = ({
  initialName = '',
  placeholder = '장소 또는 숙소 이름 검색 (예: 제주 은희네해장국, 도쿄타워)',
  onPlaceSelect,
}) => {
  const [query, setQuery] = useState(initialName);
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [apiError, setApiError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic combining instant preset match + OpenStreetMap Nominatim Geocoding API
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const trimmed = query.trim().toLowerCase();

    // 1. Filter local presets
    const matchedPresets = PRESET_PLACES.filter(
      (p) => p.name.toLowerCase().includes(trimmed) || p.display_name.toLowerCase().includes(trimmed)
    );

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ko`
        );
        const data = await response.json();

        const apiResults: PlaceSearchResult[] = data.map((item: any) => ({
          name: item.display_name.split(',')[0] || item.name || query,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));

        // Combine preset matches with online geocoding results (deduplicated)
        const combined = [...matchedPresets];
        apiResults.forEach((apiItem) => {
          if (!combined.some((c) => Math.abs(c.lat - apiItem.lat) < 0.001 && Math.abs(c.lng - apiItem.lng) < 0.001)) {
            combined.push(apiItem);
          }
        });

        setSuggestions(combined.slice(0, 6));
        setIsOpen(true);
        setApiError(false);
      } catch (err) {
        console.error("Place search API error:", err);
        setApiError(true);
        // Fallback to presets if network fetch fails
        setSuggestions(matchedPresets.slice(0, 5));
        setIsOpen(matchedPresets.length > 0);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place: PlaceSearchResult) => {
    setQuery(place.name);
    setSelectedPlace(place);
    setIsOpen(false);
    onPlaceSelect(place.name, place.lat, place.lng);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedPlace(null);
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            paddingRight: '36px',
            background: '#1e293b',
            border: selectedPlace ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '0.82rem',
            padding: '8px 36px 8px 12px',
          }}
          required
        />
        <div style={{ position: 'absolute', right: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          {isLoading ? <Loader2 size={16} className="animate-spin text-cyan-400" /> : <Search size={16} />}
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8)',
          }}
        >
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(item)}
              style={{
                padding: '8px 12px',
                borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} className="text-emerald-400 shrink-0" />
                <span>{item.name}</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.display_name}
              </div>
              <div style={{ fontSize: '0.64rem', color: '#38bdf8', marginTop: '2px', fontFamily: 'monospace' }}>
                위도: {item.lat.toFixed(4)}, 경도: {item.lng.toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      )}

      {apiError && (
        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>
          ⚠️ Google Maps API Key를 Vercel에 설정해 주세요.
        </div>
      )}

      {/* Selected Coordinates Status Badge */}
      {selectedPlace && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '0.7rem',
            color: '#34d399',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Check size={13} />
          <span>
            위도·경도 자동 저장: <strong>{selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
