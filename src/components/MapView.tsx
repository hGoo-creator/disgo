import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { TimelineItem } from '../types';
import { LocateFixed, Loader2 } from 'lucide-react';

interface MapViewProps {
  timelineItems: TimelineItem[];
}

export const MapView: React.FC<MapViewProps> = ({ timelineItems }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map with Google Maps Tile Engine
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([33.4990, 126.5312], 10);

      // Google Maps Tile Layer (Universal Domestic + International Coverage)
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data © Google',
      }).addTo(map);

      // Small zoom control bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    if (layerGroup) {
      layerGroup.clearLayers();
    }

    const validPoints = timelineItems.filter(
      (item) => item.type !== 'transit_warning' && item.lat !== undefined && item.lng !== undefined
    );

    if (validPoints.length === 0) return;

    const latLngs: [number, number][] = [];

    validPoints.forEach((item) => {
      const lat = item.lat!;
      const lng = item.lng!;
      latLngs.push([lat, lng]);

      const isHotel = item.category === '숙소' || item.type === 'accommodation';

      let badgeBg = '#10b981';
      let categoryIcon = '📍';

      if (isHotel) {
        badgeBg = '#06b6d4';
        categoryIcon = '🏨';
      } else if (item.category === '식당') {
        badgeBg = '#ef4444';
        categoryIcon = '🍔';
      } else if (item.category === '카페') {
        badgeBg = '#f59e0b';
        categoryIcon = '☕';
      } else if (item.category === '명소') {
        badgeBg = '#3b82f6';
        categoryIcon = '🏰';
      } else if (item.category === '간식') {
        badgeBg = '#a855f7';
        categoryIcon = '🍡';
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="
            background-color: ${badgeBg};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            position: relative;
          ">
            ${categoryIcon}
            ${
              item.stepNumber
                ? `<span style="
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: #0f172a;
                    color: #f8fafc;
                    border: 1px solid ${badgeBg};
                    border-radius: 999px;
                    font-size: 10px;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">${item.stepNumber}</span>`
                : ''
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; text-align: center;">
          <strong style="font-size: 14px; color: #0f172a;">${item.title}</strong><br/>
          <span style="font-size: 12px; color: #64748b;">${item.time} ${item.stay_time ? `(${item.stay_time}분 체류)` : ''}</span>
        </div>
      `;
      marker.bindPopup(popupContent);

      if (layerGroup) {
        marker.addTo(layerGroup);
      }
    });

    if (latLngs.length > 1 && layerGroup) {
      const polyline = L.polyline(latLngs, {
        color: '#10b981',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
      });
      polyline.addTo(layerGroup);
    }

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [35, 35] });
    }
  }, [timelineItems]);

  // Action: Fetch real-time GPS coordinates & Pan map center
  const handleGoToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 현재위치 GPS 기능을 지원하지 않습니다.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, {
            animate: true,
            duration: 1.2,
          });

          if (userMarkerRef.current && layerGroupRef.current) {
            layerGroupRef.current.removeLayer(userMarkerRef.current);
          }

          const userGpsIcon = L.divIcon({
            className: 'user-gps-pulse-pin',
            html: `
              <div style="
                background: #3b82f6;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 16px rgba(59, 130, 246, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: gps-pulse 1.8s infinite;
              ">
                <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

          const userMarker = L.marker([latitude, longitude], { icon: userGpsIcon }).bindPopup('📍 현재 내 위치');

          if (layerGroupRef.current) {
            userMarker.addTo(layerGroupRef.current);
            userMarker.openPopup();
          }
          userMarkerRef.current = userMarker;
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        alert('현재 위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해 주세요.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="map-view-container">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating GPS Current Location Button (Bottom Right) */}
      <button
        type="button"
        onClick={handleGoToCurrentLocation}
        disabled={isLocating}
        className="map-gps-btn"
        title="현재위치로 이동"
      >
        {isLocating ? (
          <Loader2 size={16} className="animate-spin text-cyan-400" />
        ) : (
          <LocateFixed size={16} />
        )}
      </button>
    </div>
  );
};
