////////////////////////////////
// 선호하는 입지 조건 선택 
////////////////////////////////

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { Badge } from "@/src/components/ui/badge";
import API from "@/src/api/axiosApi";
import { useAuth } from "@/src/lib/auth-context";
import {
  Coffee,
  Utensils,
  Scissors,
  ShoppingBag,
  Store,
  Dumbbell,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Search,
  X,
  MapPin,
  RotateCcw,
  BeerIcon,
} from "lucide-react"

interface LocationWizardProps {
  onComplete: (data: {
    businessType: string;
    city: string;
    district: string;
    subdistrict: string;
    lat: number;
    lng: number;
    monthlyRent?: number;
    deposit?: number;
    area?: number;
  }) => void;
  onClose: () => void;
}


export function LocationWizard({ onComplete, onClose }: LocationWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [locationData, setLocationData] = useState<any>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  

  const businessTypes = [
    { id: "카페", name: "카페", icon: Coffee },
    { id: "음식점", name: "음식점", icon: Utensils },
    { id: "호프/간이주점", name: "호프/간이주점", icon: BeerIcon },
    { id: "편의점", name: "편의점", icon: ShoppingBag },
    { id: "소매점", name: "소매점", icon: Store },
    { id: "헬스장", name: "헬스장", icon: Dumbbell },
  ];

  const budgetOptions = [
    { id: "low", label: "3,000만원", value: 3000 },
    { id: "mid", label: "5,000만원", value: 5000 },
    { id: "high", label: "10,000만원", value: 10000 },
  ];

  // const analysisTypes = [
  //   { id: "detailed", label: "아니요, 빠르게 분석할게요", subtitle: "기본 정보만으로 빠른 분석" },
  //   { id: "fast", label: "네, 자세히 분석해주세요", subtitle: "상세한 분석 보기" },
  // ];
  
  const [selections, setSelections] = useState({
    category: "",
    budget: 0,
    analysisType: "",
    city: "",
    district: "",
    monthlyRent: 0,
    deposit: 0,
    area: 0,
    // subdistrict: "",
  });

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  // const [selectedSubdistrict, setselectedSubdistrict] = useState("");

  const cities = locationData ? Object.keys(locationData) : [];
  const districts = selectedCity && locationData 
    ? (Array.isArray(locationData[selectedCity]) 
        ? locationData[selectedCity] 
        : Object.keys(locationData[selectedCity]))
    : [];
  // const subdistrict = selectedCity && selectedDistrict && locationData 
  //   ? locationData[selectedCity][selectedDistrict] || [] 
  //   : [];

  useEffect(() => {
    API.get("/api/map/location")
      .then((res) => setLocationData(res.data))
      .catch(() => console.error("위치 데이터 불러오기 실패"))
      .finally(() => setLoadingLocations(false));
  }, []);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      onClose()
    } else {
      setStep(step - 1)
    }
  }

  const toggleDistrict = (district: string) => {
    setSelectedDistrict(district) 
  }

  const applyLocationSelection = async () => {
    if (selectedDistrict) {
      const updatedSelections = {
        ...selections,
        city: selectedCity,
        district: selectedDistrict,
        // subdistrict: selectedSubdistrict,
      };
      setSelections(updatedSelections);
      
      // rent_range를 monthlyRent, deposit, area로 구성
      const rentRange = `월세: ${updatedSelections.monthlyRent}만원, 보증금: ${updatedSelections.deposit}만원, 면적: ${updatedSelections.area}㎡`;
      
      // 지역 선택 후 바로 분석 시작
      try {
        await API.post("/api/map/save", {
          user_id: user?.user_id || user?.email || "guest",
          category: updatedSelections.category,
          rent_range: rentRange,
          region_city: updatedSelections.city,
          region_district: updatedSelections.district,
        });
      } catch (error) {
        console.error("분석 요청 저장 실패:", error);
        // 에러가 발생해도 wizard는 계속 진행
      }

      // "서울시 전체" 선택 시 서울시 중심 좌표 사용
      let lat = 37.566535;
      let lng = 126.9779692;
      
      if (selectedDistrict !== "서울시 전체") {
        try {
          const response = await API.post("/api/map/location-center", {
            city: updatedSelections.city,
            district: updatedSelections.district,
            // subdistrict: updatedSelections.subdistrict,
            category: updatedSelections.category
          });
          lat = response.data.lat;
          lng = response.data.lng;
        } catch (error) {
          console.error("위치 중심 좌표 가져오기 실패:", error);
        }
      }

      onComplete({ 
        businessType: updatedSelections.category,
        city: updatedSelections.city,
        district: updatedSelections.district,
        subdistrict: "",
        lat, 
        lng,
        monthlyRent: updatedSelections.monthlyRent,
        deposit: updatedSelections.deposit,
        area: updatedSelections.area,
      });
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return selections.category !== "" //업종
      case 2:
        return selections.monthlyRent > 0 && selections.deposit > 0 && selections.area > 0 //월세, 보증금, 면적
      default:
        return false
    }
  }

  if (loadingLocations) return <div>위치 정보 불러오는 중...</div>;
    

    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">창업 정보를 입력해주세요</CardTitle>
                <CardDescription className="mt-1">
                  단계별로 정보를 입력하시면 최적의 창업 입지를 분석해드립니다.
                </CardDescription>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-medium">{step} / 3</span> 
              </div>
              <Progress value={(step / 3) * 100} className="h-2" /> 
            </div>
  
          </CardHeader>
  
          <CardContent className="space-y-6">
            {/* Step 1: Business Type */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">어떤 업종으로 창업하시나요?</h3>
                  <p className="text-sm text-muted-foreground">업종을 선택해주세요</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {businessTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = selections.category == type.id
                    return (
                      <button
                        key={type.id}
                        onClick={() => {
                          console.log("type.id:", type.id)
                          setSelections(prev => ({ ...prev, category: type.id}))
                        }}
                          
                        className={`p-4 rounded-lg border-2 transition-all hover:border-primary/50 ${
                          isSelected ? "border-primary bg-primary/5" : "border-border bg-background"
                        }`}
                      >
                        <Icon
                          className={`h-8 w-8 mb-2 mx-auto ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <p className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>{type.name}</p>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary mt-1 mx-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
  
            {/* Step 2: Monthly Rent, Deposit, Area */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">임대 정보를 입력해주세요</h3>
                  <p className="text-sm text-muted-foreground">월세, 보증금, 면적을 입력해주세요</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">월세 (만원)</label>
                    <input
                      type="number"
                      value={selections.monthlyRent || ""}
                      onChange={(e) => setSelections({ ...selections, monthlyRent: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="100"
                      className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">보증금 (만원)</label>
                    <input
                      type="number"
                      value={selections.deposit || ""}
                      onChange={(e) => setSelections({ ...selections, deposit: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="5000"
                      className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">면적 (㎡)</label>
                    <input
                      type="number"
                      value={selections.area || ""}
                      onChange={(e) => setSelections({ ...selections, area: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="33"
                      className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}
  
  
        {/* Step 3: Hierarchical Location Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">지역설정</h3>
            </div>
  
            {/* Three Column Layout */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 border-b bg-muted/30">
                <div className="p-3 text-center text-sm font-medium border-r">시/도</div>
                <div className="p-3 text-center text-sm font-medium border-r">시/구/군</div>
                {/* <div className="p-3 text-center text-sm font-medium">동/읍/면</div> */}
              </div>
  
              <div className="grid grid-cols-2">
                {/* Cities Column */}
                <div className="border-r max-h-[300px] overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city)
                        setSelectedDistrict("")
                        // setselectedSubdistrict("")
                      }}
  
                      className={`w-full p-3 text-left text-sm hover:bg-muted/50 transition-colors ${
                        selectedCity === city ? "bg-primary/10 text-primary font-medium" : ""
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
  
          {/* Districts Column */}
          <div className="border-r max-h-[300px] overflow-y-auto">
            {districts.map((district) => (
              <button
                key={district}
                onClick={() => {
                  setSelectedDistrict(district)
                  //  기존 선택 유지 (초기화 X)
                }}
                className={`w-full p-3 text-left text-sm hover:bg-muted/50 transition-colors ${
                  selectedDistrict === district ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              >
                {district}
              </button>
            ))}
          </div>
  
          {/* subdistict Column */}
          {/* <div className="max-h-[300px] overflow-y-auto">
            {selectedDistrict ? (
              <>
              {subdistrict.map((subdistrict: string) => {
                const isSelected = selectedSubdistrict === subdistrict
                return (
                  <button
                    key={subdistrict}
                    onClick={() => toggleSubdistrict(subdistrict)}
                    className={`w-full p-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-center justify-between ${
                      isSelected ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    <span>{subdistrict}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                )
              })}
  
              </>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                시/구를 선택해주세요
              </div>
            )}
          </div> */}
        </div>
      </div>
  
      {selectedDistrict && (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-primary font-medium">1개만 선택할 수 있어요.</span>
          </div>
          <Badge>
            {selectedDistrict}
            <button
              onClick={() => setSelectedDistrict("")}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
  
  
          {/* Action Buttons — 이전 + 적용하기 (통일된 디자인) */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack} //  이전 단계로 이동
              className="flex-1 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전
            </Button>
            <Button
              onClick={applyLocationSelection}
              disabled={!selectedDistrict}
              className="flex-1"
            >
            {selectedDistrict ? `${selectedDistrict} 적용하기` : "지역 선택"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
  )}
  
            {/* Step 5: Analysis Type */}
            {/* {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">더 자세한 분석을 원하시나요?</h3>
                  <p className="text-sm text-muted-foreground">추가 정보를 선택해주세요</p>
                </div>
                <div className="space-y-3">
                  {analysisTypes.map((type) => {
                    const isSelected = selections.analysisType === type.id
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelections({ ...selections, analysisType: type.id })}
                        className={`w-full p-5 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                          isSelected ? "border-primary bg-primary/5" : "border-border bg-background"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className={`font-medium mb-1 ${isSelected ? "text-primary" : ""}`}>{type.label}</p>
                            <p className="text-sm text-muted-foreground">{type.subtitle}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
   */}
            {/* Navigation - Only show for steps 1 and 2 */}
            {step !== 3 && (
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  이전
                </Button>
                <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
                  다음
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  
