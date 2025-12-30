////////////////////////
// 경쟁업체 순위표 컴포넌트 (구 | 동 | 증감률)
////////////////////////

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Store, Trophy } from "lucide-react";
import axios from "axios";

export interface CompetitorRankingData {
  rank: number;
  district: string;
  dong: string;
  score: number; // AI 예측 점수
  작년_매출?: number;
  작년_점포수?: number;
}

export interface CompetitorRankingTableProps {
  dongName?: string;
  city?: string;
  district?: string;
  businessType?: string; // 업종 타입 추가
}

const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000'

// 테스트 데이터 생성 함수
const generateTestRankingData = (
  currentDong?: string,
  currentDistrict?: string
): CompetitorRankingData[] => {
  const districts = ["강남구", "서초구", "송파구", "강동구", "영등포구"];
  const dongs = [
    ["강남동", "역삼동", "삼성동", "청담동", "압구정동"],
    ["반포동", "서초동", "방배동", "양재동", "잠원동"],
    ["잠실동", "문정동", "가락동", "송파동", "석촌동"],
    ["천호동", "성내동", "길동", "둔촌동", "암사동"],
    ["여의도동", "당산동", "영등포동", "신길동", "대림동"]
  ];
  
  const changeRates = [2.5, -1.2, 0.0, 1.8, -0.5, 1.2, -0.8, 0.5, -1.5, 0.3];
  
  const data: CompetitorRankingData[] = [];
  let rank = 1;
  
  districts.forEach((district, districtIndex) => {
    dongs[districtIndex].forEach((dong, dongIndex) => {
      if (rank <= 10) {
        data.push({
          rank: rank++,
          district: district.replace(/구$/, ""),
          dong: dong.replace(/동$/, ""),
          changeRate: changeRates[(districtIndex * 5 + dongIndex) % changeRates.length]
        });
      }
    });
  });
  
  // 현재 동이 있으면 상위로 이동
  if (currentDong && currentDistrict) {
    const currentIndex = data.findIndex(
      item => item.dong === currentDong.replace(/동$/, "") && 
              item.district === currentDistrict.replace(/구$/, "")
    );
    if (currentIndex > 0) {
      const currentItem = data[currentIndex];
      data.splice(currentIndex, 1);
      data.unshift({ ...currentItem, rank: 1 });
      // 나머지 순위 재조정
      data.forEach((item, index) => {
        if (index > 0) item.rank = index + 1;
      });
    }
  }
  
  return data.slice(0, 10);
};

export default function CompetitorRankingTable({ 
  dongName,
  city,
  district,
  businessType
}: CompetitorRankingTableProps) {
  const [rankingData, setRankingData] = useState<CompetitorRankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankingData = async () => {
      setIsLoading(true);
      try {
        // 업종 타입 매핑
        const typeMap: { [key: string]: string } = {
          "카페": "cafe",
          "한식": "korean",
          "호프": "hof",
          "cafe": "cafe",
          "korean": "korean",
          "hof": "hof"
        };
        const apiType = typeMap[businessType || ""] || "cafe";
        
        const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000';
        const params: any = {
          type: apiType,
          limit: 10
        };
        
        if (district) {
          params.gu = district + '구';
        }
        
        const response = await axios.get(`${flaskUrl}/api/rankings`, { params });
        
        console.log("@!!경쟁업체 순위 여기양 !!@!@!@response.data", response.data);

        if (response.data && response.data.data) {
          // API 응답을 컴포넌트 형식으로 변환
          const apiData = response.data.data.map((item: any) => ({
            rank: item.rank || 1,
            district: (item.district || '').replace(/구$/, ''),
            dong: (item.dong || '').replace(/동$/, ''),
            score: item.score || 0,
            작년_매출: item.작년_매출 || 0,
            작년_점포수: item.작년_점포수 || 0
          }));
          
          console.log("✅ 경쟁업체 순위 데이터 로드 성공:", apiData);
          setRankingData(apiData);
        } else {
          console.warn("⚠️ 데이터 형식이 올바르지 않습니다:", response.data);
          setRankingData([]);
        }
      } catch (error: any) {
        console.error("❌ 경쟁업체 순위 데이터 로드 실패:", error);
        console.error("에러 상세:", error.response?.data || error.message);
        // 에러 발생 시 빈 데이터 설정
        setRankingData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankingData();
  }, [dongName, city, district, businessType]);

  const formatScore = (score: number) => {
    return `${score.toFixed(1)}점`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">순위 데이터를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">회원님에게 추천하는 상권</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-12 gap-2 pb-2 border-b text-xs font-semibold text-muted-foreground">
            <div className="col-span-3 text-center">순위</div>
            <div className="col-span-5">동</div>
            <div className="col-span-3 text-right">점수</div>
          </div>

          {/* 순위 데이터 */}
          <div className="space-y-1">
            {rankingData.map((item) => (
              <div
                key={item.rank}
                className="grid grid-cols-12 gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* 순위 */}
                <div className="col-span-2 flex items-center justify-center">
                  {item.rank <= 3 ? (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.rank === 1
                          ? "bg-yellow-500 text-white"
                          : item.rank === 2
                          ? "bg-gray-400 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {item.rank}
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">{item.rank}</span>
                  )}
                </div>

                {/* 동 */}
                <div className="col-span-7 flex items-center">
                  <span className="text-sm font-medium">{item.dong}동</span>
                </div>

                {/* 점수 */}
                <div className="col-span-3 flex items-center justify-end gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <span className="text-sm font-medium text-primary">
                    {formatScore(item.score)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

