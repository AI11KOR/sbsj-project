////////////////////////
// 시설 분석 컴포넌트
////////////////////////

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Building2,
  Train,
  ParkingCircle,
  GraduationCap,
  Hospital,
  Landmark,
  Theater,
  Banknote,
} from "lucide-react";

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

interface FacilityData {
  name: string;
  address: string;
  distance: string;
  lat: number;
  lng: number;
  category: string;
}

// 카카오 기준 시설 코드
const FACILITY_CATEGORIES = [
  { code: "SW8", name: "지하철역", icon: Train, color: "text-blue-500" },
  { code: "BK9", name: "은행", icon: Banknote, color: "text-green-500" },
  { code: "PK6", name: "주차장", icon: ParkingCircle, color: "text-purple-500" },
  { code: "SC4", name: "학교", icon: GraduationCap, color: "text-yellow-500" },
  { code: "HP8", name: "병원", icon: Hospital, color: "text-red-500" },
  { code: "AT4", name: "관광명소", icon: Landmark, color: "text-pink-500" },
  { code: "CT1", name: "문화시설", icon: Theater, color: "text-indigo-500" },
];

interface FacilityAnalysisProps {
  selectedMarker: MarkerData | null;
  facilityData: { [key: string]: FacilityData[] };
  isLoadingFacilities: boolean;
  onSearchFacilities: () => void;
  onFilterFacilityMarkers: (categoryName: string | null) => void;
  selectedFacilityCategory: string | null;
}

export default function FacilityAnalysis({
  selectedMarker,
  facilityData,
  isLoadingFacilities,
  onSearchFacilities,
  onFilterFacilityMarkers,
  selectedFacilityCategory,
}: FacilityAnalysisProps) {
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);

  // 검색이 완료되면 모달 열기
  useEffect(() => {
    if (!isLoadingFacilities && Object.keys(facilityData).length > 0) {
      setIsFacilityModalOpen(true);
    }
  }, [isLoadingFacilities, facilityData]);

  const handleSearchClick = () => {
    onSearchFacilities();
  };

  return (
    <Dialog open={isFacilityModalOpen} onOpenChange={setIsFacilityModalOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full" 
          size="lg" 
          variant="outline"
          onClick={handleSearchClick}
          disabled={isLoadingFacilities}
        >
          {isLoadingFacilities ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              시설 분석 중...
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 mr-2" />
              주변 시설도 함께 볼까요 ?
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            주변 시설 분석 (중심 지점 반경 500m)
          </DialogTitle>
          <DialogDescription>
            {selectedMarker?.exactDong ? `${selectedMarker.exactDong}동` : selectedMarker?.address} 의 편의시설 정보입니다.
          </DialogDescription>
        </DialogHeader>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedFacilityCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterFacilityMarkers(null)}
          >
            전체
          </Button>
          {FACILITY_CATEGORIES.map((category) => (
            <Button
              key={category.code}
              variant={selectedFacilityCategory === category.name ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterFacilityMarkers(category.name)}
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

        {Object.keys(facilityData).length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">시설 정보를 불러오는 중입니다...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { FACILITY_CATEGORIES };

