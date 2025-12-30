////////////////////////
// 순위 차트 컴포넌트
////////////////////////

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Trophy, Users, TrendingUp, Store, ArrowUp, ArrowDown, Minus } from "lucide-react";

export interface RankingData {
  rank: number;
  dong: string;
  value: number;
  changeRate: number; // 전년 대비 증감률 (%)
}

export interface RankingsChartProps {
  rankingType: "human" | "sales" | "competitors";
  dongName?: string;
  city?: string;
  district?: string;
}

// 테스트 데이터 생성 함수
const generateTestRankingData = (
  rankingType: "human" | "sales" | "competitors",
  currentDong?: string
): RankingData[] => {
  const dongNames = [
    "강남동", "역삼동", "삼성동", "청담동", "압구정동",
    "신사동", "논현동", "대치동", "도곡동", "개포동"
  ];
  
  // 현재 동이 있으면 1위로 설정
  const currentDongIndex = currentDong 
    ? dongNames.findIndex(d => d.includes(currentDong.replace(/동$/, "")))
    : -1;
  
  const baseValues = {
    human: [125000, 118000, 112000, 105000, 98000],
    sales: [85000, 78000, 72000, 68000, 62000],
    competitors: [45, 38, 32, 28, 25]
  };

  const changeRates = [2.5, -1.2, 0.0, 1.8, -0.5];

  return Array.from({ length: 5 }, (_, i) => {
    const rank = i + 1;
    let dong = dongNames[i];
    
    // 현재 동이 있으면 1위로 설정
    if (currentDong && i === 0 && currentDongIndex >= 0) {
      dong = currentDong.replace(/동$/, "") + "동";
    } else if (currentDong && i === 0) {
      dong = currentDong.replace(/동$/, "") + "동";
    }

    return {
      rank,
      dong,
      value: baseValues[rankingType][i],
      changeRate: changeRates[i]
    };
  });
};

export default function RankingsChart({ 
  rankingType, 
  dongName,
  city,
  district 
}: RankingsChartProps) {
  const [rankingData, setRankingData] = useState<RankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankingData = async () => {
      setIsLoading(true);
      try {
        // TODO: 실제 API 호출로 대체
        // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/map/rankings`, {
        //   type: rankingType,
        //   city,
        //   district,
        //   dong: dongName
        // });
        // setRankingData(response.data);

        // 임시로 테스트 데이터 사용
        await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 시뮬레이션
        const testData = generateTestRankingData(rankingType, dongName);
        setRankingData(testData);
      } catch (error) {
        console.error("순위 데이터 로드 실패:", error);
        // 에러 발생 시 테스트 데이터 사용
        const testData = generateTestRankingData(rankingType, dongName);
        setRankingData(testData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankingData();
  }, [rankingType, dongName, city, district]);

  const formatValue = (value: number) => {
    switch (rankingType) {
      case "human":
        return `${(value / 1000).toFixed(0)}k명`;
      case "sales":
        return `${(value / 1000).toFixed(0)}k만원`;
      case "competitors":
        return `${value}개`;
      default:
        return value.toString();
    }
  };

  const formatChangeRate = (rate: number) => {
    if (rate > 0) return `+${rate.toFixed(1)}%`;
    if (rate < 0) return `${rate.toFixed(1)}%`;
    return "0.0%";
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
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">
            {rankingType === "human" && "유동인구"}
            {rankingType === "sales" && "매출"}
            {rankingType === "competitors" && "경쟁업체"} 순위
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-12 gap-2 pb-2 border-b text-xs font-semibold text-muted-foreground">
            <div className="col-span-1 text-center">순위</div>
            <div className="col-span-4">동 이름</div>
            <div className="col-span-3 text-right">
              {rankingType === "human" && "유동인구"}
              {rankingType === "sales" && "매출"}
              {rankingType === "competitors" && "경쟁업체"}
            </div>
            <div className="col-span-4 text-right">전년 대비 증감률</div>
          </div>

          {/* 순위 데이터 */}
          <div className="space-y-1">
            {rankingData.map((item) => (
              <div
                key={item.rank}
                className="grid grid-cols-12 gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* 순위 */}
                <div className="col-span-1 flex items-center justify-center">
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

                {/* 동 이름 */}
                <div className="col-span-4 flex items-center">
                  <span className="text-sm font-medium">{item.dong}</span>
                </div>

                {/* 수치 */}
                <div className="col-span-3 flex items-center justify-end">
                  <span className="text-sm font-medium">{formatValue(item.value)}</span>
                </div>

                {/* 증감률 */}
                <div className="col-span-4 flex items-center justify-end gap-1">
                  {item.changeRate > 0 && (
                    <>
                      <ArrowUp className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        {formatChangeRate(item.changeRate)}
                      </span>
                    </>
                  )}
                  {item.changeRate < 0 && (
                    <>
                      <ArrowDown className="h-3 w-3 text-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        {formatChangeRate(item.changeRate)}
                      </span>
                    </>
                  )}
                  {item.changeRate === 0 && (
                    <>
                      <Minus className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatChangeRate(item.changeRate)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

