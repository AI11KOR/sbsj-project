"use client"

import { useState } from "react"
import { LocationWizard } from "@/src/components/location-wizard"
import KakaoMap from "@/src/components/kakao-map"

import { useRouter } from "next/navigation";

export default function MapPage() {
  const [showWizard, setShowWizard] = useState(true);
  const [selectedDong, setSelectedDong] = useState<string | null>(null);
  const [dongCenter, setDongCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [wizardDone, setWizardDone] = useState(false);
  const router = useRouter();

  const handleWizardComplete = (data: {
    businessType: string;
    city: string;
    district: string;
    // subdistrict: string;
    lat: number;
    lng: number;
    monthlyRent?: number;
    deposit?: number;
    area?: number;
  }) => {
    setMapData(data); // 창업 정보 저장
    setWizardDone(true); // 창업 정보 저장 완료
    setShowWizard(false); // wizard 숨기기
  };

  {selectedDong && (
    <p className="text-sm text-muted-foreground mb-2">
      선택된 지역: <span className="text-primary font-medium">{selectedDong}</span>
    </p>
  )}

  return (
    <main className="container mx-auto p-4">
       <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">상권 분석 지도</h1>
          <p className="text-muted-foreground">지도에서 위치를 선택하고 AI 추천을 받아보세요.</p>
        </div>
      </div>

      <KakaoMap
        selectedDong={mapData ? `${mapData.city} ${mapData.district}` : null}
        dongCenter={mapData?.lat && mapData?.lng ? { lat: mapData.lat, lng: mapData.lng } : null}
        businessType={mapData?.businessType || ""}
        wizardData={mapData}
      />

      {showWizard && (
        <LocationWizard
          onComplete={handleWizardComplete}
          onClose={() => setShowWizard(false)}
        />
      )}
    </main>
  );
}




      
     
