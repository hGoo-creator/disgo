import { MyPlace, Accommodation, TripSettings, TimelineItem, MultiDayTimelineResult } from '../types';

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function addMinutesToTime(timeStr: string, minsToAdd: number): string {
  const [hStr, mStr] = timeStr.split(':');
  let hours = parseInt(hStr, 10);
  let mins = parseInt(mStr, 10) + minsToAdd;

  hours += Math.floor(mins / 60);
  mins = mins % 60;
  hours = hours % 24;

  const hh = hours.toString().padStart(2, '0');
  const mm = mins.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function getSuggestedDurationText(placeCount: number): string {
  if (placeCount === 0) return '';
  if (placeCount <= 4) return '💡 1일 (당일치기 알찬 여행)';
  const nights = Math.ceil(placeCount / 4) - 1;
  const days = Math.ceil(placeCount / 4);
  return `💡 ${nights}박 ${days}일 여행을 추천합니다! (${placeCount}개 장소)`;
}

export function generateSingleDayTimeline(
  places: MyPlace[],
  accommodation: Accommodation,
  settings: TripSettings,
  dayNum: number = 1
): TimelineItem[] {
  if (places.length === 0) return [];

  let orderedPlaces: MyPlace[] = [];
  
  // 만약 장소들에 사용자가 직접 지정한 순서(order)가 하나라도 있다면 그 순서를 우선 따름 (새 장소는 맨 끝으로)
  const someOrdered = places.some(p => p.order !== undefined);
  
  if (someOrdered) {
    orderedPlaces = [...places].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : Infinity;
      const orderB = b.order !== undefined ? b.order : Infinity;
      return orderA - orderB;
    });
  } else {
    // TSP (Nearest Neighbor) 알고리즘
    const unvisited = [...places];
    let currLat = accommodation.latitude;
    let currLng = accommodation.longitude;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const dist = calculateDistance(currLat, currLng, unvisited[i].latitude, unvisited[i].longitude);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      const nextPlace = unvisited.splice(nearestIdx, 1)[0];
      orderedPlaces.push(nextPlace);
      currLat = nextPlace.latitude;
      currLng = nextPlace.longitude;
    }
  }

  const timelineItems: TimelineItem[] = [];
  let currentTime = accommodation.check_out || '10:00';

  // Accommodation Start Step (Loop start)
  timelineItems.push({
    id: `acc-start-day${dayNum}`,
    type: 'accommodation',
    time: currentTime,
    title: `${accommodation.hotel_name} (출발)`,
    category: '숙소',
    lat: accommodation.latitude,
    lng: accommodation.longitude,
    stepNumber: 0,
    transitMode: settings.transport,
    dayNumber: dayNum,
  });

  let prevLat = accommodation.latitude;
  let prevLng = accommodation.longitude;
  let stepCounter = 1;

  for (let i = 0; i < orderedPlaces.length; i++) {
    const place = orderedPlaces[i];
    const dist = calculateDistance(prevLat, prevLng, place.latitude, place.longitude);

    let transitMins = 5;
    if (settings.transport === '도보') {
      transitMins = Math.max(5, Math.round(dist * 14));
    } else if (settings.transport === '대중교통') {
      transitMins = Math.max(8, Math.round(dist * 3 + 8));
    } else if (settings.transport === '차량') {
      transitMins = Math.max(5, Math.round(dist * 2 + 4));
    }

    currentTime = addMinutesToTime(currentTime, transitMins);

    // Conditional Warning Card: ONLY visible when transport === '도보' AND distance >= 1.2km
    if (settings.transport === '도보' && dist >= 1.2) {
      timelineItems.push({
        id: `warning-day${dayNum}-${i}`,
        type: 'transit_warning',
        time: currentTime,
        title: '🚌 대중교통/🚲 자전거 추천 (이동 거리 경고)',
        distanceKm: dist,
        warningText: `이동 거리 ${dist}km (도보 약 ${transitMins}분 소요). 대중교통이나 따릉이/자전거 이용을 권장합니다!`,
        dayNumber: dayNum,
      });
    }

    // Vehicle Parking Hint
    const parkingHint = settings.transport === '차량'
      ? (place.category === '식당' ? '🅿️ 매장 고객 전용 주차장 이용 가능' : '🅿️ 근처 공영/노상 주차장 무인 결제 힌트 제공')
      : undefined;

    timelineItems.push({
      id: place.id,
      type: 'place',
      time: currentTime,
      title: place.place_name,
      category: place.category,
      stay_time: place.stay_time,
      cost: place.cost,
      lat: place.latitude,
      lng: place.longitude,
      stepNumber: stepCounter++,
      transitMode: settings.transport,
      warningText: parkingHint,
      dayNumber: dayNum,
      isShared: place.isShared,
    });

    currentTime = addMinutesToTime(currentTime, place.stay_time);
    prevLat = place.latitude;
    prevLng = place.longitude;
  }

  // Return to Accommodation (Loop end)
  const finalDist = calculateDistance(prevLat, prevLng, accommodation.latitude, accommodation.longitude);
  let finalTransit = 10;
  if (settings.transport === '도보') {
    finalTransit = Math.round(finalDist * 14);
  } else if (settings.transport === '대중교통') {
    finalTransit = Math.round(finalDist * 3 + 8);
  } else {
    finalTransit = Math.round(finalDist * 2 + 4);
  }

  currentTime = addMinutesToTime(currentTime, finalTransit);

  timelineItems.push({
    id: `acc-end-day${dayNum}`,
    type: 'accommodation',
    time: currentTime,
    title: `${accommodation.hotel_name} (복귀)`,
    category: '숙소',
    lat: accommodation.latitude,
    lng: accommodation.longitude,
    stepNumber: stepCounter,
    transitMode: settings.transport,
    dayNumber: dayNum,
  });

  return timelineItems;
}

export function generateMultiDayTimeline(
  places: MyPlace[],
  accommodation: Accommodation | null,
  settings: TripSettings
): MultiDayTimelineResult {
  if (places.length === 0 || !accommodation) {
    return {
      totalDays: 1,
      suggestedDurationText: getSuggestedDurationText(places.length),
      dayTimelines: { 1: [] },
    };
  }

  // 사용자가 명시적으로 dayNumber를 지정한 경우 그 일자에 할당, 없으면 자동 분배
  const maxDayAssigned = Math.max(1, ...places.map(p => p.dayNumber || 1));
  const placesPerDay = 4;
  const autoTotalDays = Math.max(1, Math.ceil(places.length / placesPerDay));
  const totalDays = Math.max(maxDayAssigned, autoTotalDays);
  
  const suggestedDurationText = getSuggestedDurationText(places.length);

  const dayTimelines: Record<number, TimelineItem[]> = {};

  for (let d = 1; d <= totalDays; d++) {
    // 1. dayNumber가 명시된 장소 필터링
    let dayPlaces = places.filter(p => p.dayNumber === d);
    
    // 2. 만약 하나도 명시되지 않은 기존 방식이라면, 4개씩 분할 (호환성)
    if (places.every(p => !p.dayNumber)) {
      const startIndex = (d - 1) * placesPerDay;
      dayPlaces = places.slice(startIndex, startIndex + placesPerDay);
    }

    if (dayPlaces.length > 0) {
      dayTimelines[d] = generateSingleDayTimeline(dayPlaces, accommodation, settings, d);
    } else {
      dayTimelines[d] = [];
    }
  }

  return {
    totalDays,
    suggestedDurationText,
    dayTimelines,
  };
}
