// git test

////////////////////////
// 카카오 맵 컴포넌트
////////////////////////

"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import {
  MapPin,
  Users,
  TrendingUp,
  Store,
  BarChart3,
  Award,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp as TrendingUpIcon,
  Building2,
} from "lucide-react";
import PopulationCharts from "@/src/components/population-charts";
import TimeDayCharts from "@/src/components/time-day-charts";
import FacilityAnalysis, { FACILITY_CATEGORIES } from "@/src/components/facility-analysis";
import RankingsChart from "@/src/components/rankings-chart";
import CompetitorRankingTable from "@/src/components/competitor-ranking-table";
import PredictionTab from "@/src/components/prediction-tab";
import { generatePDFReport, generateSimplePDFReport, generateWizardPDFReport } from "@/src/utils/pdfGenerator";

interface KakaoMapProps {
  selectedDong: string | null;
  dongCenter: { lat: number; lng: number } | null;
  businessType?: string;
  wizardData?: {
    businessType: string;
    city: string;
    district: string;
    monthlyRent?: number;
    deposit?: number;
    area?: number;
  } | null;
}

interface DongRanking {
  rank: number;
  dong: string;
  score: number;
  data?: any;
}

interface MarkerData {
  lat: number;
  lng: number;
  name: string;
  address: string;
  dong?: string;
  district?: string;
  city?: string;
  exactDong?: string;
}

interface AnalysisData {
  parkingLots: number;
  schools: number;
  hospitals: number;
  touristSpots: number;
  culturalFacilities: number;
  competitors: number;
  human: string;
  sales: string;
  category: string;
  score?: string;
  subwayStations: number;
  banks: number;
  // 새로운 데이터 형식
  xValues?: {
    정규화매출효율: number;
    정규화성장률: number;
    정규화경쟁점수: number;
    작년_매출: number;
    이전_매출: number;
    작년_점포수: number;
    이전_점포수: number;
  };
  prediction2026?: any;
}

interface PopulationData {
  gender: Array<{
    성별: string;
    성별총합: number;
    '성별비율(%)': number;
  }>;
  age: Array<{
    연령대: string;
    합계: number;
  }>;
}

interface TimeDayData {
  time: Array<{
    시간대: string;
    유동인구: number;
  }>;
  day: Array<{
    요일: string;
    유동인구: number;
  }>;
}

interface FacilityData {
  name: string;
  address: string;
  distance: string;
  lat: number;
  lng: number;
  category: string;
}

