import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface PlaceSearchInputProps {
  initialName?: string;
  placeholder?: string;
  onPlaceSelect: (placeName: string, lat: number, lng: number) => void;
}

type ApiStatus = 'LOADING' | 'READY' | 'ERROR';

export const PlaceSearchInput: React.FC<PlaceSearchInputProps> = ({
  initialName = '',
  placeholder = '해외/국내 장소 검색 (예: 도쿄 디즈니랜드, 방콕 호텔)',
  onPlaceSelect,
}) => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('LOADING');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null); // Google Maps Autocomplete instance
  const [inputValue, setInputValue] = useState(initialName);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkGoogleApi = () => {
      // @ts-ignore
      if (window.google && window.google.maps && window.google.maps.places) {
        setApiStatus('READY');
        clearInterval(intervalId);
        initAutocomplete();
      } else {
        const scriptTags = document.querySelectorAll('script');
        let hasScript = false;
        scriptTags.forEach((s) => {
          if (s.src.includes('maps.googleapis.com')) hasScript = true;
        });
        if (!hasScript) {
          setApiStatus('ERROR');
          clearInterval(intervalId);
        }
      }
    };

    // Polling until API loads
    intervalId = setInterval(checkGoogleApi, 500);

    // Timeout after 10 seconds
    const timeoutId = setTimeout(() => {
      if (apiStatus === 'LOADING') {
        clearInterval(intervalId);
        setApiStatus('ERROR');
      }
    }, 10000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      if (autocompleteRef.current) {
        // @ts-ignore
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current) return;

    // 사용자 요청: 위치 편향(Location Bias), bounds, strictBounds 등 무효화. 글로벌 검색.
    // @ts-ignore
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address'],
      // types: [] 비워두거나 생략하면 모든 장소가 검색 대상이 됨
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      console.log('✨ [Google Places API] Place Selected:', place);

      if (!place.geometry || !place.geometry.location) {
        console.warn('선택한 장소의 좌표 데이터가 없습니다.');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const name = place.name || place.formatted_address || '알 수 없는 장소';

      setInputValue(name);
      onPlaceSelect(name, lat, lng);
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* API Loading Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
        {apiStatus === 'LOADING' && (
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Loader2 size={12} className="animate-spin" /> 지도 로딩 중...
          </span>
        )}
        {apiStatus === 'READY' && (
          <span style={{ color: '#10b981' }}>검색 준비 완료 🟢</span>
        )}
        {apiStatus === 'ERROR' && (
          <span style={{ color: '#ef4444' }}>API 키 누락/로딩 실패 🔴</span>
        )}
      </div>

      {/* Input Field Binded to Autocomplete */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={apiStatus === 'READY' ? placeholder : 'API 연결을 기다리고 있습니다...'}
          disabled={apiStatus !== 'READY'}
          style={{
            width: '100%',
            paddingRight: '36px',
            background: apiStatus === 'READY' ? '#1e293b' : 'rgba(30, 41, 59, 0.5)',
            border: apiStatus === 'READY' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: apiStatus === 'READY' ? '#f8fafc' : '#94a3b8',
            fontSize: '0.82rem',
            padding: '8px 36px 8px 12px',
            cursor: apiStatus === 'READY' ? 'text' : 'not-allowed'
          }}
          required
        />
        <div style={{ position: 'absolute', right: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          {apiStatus === 'LOADING' ? <Loader2 size={16} className="animate-spin text-cyan-400" /> : <Search size={16} />}
        </div>
      </div>
    </div>
  );
};