export default function KakaoMap({ selectedDong, dongCenter, businessType, wizardData }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [analysisList, setAnalysisList] = useState<{ marker: MarkerData; analysis: AnalysisData }[]>([]);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentBusinessType, setCurrentBusinessType] = useState<string>("");
  const [activeTab, setActiveTab] = useState("scores");
  const [currentDongs, setCurrentDongs] = useState<Array<{ dong: string; coordinates: number[][][] }>>([]);
  const [populationData, setPopulationData] = useState<PopulationData | null>(null);
  const [timeDayData, setTimeDayData] = useState<TimeDayData | null>(null);
  const [facilityData, setFacilityData] = useState<{ [key: string]: FacilityData[] }>({});
  const reportRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState<string | null>(null);
  const [rankingOverlays, setRankingOverlays] = useState<any[]>([]); // 순위 오버레이 저장 (동 이름)
  const [dongRankings, setDongRankings] = useState<DongRanking[]>([]); // 동 순위 데이터
  const [topDongData, setTopDongData] = useState<any>(null); // 1위 동 데이터
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [rankingMarkers, setRankingMarkers] = useState<any[]>([]); // 순위 마커 저장
  const [rankingPolygons, setRankingPolygons] = useState<any[]>([]); // 순위 폴리곤 저장
  const [selectedDongForChart, setSelectedDongForChart] = useState<string>(""); // 차트용 선택된 동
  const [selectedDongForFacility, setSelectedDongForFacility] = useState<string>(""); // 시설용 선택된 동
  const [editableConditions, setEditableConditions] = useState({
    businessType: "",
    district: "",
    monthlyRent: 0,
    deposit: 0,
    area: 0,
  }); // 편집 가능한 조건

  // 업종 타입 설정
  useEffect(() => {
    if (businessType) setCurrentBusinessType(businessType);
  }, [businessType]);

  // 카카오 맵 스크립트 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && window.kakao?.maps && !isScriptLoaded) {
      window.kakao.maps.load(() => setIsScriptLoaded(true));
    }
  }, [isScriptLoaded]);

  // 유동인구 데이터 로드
  const loadPopulationData = async (dongName: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/population-data`, {
        dongName: dongName,
      });

      console.log("populationData:", response.data);
      
      if (response.data) {
        setPopulationData(response.data);
      } else {
        console.warn(`유동인구 데이터를 찾을 수 없습니다: ${dongName}`);
        setPopulationData(null);
      }
    } catch (error) {
      console.error('유동인구 데이터 로드 실패:', error);
      setPopulationData(null);
    }
  };

  // 시간대/요일 유동인구 데이터 로드
  const loadTimeDayData = async (dongName: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/time-day-data`, {
        dongName: dongName,
      });

      console.log("timeDayData:", response.data);
      
      if (response.data) {
        setTimeDayData(response.data);
      } else {
        console.warn(`시간대/요일 유동인구 데이터를 찾을 수 없습니다: ${dongName}`);
        setTimeDayData(null);
      }
    } catch (error) {
      console.error('시간대/요일 유동인구 데이터 로드 실패:', error);
      setTimeDayData(null);
    }
  };

  // 시설 검색
  const searchFacilities = async () => {
    if (!map || !selectedMarker) return;

    setIsLoadingFacilities(true);

    const { kakao } = window;
    const ps = new kakao.maps.services.Places();
    const position = new kakao.maps.LatLng(selectedMarker.lat, selectedMarker.lng);
    
    const allFacilities: { [key: string]: FacilityData[] } = {};

    // 각 카테고리별 시설 검색
    const searchPromises = FACILITY_CATEGORIES.map((category) => {
      return new Promise<void>((resolve) => {
        ps.categorySearch(
          category.code,
          (data: any, status: any) => {
            if (status === kakao.maps.services.Status.OK) {
              allFacilities[category.name] = data.map((place: any) => ({
                name: place.place_name,
                address: place.address_name,
                distance: place.distance ? `${place.distance}m` : '-',
                lat: parseFloat(place.y),
                lng: parseFloat(place.x),
                category: category.name
              }));
            }
            resolve();
          },
          { location: position, radius: 500, size: 5 }
        );
      });
    });

    await Promise.all(searchPromises);

    setFacilityData(allFacilities);
    setIsLoadingFacilities(false);
  };

  // 특정 카테고리 시설만 필터링 (모달에서만 표시)
  const filterFacilityMarkers = (categoryName: string | null) => {
    setSelectedFacilityCategory(categoryName);
  };

  // 점이 폴리곤 내부에 있는지 확인 (주석 처리 - 사용 안 함)
  // const isPointInPolygon = (lat: number, lng: number, coordinates: number[][][]) => {
  //   const point = { x: lng, y: lat };
  //   const polygon = coordinates[0];
  //   
  //   let inside = false;
  //   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
  //     const xi = polygon[i][0], yi = polygon[i][1];
  //     const xj = polygon[j][0], yj = polygon[j][1];
  //     
  //     const intersect = ((yi > point.y) !== (yj > point.y))
  //         && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
  //     if (intersect) inside = !inside;
  //   }
  //   return inside;
  // };

  // 주소에서 시/구/동 추출
  const parseAddress = (address: string) => {
    const parts = address.split(" ");
    let city = "", district = "", dong = "";
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.includes("특별시")) {
        city = part.replace("특별시", "").trim();
      } else if (part.includes("광역시")) {
        city = part.replace("광역시", "").trim();
      } else if (part.endsWith("시")) {
        city = part.replace(/시$/g, "").trim();
      } else if (part.endsWith("도")) {
        city = part.replace(/도$/g, "").trim();
      } else if (i === 0 && (part === "서울" || part === "부산" || part === "대구" || part === "인천" || part === "광주" || part === "대전" || part === "울산" || part === "세종")) {
        city = part;
      }
      
      if (part.endsWith("구") && part !== "구") {
        district = part.replace(/구$/g, "").trim();
      } else if (part.endsWith("군")) {
        district = part.replace(/군$/g, "").trim();
      }
      
      if (part.endsWith("동") && part !== "동") {
        dong = part.replace(/동$/g, "").trim();
        break;
      } else if (part.endsWith("읍")) {
        dong = part.replace(/읍$/g, "").trim();
        break;
      } else if (part.endsWith("면")) {
        dong = part.replace(/면$/g, "").trim();
        break;
      }
    }
    
    return { city, district, dong };
  };

  // 마커 생성
  const createMarker = (latlng: any, createdMap: any) => {
    const { kakao } = window;
    const imageSrc = "/marker-basic.png";
    const imageSize = new kakao.maps.Size(40, 50);
    const imageOption = { offset: new kakao.maps.Point(12, 35) };
    const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

    return new kakao.maps.Marker({
      map: createdMap,
      position: latlng,
      image: markerImage,
    });
  };

  // 시설 분석
  const searchNearbyPlaces = (position: any) => {
    const { kakao } = window;
    const ps = new kakao.maps.services.Places();
  
    const countCategory = (category: string) =>
      new Promise<number>((resolve) => {
        ps.categorySearch(
          category,
          (data: any, status: any) =>
            resolve(status === kakao.maps.services.Status.OK ? data.length : 0),
          { location: position, radius: 300 }
        );
      });
  
    return Promise.all([
      countCategory("SW8"), countCategory("PK6"), countCategory("BK9"),
      countCategory("SC4"), countCategory("HP8"), countCategory("AT4"), countCategory("CT1"),
    ]).then(([subwayStations, parkingLots, banks, schools, hospitals, touristSpots, culturalFacilities]) => ({
      subwayStations, parkingLots, banks, schools, hospitals, touristSpots, culturalFacilities,
    }));
  };

  // 정확한 동 이름 찾기 (주석 처리 - 폴리곤 클릭 기능 비활성화)
  // const findExactDong = async (lat: number, lng: number, city: string, district: string) => {
  //   try {
  //     const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
  //       city, district,
  //     });
  //     
  //     if (res.data?.dongs) {
  //       for (const dongData of res.data.dongs) {
  //         if (dongData.coordinates?.[0] && isPointInPolygon(lat, lng, dongData.coordinates)) {
  //           const exactDongName = dongData.dong.replace(/동$/, "");
  //           return exactDongName;
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     console.error("정확한 동 찾기 실패:", err);
  //   }
  //   return null;
  // };

  // 지도 클릭 핸들러 (wizardData가 있을 때는 비활성화)
  const handleMapClick = async (mouseEvent: any, createdMap: any) => {
    // wizardData가 있으면 핀 선택 기능 비활성화
    if (wizardData) return;
    
    const { kakao } = window;
    const latlng = mouseEvent.latLng;
    const lat = latlng.getLat();
    const lng = latlng.getLng();

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, async (result: any, status: any) => {
      if (status !== kakao.maps.services.Status.OK) return;
      
      const address = result[0].address.address_name;
      const roadName = result[0].road_address?.building_name || address;
      const parsedAddress = parseAddress(address);
      const { city, district, dong } = parsedAddress;

      // 기존 마커 제거
      setMarkers((prev) => {
        prev.forEach((m) => m.setMap(null));
        return [];
      });
      // 기존 오버레이 제거
      rankingOverlays.forEach(overlay => {
        try {
          overlay.setMap(null);
        } catch (e) {}
      });
      setRankingOverlays([]);
      setFacilityData({});

      // 새 마커 생성
      const marker = createMarker(latlng, createdMap);
      setMarkers([marker]);

      // 정확한 동 이름 찾기 (주석 처리 - 폴리곤 클릭 기능 비활성화)
      let exactDong = dong;
      // if (city && city.trim() !== "" && district && district.trim() !== "") {
      //   const foundDong = await findExactDong(lat, lng, city, district);
      //   if (foundDong) {
      //     exactDong = foundDong;
      //   }
      // }

      const markerData: MarkerData = {
        lat, lng, name: roadName, address, dong, district, city,
        exactDong: exactDong || dong,
      };
      
      setSelectedMarker(markerData);

      // 유동인구 데이터 로드
      if (exactDong) {
        await Promise.all([
          loadPopulationData(exactDong),
          loadTimeDayData(exactDong)
        ]);
      }

      // 마커 인포윈도우
      const infoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:3px;font-size:12px;font-weight:bold;">${exactDong ? exactDong + '동' : dong ? dong + '동' : address}</div>`,
        removable: false,
      });

      kakao.maps.event.addListener(marker, 'mouseover', () => infoWindow.open(createdMap, marker));
      kakao.maps.event.addListener(marker, 'mouseout', () => infoWindow.close());

      try {
        // 업종 타입 매핑 (businessType -> API type)
        const typeMap: { [key: string]: string } = {
          "카페": "cafe",
          "한식": "korean",
          "호프": "hof",
          "cafe": "cafe",
          "korean": "korean",
          "hof": "hof"
        };
        const apiType = typeMap[currentBusinessType] || "cafe";
        
        // 동 이름 정규화 (동 제거)
        const dongNameForApi = (exactDong || dong || "").replace(/동$/, "");
        
        const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000';
        const [scoreRes, facilityRes, predictionRes] = await Promise.all([
          axios.get(`${flaskUrl}/score`, {
            params: {
              dong: dongNameForApi,
              type: apiType
            }
          }),
          searchNearbyPlaces(latlng),
          // 2026년 예측 데이터도 함께 가져오기
          axios.get(`${flaskUrl}/api/predict`, {
            params: {
              gu: district ? `${district}구` : undefined,
              dong: dongNameForApi ? `${dongNameForApi}동` : undefined,
              start_year: 2026,
              start_quarter: 1,
              n_steps: 2
            }
          }).catch(() => null) // 예측 실패해도 계속 진행
        ]);
        
        const xValues = scoreRes.data["X값"] || {};
        const prediction2026 = predictionRes?.data?.predictions || [];
        
        // 유동인구 데이터에서 가져오기 (populationData가 있으면 사용)
        let humanValue = "데이터 없음";
        if (populationData && populationData.gender) {
          const totalHuman = populationData.gender.reduce((sum: number, item: any) => sum + (item.성별총합 || 0), 0);
          humanValue = `${(totalHuman / 1000).toFixed(1)}k명`;
        }
        
        const newAnalysis: AnalysisData = {
          ...facilityRes,
          competitors: xValues.작년_점포수 || 0,
          human: humanValue,
          sales: `${(xValues.작년_매출 / 10000).toFixed(1)}만원`,
          category: currentBusinessType || "미분류",
          score: scoreRes.data.score?.toFixed(1) || "0.0",
          xValues: {
            정규화매출효율: xValues.정규화매출효율 || 0,
            정규화성장률: xValues.정규화성장률 || 0,
            정규화경쟁점수: xValues.정규화경쟁점수 || 0,
            작년_매출: xValues.작년_매출 || 0,
            이전_매출: xValues.이전_매출 || 0,
            작년_점포수: xValues.작년_점포수 || 0,
            이전_점포수: xValues.이전_점포수 || 0
          },
          prediction2026: prediction2026
        };
      
        setAnalysisList([{ marker: markerData, analysis: newAnalysis }]);
        
        // 순위 데이터 가져와서 1,2,3위 오버레이 마커 표시
        await displayRankingOverlays(createdMap, district, exactDong || dong);
      } catch (err) {
        console.error("분석 오류:", err);
      }
    });
  };
  
  // 순위 오버레이 마커 표시 함수
  const displayRankingOverlays = async (createdMap: any, district?: string, dongName?: string) => {
    if (!map || !createdMap) return;
    
    const { kakao } = window;
    
    // 기존 오버레이 제거
    rankingOverlays.forEach(overlay => {
      try {
        overlay.setMap(null);
      } catch (e) {}
    });
    setRankingOverlays([]);
    
    try {
      // 순위 데이터 가져오기 (점수 기반)
      const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000';
      const typeMap: { [key: string]: string } = {
        "카페": "cafe",
        "한식": "korean",
        "호프": "hof",
        "cafe": "cafe",
        "korean": "korean",
        "hof": "hof"
      };
      const apiType = typeMap[currentBusinessType] || "cafe";
      
      const params: any = {
        type: apiType,
        limit: 10
      };
      
      if (district) {
        params.gu = district + '구';
      }
      
      const response = await axios.get(`${flaskUrl}/api/rankings`, { params });
      console.log("📍 순위 데이터 (오버레이용):", response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // 1,2,3위만 필터링
        const top3 = response.data.data.slice(0, 3).map((item: any) => ({
          rank: item.rank || 1,
          district: (item.district || '').replace(/구$/, ''),
          dong: (item.dong || '').replace(/동$/, ''),
          score: item.score || item.changeRate || 0
        }));
        
        // 각 동의 좌표 가져오기
        const geocoder = new kakao.maps.services.Geocoder();
        const overlays: any[] = [];
        
        // Promise로 변환하여 순차 처리
        const overlayPromises = top3.map((item: { rank: number; district: string; dong: string; score: number }) => {
          return new Promise<void>((resolve) => {
            try {
              const address = `${item.district}구 ${item.dong}동`;
              geocoder.addressSearch(address, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                  const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                  
                  // 커스텀 오버레이 생성
                  const content = `
                    <div style="
                      padding: 8px 12px;
                      background: ${item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32'};
                      color: white;
                      border-radius: 20px;
                      font-size: 12px;
                      font-weight: bold;
                      white-space: nowrap;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      text-align: center;
                    ">
                      <div>${item.rank}위</div>
                      <div style="font-size: 10px; margin-top: 2px;">
                        ${item.score.toFixed(1)}점
                      </div>
                    </div>
                  `;
                  
                  const customOverlay = new kakao.maps.CustomOverlay({
                    position: coords,
                    content: content,
                    yAnchor: 1,
                  });
                  
                  customOverlay.setMap(createdMap);
                  overlays.push(customOverlay);
                } else {
                  console.warn(`좌표를 찾을 수 없습니다: ${address}`);
                }
                resolve();
              });
            } catch (e) {
              console.warn(`순위 오버레이 생성 실패 (${item.dong}동):`, e);
              resolve();
            }
          });
        });
        
        await Promise.all(overlayPromises);
        setRankingOverlays(overlays);
        console.log(`✅ 순위 오버레이 ${overlays.length}개 표시 완료`);
      }
    } catch (error) {
      console.warn("순위 오버레이 데이터 로드 실패:", error);
    }
  };

  // 지도 초기화
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current || map) return;
  
    try {
      const { kakao } = window;
      if (!kakao?.maps) return;
      
      const initialCenter = dongCenter?.lat && dongCenter?.lng
        ? new kakao.maps.LatLng(dongCenter.lat, dongCenter.lng)
        : new kakao.maps.LatLng(37.566535, 126.9779692);
      
      const createdMap = new kakao.maps.Map(mapRef.current, {
        center: initialCenter,
        level: 3,
      });

      setMap(createdMap);
      // 핀 선택 기능 완전 차단 (모든 경우에 클릭 이벤트 차단)
      kakao.maps.event.addListener(createdMap, "click", (e: any) => {
        e.stopPropagation();
        return false;
      });
    } catch (err) {
      console.error("지도 초기화 오류:", err);
    }
  }, [isScriptLoaded, currentBusinessType, dongCenter, map]);

  // 폴리곤 제거
  const clearAllPolygons = () => {
    if ((window as any).polygons?.length) {
      (window as any).polygons.forEach((p: any) => p.setMap(null));
      (window as any).polygons = [];
    }
  };

  // 순위 폴리곤, 마커, 오버레이 제거
  const clearRankingElements = () => {
    rankingPolygons.forEach((p: any) => {
      try {
        p.setMap(null);
      } catch (e) {}
    });
    rankingMarkers.forEach((m: any) => {
      try {
        m.setMap(null);
      } catch (e) {}
    });
    rankingOverlays.forEach((o: any) => {
      try {
        o.setMap(null);
      } catch (e) {}
    });
    setRankingPolygons([]);
    setRankingMarkers([]);
    setRankingOverlays([]);
  };

  // 상위 3개 동의 폴리곤, 마커, 오버레이 그리기 (나머지 폴리곤은 유지하고 1,2,3위만 색상 표시)
  const drawRankingPolygons = async (rankings: DongRanking[]) => {
    if (!map || !wizardData) return;
    
    const { kakao } = window;
    // 기존 순위 폴리곤만 제거 (전체 폴리곤은 유지)
    clearRankingElements();

    // 상위 3개만 처리
    const top3 = rankings.slice(0, 3);
    const polygons: any[] = [];
    const markers: any[] = [];
    const overlays: any[] = [];
    const bounds = new kakao.maps.LatLngBounds();

    // 순위별 색상 설정
    const rankColors = {
      1: { stroke: "#FFD700", fill: "#FFD700", label: "1위" }, // 금색
      2: { stroke: "#C0C0C0", fill: "#C0C0C0", label: "2위" }, // 은색
      3: { stroke: "#CD7F32", fill: "#CD7F32", label: "3위" }, // 동색
    };

    // 전체 폴리곤 데이터 가져오기
    let allDongsData: Array<{ dong: string; coordinates: number[][][] }> = [];
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
        city: wizardData?.city || "서울특별시",
        district: editableConditions.district,
      });
      if (res.data?.dongs) {
        allDongsData = res.data.dongs;
      }
    } catch (error) {
      console.error("폴리곤 데이터 가져오기 실패:", error);
      return;
    }

    // 1,2,3위 폴리곤만 색상으로 표시 (나머지 폴리곤은 이미 drawMultiplePolygons에서 그려짐)
    for (const ranking of top3) {
      try {
        const dongName = ranking.dong.replace(/동$/, "");
        const dongData = allDongsData.find((d: any) => 
          d.dong.replace(/동$/, "") === dongName || d.dong === ranking.dong
        );

        if (dongData && dongData.coordinates?.[0]) {
          const path = dongData.coordinates[0].map(([lng, lat]: number[]) => 
            new kakao.maps.LatLng(lat, lng)
          );
          const color = rankColors[ranking.rank as keyof typeof rankColors] || rankColors[3];

          // 1,2,3위 폴리곤 그리기 (색상 표시 - 나머지 폴리곤 위에 덮어씀)
          const polygon = new kakao.maps.Polygon({
            map,
            path,
            strokeWeight: 3,
            strokeColor: color.stroke,
            strokeOpacity: 0.9,
            fillColor: color.fill,
            fillOpacity: 0.3,
          });
          polygons.push(polygon);

          // 폴리곤 중심점 계산 (마커 위치)
          let centerLat = 0;
          let centerLng = 0;
          path.forEach((p: any) => {
            centerLat += p.getLat();
            centerLng += p.getLng();
            bounds.extend(p);
          });
          centerLat /= path.length;
          centerLng /= path.length;
          const center = new kakao.maps.LatLng(centerLat, centerLng);

          // 마커 생성 (기본 마커 사용)
          const imageSrc = "/marker-basic.png";
          const imageSize = new kakao.maps.Size(40, 50);
          const imageOption = { offset: new kakao.maps.Point(12, 35) };
          const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

          const marker = new kakao.maps.Marker({
            map,
            position: center,
            image: markerImage,
          });
          markers.push(marker);

          // 동 이름 오버레이
          const dongNameDisplay = ranking.dong.endsWith('동') ? ranking.dong : `${ranking.dong}동`;
          const overlayContent = `
            <div style="
              padding: 10px 14px;
              background: ${color.fill};
              color: white;
              border-radius: 18px;
              font-size: 16px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 3px 6px rgba(0,0,0,0.4);
              text-align: center;
              min-width: 80px;
            ">
              ${dongNameDisplay.replace(/동동$/, '동')}
              <div style="font-size: 12px; margin-top: 4px;">
                ${color.label} (${ranking.score.toFixed(1)}점)
              </div>
            </div>
          `;

          const customOverlay = new kakao.maps.CustomOverlay({
            position: center,
            content: overlayContent,
            yAnchor: 1.5,
          });
          customOverlay.setMap(map);
          overlays.push(customOverlay);
        }
      } catch (error) {
        console.error(`${ranking.dong} 폴리곤 그리기 실패:`, error);
      }
    }

    setRankingPolygons(polygons);
    setRankingMarkers(markers);
    setRankingOverlays(overlays);

    // 지도 범위 조정
    if (bounds && polygons.length > 0) {
      map.setBounds(bounds, 100);
    }
  };

  // 여러 폴리곤 그리기 (전체 구의 폴리곤 생성)
  const drawMultiplePolygons = (dongs: Array<{ dong: string; coordinates: number[][][] }>) => {
    const { kakao } = window;
    if (!map) return;
  
    setCurrentDongs(dongs);
    clearAllPolygons();
  
    const bounds = new kakao.maps.LatLngBounds();
    const polygons: any[] = [];
  
    // 점이 폴리곤 안에 있는지 확인하는 기능 주석 처리
    // let exactMatchDong: string | null = null;
    // if (selectedMarker?.lat && selectedMarker?.lng) {
    //   for (const dongData of dongs) {
    //     if (dongData.coordinates?.[0] && isPointInPolygon(selectedMarker.lat, selectedMarker.lng, dongData.coordinates)) {
    //       exactMatchDong = dongData.dong;
    //       break;
    //     }
    //   }
    // }
  
    dongs.forEach((dongData) => {
      if (!dongData.coordinates?.[0]) return;
      
      const path = dongData.coordinates[0].map(([lng, lat]) => new kakao.maps.LatLng(lat, lng));
      // 선택된 폴리곤 강조 기능 주석 처리
      // const isSelected = exactMatchDong === dongData.dong;
      
      const polygon = new kakao.maps.Polygon({
        map,
        path,
        strokeWeight: 2,
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        fillColor: "#4285F4",
        fillOpacity: 0.15,
      });
      
      polygons.push(polygon);
      path.forEach((p) => bounds.extend(p));
    });
  
    (window as any).polygons = polygons;
    if (polygons.length > 0) map.setBounds(bounds, 50);
  };

  // 편집 가능한 조건 초기화
  useEffect(() => {
    if (wizardData) {
      setEditableConditions({
        businessType: wizardData.businessType || "",
        district: wizardData.district || "",
        monthlyRent: wizardData.monthlyRent || 0,
        deposit: wizardData.deposit || 0,
        area: wizardData.area || 0,
      });
    }
  }, [wizardData]);

  // Wizard 데이터로 predict_custom API 호출하여 동 순위 가져오기
  useEffect(() => {
    if (!editableConditions.district || !editableConditions.businessType) return;
    if (!editableConditions.monthlyRent || !editableConditions.deposit || !editableConditions.area) return;

    const fetchDongRankings = async () => {
      setIsLoadingRankings(true);
      try {
        // 업종 타입 매핑
        const typeMap: { [key: string]: string } = {
          "카페": "cafe",
          "음식점": "hansic",
          "호프/간이주점": "hof",
          "편의점": "cafe",
          "소매점": "cafe",
          "헬스장": "cafe",
        };
        const apiType = typeMap[editableConditions.businessType] || "cafe";

        // 구 이름에 "구"가 없으면 추가
        let guName = editableConditions.district;
        if (!guName.endsWith('구')) {
          guName = guName + '구';
        }

        console.log('predict_custom API 호출:', {
          url: `${process.env.NEXT_PUBLIC_FLASK_URL}/predict_custom`,
          params: {
            type: apiType,
            gu: guName,
            deposit: editableConditions.deposit,
            monthly: editableConditions.monthlyRent,
            area: editableConditions.area,
          }
        });

        const response = await axios.get(`${process.env.NEXT_PUBLIC_FLASK_URL}/predict_custom`, {
          params: {
            type: apiType,
            gu: guName,
            deposit: editableConditions.deposit,
            monthly: editableConditions.monthlyRent,
            area: editableConditions.area,
          }
        });

        console.log('predict_custom API 응답:', response.data);

        if (response.data?.top10 && Array.isArray(response.data.top10)) {
          // 상위 10개 동 순위
          const rankings: DongRanking[] = response.data.top10.map((item: any) => ({
            rank: item.rank || 1,
            dong: item.행정동명 || item.dong || '',
            score: item.예측_Y || item.predicted_Y || 0,
            data: item,
          }));
          setDongRankings(rankings);
          
          console.log('동 순위 데이터 로드 성공:', rankings);

          // 1위 동 데이터 저장 및 유동인구 데이터 로드
          if (response.data.best_dong_detail) {
            const bestDong = response.data.best_dong_detail;
            setTopDongData({
              동: bestDong.dong,
              dong: bestDong.dong,
              점수: bestDong.predicted_Y,
              score: bestDong.predicted_Y,
              매출: bestDong.매출,
              점포수: bestDong.총점포수,
              정규화매출효율: bestDong.정규화매출효율,
              정규화성장률: bestDong.정규화성장률,
              정규화경쟁밀도: bestDong.정규화경쟁밀도,
            });

            // 1위 동의 유동인구 데이터 로드 및 기본 선택
            if (bestDong.dong) {
              setSelectedDongForChart(bestDong.dong);
              setSelectedDongForFacility(bestDong.dong);
              await Promise.all([
                loadPopulationData(bestDong.dong),
                loadTimeDayData(bestDong.dong)
              ]);
              
              // 1위 동의 시설 데이터도 자동으로 로드
              if (map) {
                const cleanDongName = bestDong.dong.replace(/동$/, '');
                const address = `${editableConditions.district}구 ${cleanDongName}동`;
                
                try {
                  // 폴리곤 데이터에서 좌표 가져오기
                  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
                    city: wizardData?.city || "서울특별시",
                    district: editableConditions.district,
                  });

                  let lat = 0;
                  let lng = 0;
                  let found = false;

                  if (res.data?.dongs) {
                    const dongData = res.data.dongs.find((d: any) => 
                      d.dong.replace(/동$/, "") === cleanDongName || 
                      d.dong === cleanDongName ||
                      d.dong === bestDong.dong
                    );

                    if (dongData && dongData.coordinates?.[0]?.[0]) {
                      const firstCoord = dongData.coordinates[0][0];
                      lat = firstCoord[1];
                      lng = firstCoord[0];
                      found = true;
                    }
                  }

                  // 폴리곤 데이터에서 찾지 못한 경우 주소 검색 시도
                  if (!found) {
                    const { kakao } = window;
                    const geocoder = new kakao.maps.services.Geocoder();
                    
                    await new Promise<void>((resolve) => {
                      geocoder.addressSearch(address, (result: any, status: any) => {
                        if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                          lat = parseFloat(result[0].y);
                          lng = parseFloat(result[0].x);
                          found = true;
                        }
                        resolve();
                      });
                    });
                  }

                  if (found) {
                    const markerData: MarkerData = {
                      lat, lng, name: address, address, dong: cleanDongName, 
                      district: editableConditions.district || "", city: wizardData?.city || "",
                      exactDong: cleanDongName,
                    };
                    setSelectedMarker(markerData);
                    await searchFacilities();
                  }
                } catch (error) {
                  console.error('1위 동 시설 데이터 로드 실패:', error);
                }
              }
            }
          } else if (rankings.length > 0) {
            setTopDongData(rankings[0].data);
            if (rankings[0].dong) {
              setSelectedDongForChart(rankings[0].dong);
              setSelectedDongForFacility(rankings[0].dong);
              await Promise.all([
                loadPopulationData(rankings[0].dong),
                loadTimeDayData(rankings[0].dong)
              ]);
              
              // 1위 동의 시설 데이터도 자동으로 로드
              if (map) {
                const cleanDongName = rankings[0].dong.replace(/동$/, '');
                const address = `${editableConditions.district}구 ${cleanDongName}동`;
                
                try {
                  // 폴리곤 데이터에서 좌표 가져오기
                  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
                    city: wizardData?.city || "서울특별시",
                    district: editableConditions.district,
                  });

                  let lat = 0;
                  let lng = 0;
                  let found = false;

                  if (res.data?.dongs) {
                    const dongData = res.data.dongs.find((d: any) => 
                      d.dong.replace(/동$/, "") === cleanDongName || 
                      d.dong === cleanDongName ||
                      d.dong === rankings[0].dong
                    );

                    if (dongData && dongData.coordinates?.[0]?.[0]) {
                      const firstCoord = dongData.coordinates[0][0];
                      lat = firstCoord[1];
                      lng = firstCoord[0];
                      found = true;
                    }
                  }

                  // 폴리곤 데이터에서 찾지 못한 경우 주소 검색 시도
                  if (!found) {
                    const { kakao } = window;
                    const geocoder = new kakao.maps.services.Geocoder();
                    
                    await new Promise<void>((resolve) => {
                      geocoder.addressSearch(address, (result: any, status: any) => {
                        if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                          lat = parseFloat(result[0].y);
                          lng = parseFloat(result[0].x);
                          found = true;
                        }
                        resolve();
                      });
                    });
                  }

                  if (found) {
                    const markerData: MarkerData = {
                      lat, lng, name: address, address, dong: cleanDongName, 
                      district: editableConditions.district || "", city: wizardData?.city || "",
                      exactDong: cleanDongName,
                    };
                    setSelectedMarker(markerData);
                    await searchFacilities();
                  }
                } catch (error) {
                  console.error('1위 동 시설 데이터 로드 실패:', error);
                }
              }
            }
          }

          // 전체 구의 폴리곤 먼저 그리기
          if (map && editableConditions.district) {
            try {
              const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
                city: wizardData?.city || "서울특별시",
                district: editableConditions.district,
              });
              if (res.data?.dongs?.length > 0) {
                drawMultiplePolygons(res.data.dongs);
              }
            } catch (error) {
              console.error("전체 폴리곤 그리기 실패:", error);
            }
          }

          // 상위 3개 동의 폴리곤 그리기 (1,2,3위 색상 표시)
          if (map && rankings.length > 0) {
            await drawRankingPolygons(rankings);
          }
        }
      } catch (error: any) {
        console.error('동 순위 데이터 로드 실패:', error);
        if (error.response) {
          console.error('응답 상태:', error.response.status);
          console.error('응답 데이터:', error.response.data);
          console.error('요청 URL:', error.config?.url);
          console.error('요청 파라미터:', error.config?.params);
        } else if (error.request) {
          console.error('요청은 보냈지만 응답을 받지 못함:', error.request);
        } else {
          console.error('요청 설정 중 오류:', error.message);
        }
        setDongRankings([]);
        setTopDongData(null);
      } finally {
        setIsLoadingRankings(false);
      }
    };

    fetchDongRankings();
  }, [editableConditions, map]);

  // 시설 탭이 활성화되고 selectedDongForFacility가 있으면 시설 데이터 자동 로드
  useEffect(() => {
    if (activeTab === "facilities" && selectedDongForFacility && map && Object.keys(facilityData).length === 0 && !isLoadingFacilities) {
      const loadFacilityDataForDong = async () => {
        const dongName = selectedDongForFacility;
        const cleanDongName = dongName.replace(/동$/, '');
        const address = `${editableConditions.district}구 ${cleanDongName}동`;
        
        setIsLoadingFacilities(true);
        try {
          // 폴리곤 데이터에서 좌표 가져오기
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
            city: wizardData?.city || "서울특별시",
            district: editableConditions.district,
          });

          let lat = 0;
          let lng = 0;
          let found = false;

          if (res.data?.dongs) {
            const dongData = res.data.dongs.find((d: any) => 
              d.dong.replace(/동$/, "") === cleanDongName || 
              d.dong === cleanDongName ||
              d.dong === dongName
            );

            if (dongData && dongData.coordinates?.[0]?.[0]) {
              const firstCoord = dongData.coordinates[0][0];
              lat = firstCoord[1];
              lng = firstCoord[0];
              found = true;
            }
          }

          // 폴리곤 데이터에서 찾지 못한 경우 주소 검색 시도
          if (!found) {
            const { kakao } = window;
            const geocoder = new kakao.maps.services.Geocoder();
            
            await new Promise<void>((resolve) => {
              geocoder.addressSearch(address, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                  lat = parseFloat(result[0].y);
                  lng = parseFloat(result[0].x);
                  found = true;
                }
                resolve();
              });
            });
          }

          if (found) {
            const markerData: MarkerData = {
              lat, lng, name: address, address, dong: cleanDongName, 
              district: editableConditions.district || "", city: wizardData?.city || "",
              exactDong: cleanDongName,
            };
            setSelectedMarker(markerData);
            await searchFacilities();
          } else {
            console.error('동 좌표를 찾을 수 없습니다:', dongName);
            setIsLoadingFacilities(false);
          }
        } catch (error) {
          console.error('동 좌표 가져오기 실패:', error);
          setIsLoadingFacilities(false);
        }
      };

      loadFacilityDataForDong();
    }
  }, [activeTab, selectedDongForFacility, map, facilityData, isLoadingFacilities, editableConditions.district, wizardData?.city]);

  // selectedMarker 변경 시 폴리곤 업데이트
  useEffect(() => {
    if (map && currentDongs.length > 0) {
      drawMultiplePolygons(currentDongs);
    }
  }, [selectedMarker, map]);

  // Wizard에서 선택된 지역으로 이동 및 폴리곤 생성
  useEffect(() => {
    if (!map || !selectedDong?.trim()) return;
    
    const moveToArea = async () => {
      try {
        const parts = selectedDong.split(" ");
        const city = parts[0].replace("시", "").replace("특별시", "").trim();
        const district = parts.slice(1).join(" ").trim();
        
        if (!city) return;

        // "서울시 전체" 선택 시 처리 (district가 "서울시 전체" 또는 "전체"인 경우)
        const isSeoulAll = (city === "서울" || city === "서울특별시") && 
                          (district === "서울시 전체" || district === "전체" || selectedDong.includes("서울시 전체"));
        
        if (isSeoulAll) {
          const { kakao } = window;
          
          // 서울시 중심 좌표로 이동
          map.setCenter(new kakao.maps.LatLng(37.566535, 126.9779692));
          map.setLevel(6);
          
          // 서울시의 모든 구 목록 가져오기
          const locationRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/map/location`);
          const seoulDistricts = locationRes.data["서울특별시"] || locationRes.data["서울"] || [];
          
          // 각 구의 폴리곤 가져오기
          const allDongs: Array<{ dong: string; coordinates: number[][][] }> = [];
          
          for (const gu of seoulDistricts) {
            if (gu === "서울시 전체") continue; // "서울시 전체"는 제외
            
            try {
              const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
                city: "서울특별시",
                district: gu,
              });
              
              if (res.data?.dongs?.length > 0) {
                allDongs.push(...res.data.dongs);
              }
            } catch (err) {
              console.warn(`${gu} 폴리곤 가져오기 실패:`, err);
            }
          }
          
          if (allDongs.length > 0) {
            drawMultiplePolygons(allDongs);
          }
          return;
        }
        
        // 일반 구 선택 시 처리 - 해당 구의 폴리곤 생성
        if (!district) return;
  
        const resCenter = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/location-center`, {
          city, district,
        });
  
        const { kakao } = window;
        map.setCenter(new kakao.maps.LatLng(resCenter.data.lat, resCenter.data.lng));
        map.setLevel(5);
  
        // 해당 구의 폴리곤 생성
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
          city, district,
        });
        
        if (res.data?.dongs?.length > 0) {
          drawMultiplePolygons(res.data.dongs);
        }
      } catch (err) {
        console.error("구/동 지도 이동 실패:", err);
      }
    };
  
    moveToArea();
  }, [map, selectedDong]);

  // wizardData가 있을 때도 해당 구의 폴리곤 생성
  useEffect(() => {
    if (!map || !wizardData || !editableConditions.district) return;
    
    const loadDistrictPolygons = async () => {
      try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
          city: wizardData.city || "서울특별시",
          district: editableConditions.district,
        });
        
        if (res.data?.dongs?.length > 0) {
          drawMultiplePolygons(res.data.dongs);
        }
      } catch (err) {
        console.error("구 폴리곤 로드 실패:", err);
      }
    };
    
    loadDistrictPolygons();
  }, [map, wizardData, editableConditions.district]);


  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => window.kakao.maps.load(() => setIsScriptLoaded(true))}
      />

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-80px)]">
        <div className="flex-1 relative">
          {!isScriptLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg border z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full rounded-lg border shadow-lg" />
        </div>

        <div className="lg:w-[480px] overflow-y-auto">
          {/* Wizard 데이터가 있을 때 탭으로 표시 */}
          {wizardData ? (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-xl mb-4">
                  {editableConditions.district} 에 적합한 동 분석 결과
                </CardTitle>
                <CardDescription className="mb-4">
                  선택하신 조건에 맞는 동 순위 및 예측 정보입니다
                </CardDescription>
                
                {/* 선택한 상권 조건 표시 및 편집 */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">업종:</span>
                    <Select
                      value={editableConditions.businessType}
                      onValueChange={(value) => {
                        setEditableConditions(prev => ({ ...prev, businessType: value }));
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="카페">카페</SelectItem>
                        <SelectItem value="음식점">음식점</SelectItem>
                        <SelectItem value="호프/간이주점">호프/간이주점</SelectItem>
                        <SelectItem value="편의점">편의점</SelectItem>
                        <SelectItem value="소매점">소매점</SelectItem>
                        <SelectItem value="헬스장">헬스장</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">월세 (만원):</span>
                    <Input
                      type="number"
                      value={editableConditions.monthlyRent || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setEditableConditions(prev => ({ ...prev, monthlyRent: value }));
                      }}
                      className="w-[180px]"
                      min="0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">보증금 (만원):</span>
                    <Input
                      type="number"
                      value={editableConditions.deposit || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setEditableConditions(prev => ({ ...prev, deposit: value }));
                      }}
                      className="w-[180px]"
                      min="0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">면적 (㎡):</span>
                    <Input
                      type="number"
                      value={editableConditions.area || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setEditableConditions(prev => ({ ...prev, area: value }));
                      }}
                      className="w-[180px]"
                      min="0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">구:</span>
                    <Input
                      type="text"
                      value={editableConditions.district || ""}
                      onChange={(e) => {
                        setEditableConditions(prev => ({ ...prev, district: e.target.value }));
                      }}
                      className="w-[180px]"
                      placeholder="예: 강남구"
                      disabled
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="scores"><Award className="h-4 w-4 mr-1" />개요</TabsTrigger>
                    {/* <TabsTrigger value="prediction"><TrendingUpIcon className="h-4 w-4 mr-1" />예측</TabsTrigger> */}
                    <TabsTrigger value="charts"><BarChart3 className="h-4 w-4 mr-1" />차트</TabsTrigger>
                    <TabsTrigger value="facilities"><Store className="h-4 w-4 mr-1" />시설</TabsTrigger>
                  </TabsList>

                  {/* 개요 탭: 동 순위 표시 */}
                  <TabsContent value="scores" className="space-y-4 mt-4">
                    {isLoadingRankings ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        순위 데이터를 불러오는 중...
                      </div>
                    ) : dongRankings.length > 0 ? (
                      <>
                        <div className="text-lg font-semibold mb-2">
                          {editableConditions.district} 에 적합한 동 순위
                        </div>
                        <div className="space-y-2">
                          {dongRankings.slice(0, 5).map((ranking) => (
                            <div
                              key={ranking.rank}
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <div
                                className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm flex-shrink-0 ${
                                  ranking.rank === 1
                                    ? "bg-yellow-500 text-white"
                                    : ranking.rank === 2
                                      ? "bg-gray-400 text-white"
                                      : ranking.rank === 3
                                        ? "bg-orange-600 text-white"
                                        : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {ranking.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm">{ranking.dong}</div>
                                <div className="text-xs text-muted-foreground">
                                  점수: {ranking.score.toFixed(1)}점
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 1위 상권 정보를 개요 탭 아래에 표시 */}
                        {topDongData && (
                          <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center gap-2 mb-4">
                              <Trophy className="h-5 w-5 text-yellow-500" />
                              <CardTitle className="text-lg">
                                2025년 1위 상권: {topDongData.동 || topDongData.dong || '1위 동'}
                              </CardTitle>
                            </div>
                            <div className="text-lg font-semibold mb-4">
                              2025년 1위 상권: {topDongData.동 || topDongData.dong || '1위 동'} <span className="text-3xl font-bold text-primary">{topDongData.점수 ? topDongData.점수.toFixed(1) : topDongData.score?.toFixed(1) || '0'}</span>점
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {topDongData.매출 !== undefined && topDongData.매출 > 0 && (
                                <div className="p-3 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-4 w-4 text-secondary" />
                                    <span className="text-xs text-muted-foreground">2025년 예측 매출</span>
                                  </div>
                                  <p className="text-lg font-bold">
                                    {topDongData.매출 >= 100000000 
                                      ? `${(topDongData.매출 / 100000000).toFixed(1)}억 ${((topDongData.매출 % 100000000) / 10000).toFixed(0)}만원`
                                      : `${Math.round(topDongData.매출 / 10000)}만원`}
                                  </p>
                                </div>
                              )}
                              {topDongData.점포수 !== undefined && topDongData.점포수 > 0 && (
                                <div className="p-3 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Store className="h-4 w-4 text-accent" />
                                    <span className="text-xs text-muted-foreground">총 점포수</span>
                                  </div>
                                  <p className="text-lg font-bold">{topDongData.점포수}개</p>
                                </div>
                              )}
                              {topDongData.정규화매출효율 !== undefined && (
                                <div className="p-3 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="text-xs text-muted-foreground">정규화 매출 효율</span>
                                  </div>
                                  <p className="text-lg font-bold">{topDongData.정규화매출효율.toFixed(2)}%</p>
                                </div>
                              )}
                              {topDongData.정규화성장률 !== undefined && (
                                <div className="p-3 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="text-xs text-muted-foreground">정규화 성장률</span>
                                  </div>
                                  <p className="text-lg font-bold">{topDongData.정규화성장률.toFixed(2)}%</p>
                                </div>
                              )}
                              {topDongData.정규화경쟁밀도 !== undefined && (
                                <div className="p-3 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Store className="h-4 w-4 text-primary" />
                                    <span className="text-xs text-muted-foreground">정규화 경쟁 밀도</span>
                                  </div>
                                  <p className="text-lg font-bold">{topDongData.정규화경쟁밀도.toFixed(2)}%</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 상세리포트 다운로드 버튼 */}
                        <div className="mt-6 pt-6 border-t">
                          <Button 
                            className="w-full" 
                            size="lg"
                            onClick={async () => {
                              try {
                                if (!topDongData) {
                                  alert('1위 동 데이터가 없습니다.');
                                  return;
                                }
                                
                                await generateWizardPDFReport({
                                  businessType: editableConditions.businessType,
                                  monthlyRent: editableConditions.monthlyRent,
                                  deposit: editableConditions.deposit,
                                  area: editableConditions.area,
                                  district: editableConditions.district,
                                  city: wizardData?.city || "서울특별시",
                                  topDongData: topDongData,
                                });
                              } catch (error: any) {
                                console.error('PDF 생성 실패:', error);
                                alert(`PDF 생성에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
                              }
                            }}
                          >
                            상세리포트 다운로드
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        순위 데이터가 없습니다.
                      </div>
                    )}
                  </TabsContent>

             

                  {/* 차트 탭: 동 선택 셀렉트 박스 추가 */}
                  <TabsContent value="charts" className="space-y-6 mt-4">
                    {dongRankings.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <label className="text-sm font-medium">동 선택:</label>
                        <Select
                          value={selectedDongForChart || (topDongData?.동 || topDongData?.dong || "")}
                          onValueChange={(value) => {
                            setSelectedDongForChart(value);
                            const selectedRanking = dongRankings.find(r => r.dong === value);
                            if (selectedRanking) {
                              loadPopulationData(value);
                              loadTimeDayData(value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="동을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {dongRankings.map((ranking) => (
                              <SelectItem key={ranking.rank} value={ranking.dong}>
                                {ranking.dong} ({ranking.rank}위)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedDongForChart || topDongData?.동 || topDongData?.dong ? (
                      <>
                        <PopulationCharts populationData={populationData} />
                        <TimeDayCharts timeDayData={timeDayData} />
                      </>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        동을 선택해주세요.
                      </div>
                    )}
                  </TabsContent>

                  {/* 시설 탭 */}
                  <TabsContent value="facilities" className="space-y-4 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      * 상권분석 초기값 1위 동 기준
                    </p>
                    {dongRankings.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <label className="text-sm font-medium">동 선택:</label>
                        <Select
                          value={selectedDongForFacility || (topDongData?.동 || topDongData?.dong || "")}
                          onValueChange={async (value) => {
                            setSelectedDongForFacility(value);
                            if (value && map) {
                              setIsLoadingFacilities(true);
                              const cleanDongName = value.replace(/동$/, '');
                              const address = `${editableConditions.district}구 ${cleanDongName}동`;
                              
                              try {
                                // 먼저 폴리곤 데이터에서 좌표 가져오기 시도
                                const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/district-polygons`, {
                                  city: wizardData?.city || "서울특별시",
                                  district: editableConditions.district,
                                });

                                let lat = 0;
                                let lng = 0;
                                let found = false;

                                if (res.data?.dongs) {
                                  const dongData = res.data.dongs.find((d: any) => 
                                    d.dong.replace(/동$/, "") === cleanDongName || 
                                    d.dong === cleanDongName ||
                                    d.dong === value
                                  );

                                  if (dongData && dongData.coordinates?.[0]?.[0]) {
                                    // 폴리곤의 첫 번째 좌표 사용 (또는 중심점 계산 가능)
                                    const firstCoord = dongData.coordinates[0][0];
                                    lat = firstCoord[1]; // [lng, lat] 형식
                                    lng = firstCoord[0];
                                    found = true;
                                  }
                                }

                                // 폴리곤 데이터에서 찾지 못한 경우 주소 검색 시도
                                if (!found) {
                                  const { kakao } = window;
                                  const geocoder = new kakao.maps.services.Geocoder();
                                  
                                  await new Promise<void>((resolve) => {
                                    geocoder.addressSearch(address, (result: any, status: any) => {
                                      if (status === kakao.maps.services.Status.OK && result && result.length > 0) {
                                        lat = parseFloat(result[0].y);
                                        lng = parseFloat(result[0].x);
                                        found = true;
                                      }
                                      resolve();
                                    });
                                  });
                                }

                                if (found) {
                                  const markerData: MarkerData = {
                                    lat, lng, name: address, address, dong: cleanDongName, 
                                    district: editableConditions.district || "", city: wizardData?.city || "",
                                    exactDong: cleanDongName,
                                  };
                                  setSelectedMarker(markerData);
                                  await searchFacilities();
                                } else {
                                  console.error('동 좌표를 찾을 수 없습니다:', value);
                                  setIsLoadingFacilities(false);
                                }
                              } catch (error) {
                                console.error('동 좌표 가져오기 실패:', error);
                                setIsLoadingFacilities(false);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="동을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {dongRankings.map((ranking) => (
                              <SelectItem key={ranking.rank} value={ranking.dong}>
                                {ranking.dong} ({ranking.rank}위)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedDongForFacility || topDongData?.동 || topDongData?.dong ? (
                      <>
                        {isLoadingFacilities ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">시설 데이터를 불러오는 중...</p>
                          </div>
                        ) : Object.keys(facilityData).length > 0 ? (
                          <div className="space-y-4">
                            {/* 카테고리 필터 */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant={selectedFacilityCategory === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => filterFacilityMarkers(null)}
                              >
                                전체
                              </Button>
                              {FACILITY_CATEGORIES.map((category) => (
                                <Button
                                  key={category.code}
                                  variant={selectedFacilityCategory === category.name ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => filterFacilityMarkers(category.name)}
                                  className="gap-1"
                                >
                                  <category.icon className={`h-4 w-4 ${category.color}`} />
                                  {category.name}
                                  <Badge variant="secondary" className="ml-1">
                                    {facilityData[category.name]?.length || 0}
                                  </Badge>
                                </Button>
                              ))}
                            </div>

                            {/* 시설 목록 */}
                            <div className="space-y-4">
                              {Object.entries(facilityData).map(([categoryName, facilities]) => {
                                if (selectedFacilityCategory && selectedFacilityCategory !== categoryName) return null;
                                
                                const categoryInfo = FACILITY_CATEGORIES.find(cat => cat.name === categoryName);
                                if (!categoryInfo) return null;

                                return (
                                  <Card key={categoryName}>
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <categoryInfo.icon className={`h-5 w-5 ${categoryInfo.color}`} />
                                          <CardTitle className="text-lg">{categoryName}</CardTitle>
                                        </div>
                                        <Badge variant="secondary">{facilities.length}개</Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {facilities.map((facility, idx) => (
                                          <div 
                                            key={idx} 
                                            className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                          >
                                            <div className="flex-1">
                                              <p className="font-medium text-sm">{facility.name}</p>
                                              <p className="text-xs text-muted-foreground mt-1">{facility.address}</p>
                                            </div>
                                            <Badge variant="outline" className="ml-2">
                                              {facility.distance}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                              동을 선택하면 시설 데이터가 표시됩니다.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          동을 선택해주세요.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : analysisList.length > 0 ? (
            analysisList.map((item, index) => (
              <div key={index} ref={(el) => { if (el) reportRefs.current[index] = el; }}>
              <Card className="mb-4">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {item.marker.district && `${item.marker.district}구 `} 의 상권 추천 결과
                        {/* {item.marker.exactDong ? `${item.marker.exactDong}동` : item.marker.dong ? `${item.marker.dong}동` : ''} */}
                      </CardTitle>
                      {/* <CardDescription className="mt-1">{item.marker.address}</CardDescription> */}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="scores"><Award className="h-4 w-4 mr-1" />점수 / 개요</TabsTrigger>
                      <TabsTrigger value="charts"><BarChart3 className="h-4 w-4 mr-1" />차트</TabsTrigger>
                      <TabsTrigger value="prediction"><TrendingUpIcon className="h-4 w-4 mr-1" />AI 예측</TabsTrigger>
                      
                    </TabsList>

                    <TabsContent value="scores" className="space-y-4 mt-4">
                      {/* 경쟁업체 순위표 (상단) */}
                      <CompetitorRankingTable
                        dongName={item.marker.exactDong || item.marker.dong}
                        city={item.marker.city}
                        district={item.marker.district}
                        businessType={item.analysis.category}
                      />
                      
                      <div className="text-5xl font-bold text-primary mb-2">{item.analysis.score}점</div>
                      <p className="text-sm text-muted-foreground">{item.marker.address} 기준 분석 결과입니다.</p>

                      {/* 현재 기준 데이터 */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">현재 기준 데이터</CardTitle>
                        </CardHeader>
                        <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { icon: Users, label: "유동인구", value: item.analysis.human, color: "text-primary" },
                              { icon: TrendingUp, label: "작년 매출", value: item.analysis.xValues ? `${(item.analysis.xValues.작년_매출 / 10000).toFixed(1)}만원` : "데이터 없음", color: "text-secondary" },
                              { icon: Store, label: "작년 점포수", value: item.analysis.xValues ? `${item.analysis.xValues.작년_점포수}개` : "데이터 없음", color: "text-accent" },
                          { icon: MapPin, label: "업종", value: item.analysis.category, color: "text-primary" },
                        ].map((stat, i) => (
                              <div key={i} className="p-3 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                <span className="text-xs text-muted-foreground">{stat.label}</span>
                              </div>
                              <p className="text-lg font-bold">{stat.value}</p>
                              </div>
                            ))}
                          </div>
                            </CardContent>
                          </Card>

                      {/* 2026년 예측값 */}
                      {item.analysis.prediction2026 && item.analysis.prediction2026.length > 0 && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">2026년 예측값</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-3">
                              {item.analysis.prediction2026.map((pred: any, idx: number) => {
                                const year = pred.년도 || 2026;
                                const quarter = pred.분기 || 1;
                                const human = pred.길단위유동인구 || 0;
                                const stores = pred.전체점포수 || 0;
                                
                                return (
                                  <div key={idx} className="p-3 rounded-lg border">
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {year}년 {quarter}분기
                      </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-primary" />
                                        <span className="text-xs">유동인구: {(human / 1000).toFixed(1)}k명</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Store className="h-3 w-3 text-accent" />
                                        <span className="text-xs">점포수: {stores}개</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="prediction" className="space-y-4 mt-4">
                      <PredictionTab
                        dongName={item.marker.exactDong || item.marker.dong}
                        city={item.marker.city}
                        district={item.marker.district}
                        currentHuman={item.analysis.human}
                        currentSales={item.analysis.sales}
                        currentCompetitors={item.analysis.competitors}
                      />
                    </TabsContent>

                    <TabsContent value="charts" className="space-y-6 mt-4">
                      <PopulationCharts populationData={populationData} />
                      <TimeDayCharts timeDayData={timeDayData} />
                    </TabsContent>
                  </Tabs>

                  {/* 주변 시설 분석 */}
                  <FacilityAnalysis
                    selectedMarker={item.marker}
                    facilityData={facilityData}
                    isLoadingFacilities={isLoadingFacilities}
                    onSearchFacilities={searchFacilities}
                    onFilterFacilityMarkers={filterFacilityMarkers}
                    selectedFacilityCategory={selectedFacilityCategory}
                  />

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={async () => {
                      try {
                        // 임대료에서 숫자만 추출 (예: "5000만원/㎡" -> 5000)
                        const rentMatch = item.analysis.sales.match(/(\d+(?:\.\d+)?)/);
                        const rent = rentMatch ? parseFloat(rentMatch[1]) : 0;
                        
                        // 사용자가 선택한 데이터로 모델 실행하고 텍스트만 PDF로 저장
                        await generateSimplePDFReport({
                          businessType: item.analysis.category || currentBusinessType,
                          rent: rent,
                          city: item.marker.city || "",
                          district: item.marker.district || "",
                          lat: item.marker.lat,
                          lng: item.marker.lng,
                        });
                      } catch (error: any) {
                        console.error('PDF 생성 실패:', error);
                        alert(`PDF 생성에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
                      }
                    }}
                  >
                    상세 리포트 다운로드
                  </Button>
                </CardContent>
              </Card>
              </div>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">위치를 선택하세요</h3>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
