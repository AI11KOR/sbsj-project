////////////////////////
// 예측 탭 컴포넌트 (2020~2026년 데이터 예측)
////////////////////////

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { TrendingUp, Users, Store, ArrowUp } from "lucide-react";
import axios from "axios";

export interface PredictionData {
  year: number;
  human: number; // 유동인구
  sales: number; // 매출 (만원/㎡)
  competitors: number; // 경쟁업체 수
}

export interface PredictionTabProps {
  dongName?: string;
  city?: string;
  district?: string;
  currentHuman?: string;
  currentSales?: string;
  currentCompetitors?: number;
}

// 테스트 데이터 생성 함수 (2020~2026년)
const generatePredictionData = (
  currentHuman?: string,
  currentSales?: string,
  currentCompetitors?: number
): PredictionData[] => {
  // 현재 값 파싱
  const parseHuman = (str?: string) => {
    if (!str) return 50000;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 50000 : num;
  };
  
  const parseSales = (str?: string) => {
    if (!str) return 50000;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 50000 : num;
  };
  
  const currentH = parseHuman(currentHuman);
  const currentS = parseSales(currentSales);
  const currentC = currentCompetitors || 30;
  
  // 2020년부터 현재까지의 추정 데이터 생성
  const baseYear = 2020;
  const currentYear = new Date().getFullYear();
  const data: PredictionData[] = [];
  
  // 2020~현재년도 (과거 데이터)
  for (let year = baseYear; year <= currentYear; year++) {
    const yearsFromBase = year - baseYear;
    const progress = yearsFromBase / (currentYear - baseYear);
    
    data.push({
      year,
      human: Math.round(currentH * (0.7 + progress * 0.3)), // 70%에서 현재값까지 증가
      sales: Math.round(currentS * (0.75 + progress * 0.25)),
      competitors: Math.round(currentC * (0.8 + progress * 0.2))
    });
  }
  
  // 미래 예측 (현재년도+1 ~ 2026)
  const lastData = data[data.length - 1];
  for (let year = currentYear + 1; year <= 2026; year++) {
    const yearsFromCurrent = year - currentYear;
    // 연평균 2-5% 증가 가정
    const growthRate = 1 + (0.02 + Math.random() * 0.03);
    
    data.push({
      year,
      human: Math.round(lastData.human * Math.pow(growthRate, yearsFromCurrent)),
      sales: Math.round(lastData.sales * Math.pow(growthRate, yearsFromCurrent)),
      competitors: Math.round(lastData.competitors * Math.pow(growthRate * 0.9, yearsFromCurrent))
    });
  }
  
  return data;
};

// 간단한 선형 차트 컴포넌트
const LineChart = ({ data, type }: { data: PredictionData[]; type: "human" | "sales" | "competitors" }) => {
  const maxValue = Math.max(...data.map(d => d[type]));
  const minValue = Math.min(...data.map(d => d[type]));
  const range = maxValue - minValue || 1;
  
  const getY = (value: number) => {
    return 100 - ((value - minValue) / range) * 80; // 10% 여백
  };
  
  const formatValue = (value: number) => {
    switch (type) {
      case "human":
        return `${(value / 1000).toFixed(0)}k명`;
      case "sales":
        return `${(value / 1000).toFixed(0)}k만원`;
      case "competitors":
        return `${Math.round(value)}개`;
      default:
        return value.toString();
    }
  };
  
  const getColor = () => {
    switch (type) {
      case "human":
        return "rgb(76, 175, 80)";
      case "sales":
        return "rgb(139, 195, 74)";
      case "competitors":
        return "rgb(102, 187, 106)";
    }
  };
  
  return (
    <div className="relative w-full h-48">
      <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        {/* 그리드 라인 */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="40"
            y1={y * 2}
            x2="380"
            y2={y * 2}
            stroke="#e0e0e0"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Y축 레이블 */}
        {[0, 1].map((i) => {
          const value = minValue + (range * (1 - i));
          return (
            <text
              key={i}
              x="35"
              y={i * 160 + 20}
              fontSize="10"
              fill="#666"
              textAnchor="end"
            >
              {formatValue(value)}
            </text>
          );
        })}
        
        {/* X축 레이블 */}
        {data.map((d, i) => {
          if (i % 2 === 0 || i === data.length - 1) {
            return (
              <text
                key={i}
                x={40 + (i / (data.length - 1)) * 340}
                y="195"
                fontSize="10"
                fill="#666"
                textAnchor="middle"
              >
                {d.year}
              </text>
            );
          }
          return null;
        })}
        
        {/* 데이터 라인 */}
        <polyline
          points={data.map((d, i) => 
            `${40 + (i / (data.length - 1)) * 340},${getY(d[type])}`
          ).join(' ')}
          fill="none"
          stroke={getColor()}
          strokeWidth="2"
        />
        
        {/* 데이터 포인트 */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={40 + (i / (data.length - 1)) * 340}
            cy={getY(d[type])}
            r="3"
            fill={getColor()}
          />
        ))}
      </svg>
    </div>
  );
};

export default function PredictionTab({
  dongName,
  city,
  district,
  currentHuman,
  currentSales,
  currentCompetitors
}: PredictionTabProps) {
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<"human" | "sales" | "competitors">("human");

  useEffect(() => {
    const fetchPredictionData = async () => {
      setIsLoading(true);
      try {
        if (!district || !dongName) {
          // 필수 파라미터가 없으면 빈 데이터 설정
          setPredictionData([]);
          setIsLoading(false);
          return;
        }

        // Flask API에서 예측 데이터 가져오기
        const currentYear = new Date().getFullYear();
        const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);
        
        // 2020년부터 현재까지의 과거 데이터는 테스트 데이터로 생성
        const baseYear = 2020;
        const pastData: PredictionData[] = [];
        
        // 값 파싱 헬퍼 함수
        const parseValue = (str?: string) => {
          if (!str) return 50000;
          const num = parseFloat(str.replace(/[^0-9.]/g, ''));
          return isNaN(num) ? 50000 : num;
        };
        
        const currentH = parseValue(currentHuman);
        const currentS = parseValue(currentSales);
        const currentC = currentCompetitors || 30;
        
        for (let year = baseYear; year <= currentYear; year++) {
          const yearsFromBase = year - baseYear;
          const progress = yearsFromBase / (currentYear - baseYear);
          pastData.push({
            year,
            human: Math.round(currentH * (0.7 + progress * 0.3)),
            sales: Math.round(currentS * (0.75 + progress * 0.25)),
            competitors: Math.round(currentC * (0.8 + progress * 0.2))
          });
        }

        // Flask API에서 미래 예측 데이터 가져오기
        const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000';
        const startYear = currentYear;
        const startQuarter = currentQuarter;
        // 2026년 4분기까지 예측 (충분한 분기 수 계산)
        const targetYear = 2026;
        const targetQuarter = 4;
        const nSteps = (targetYear - currentYear) * 4 + (targetQuarter - currentQuarter + 1);
        
        const response = await axios.get(`http://localhost:5000/api/predict`, {
          params: {
            gu: district + '구',
            dong: dongName + '동',
            start_year: startYear,
            start_quarter: startQuarter,
            n_steps: Math.max(nSteps, 8) // 최소 8분기 (2년치)
          },
          timeout: 10000 // 10초 타임아웃
        });
        console.log("@!!예측 데이터 여기양 !!@!@!@response.data", response.data);
        // 예측 데이터를 연도별로 변환
        const predictions = response.data.predictions || [];
        const futureData: PredictionData[] = [];
        
        // 연도별로 그룹화하여 평균 계산
        const yearData: { [year: number]: { human: number[]; sales: number[]; competitors: number[] } } = {};
        
        predictions.forEach((pred: any) => {
          const year = pred.년도;
          if (!yearData[year]) {
            yearData[year] = { human: [], sales: [], competitors: [] };
          }
          // 길단위유동인구를 유동인구로 사용
          yearData[year].human.push(pred.길단위유동인구 || 0);
          // 매출은 임대료 데이터가 없으므로 현재 매출 값을 기반으로 추정
          // 또는 전체점포수를 기반으로 추정 (점포수가 많을수록 매출이 높다고 가정)
          const parseValue = (str?: string) => {
            if (!str) return 50000;
            const num = parseFloat(str.replace(/[^0-9.]/g, ''));
            return isNaN(num) ? 50000 : num;
          };
          const baseSales = parseValue(currentSales);
          const storeRatio = (pred.전체점포수 || 0) / (currentC || 1);
          yearData[year].sales.push(baseSales * storeRatio);
          // 음식점점포수를 경쟁업체로 사용
          yearData[year].competitors.push(pred.음식점점포수 || 0);
        });

        // 연도별 평균 계산
        Object.keys(yearData).forEach(yearStr => {
          const year = parseInt(yearStr);
          const data = yearData[year];
          futureData.push({
            year,
            human: Math.round(data.human.reduce((a, b) => a + b, 0) / data.human.length),
            sales: Math.round(data.sales.reduce((a, b) => a + b, 0) / data.sales.length),
            competitors: Math.round(data.competitors.reduce((a, b) => a + b, 0) / data.competitors.length)
          });
        });

        // 과거 데이터와 미래 데이터 합치기
        const allData = [...pastData, ...futureData];
        console.log("✅ 예측 데이터 로드 성공:", allData);
        setPredictionData(allData);
      } catch (error: any) {
        const errorStatus = error.response?.status;
        const errorUrl = error.config?.url;
        
        console.error("❌ 예측 데이터 로드 실패:", error);
        if (errorStatus === 404) {
          console.warn(`⚠️ Flask API 엔드포인트를 찾을 수 없습니다: ${errorUrl}`);
          console.warn("Flask 서버가 실행 중인지 확인하고, /api/predict 엔드포인트가 등록되어 있는지 확인하세요.");
        } else if (errorStatus === 500) {
          console.error("❌ Flask 서버 내부 오류:", error.response?.data);
        } else {
          console.error("예측 데이터 로드 실패:", error.message);
        }
        
        // 에러 발생 시 빈 데이터 설정
        console.log("빈 데이터로 설정합니다.");
        setPredictionData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictionData();
  }, [dongName, city, district, currentHuman, currentSales, currentCompetitors]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">예측 데이터를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();
  const futureData = predictionData.filter(d => d.year > currentYear);
  const latestPrediction = futureData.length > 0 ? futureData[futureData.length - 1] : null; // 2026년 예측
  
  // 데이터가 없으면 빈 화면 표시
  if (predictionData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">예측 데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value: number, type: "human" | "sales" | "competitors") => {
    switch (type) {
      case "human":
        return `${(value / 1000).toFixed(1)}k명`;
      case "sales":
        return `${(value / 1000).toFixed(1)}k만원/㎡`;
      case "competitors":
        return `${Math.round(value)}개`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="space-y-4">
      {/* 차트 선택 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType("human")}
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
            selectedType === "human"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4 mx-auto mb-1" />
          <span className="text-xs">유동인구</span>
        </button>
        <button
          onClick={() => setSelectedType("sales")}
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
            selectedType === "sales"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-muted"
          }`}
        >
          <TrendingUp className="h-4 w-4 mx-auto mb-1" />
          <span className="text-xs">매출</span>
        </button>
        <button
          onClick={() => setSelectedType("competitors")}
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
            selectedType === "competitors"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-muted"
          }`}
        >
          <Store className="h-4 w-4 mx-auto mb-1" />
          <span className="text-xs">경쟁업체</span>
        </button>
      </div>

      {/* 선형 차트 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {selectedType === "human" && "유동인구"}
            {selectedType === "sales" && "매출"}
            {selectedType === "competitors" && "경쟁업체"} 추이 (2020~2026)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={predictionData} type={selectedType} />
        </CardContent>
      </Card>

      {/* 2026년 예측 카드 */}
      {latestPrediction && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">2026년 유동인구 예측</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatValue(latestPrediction.human, "human")}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">
                  {((latestPrediction.human / parseFloat(currentHuman?.replace(/[^0-9.]/g, '') || '50000') - 1) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <CardTitle className="text-sm">2026년 매출 예측</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatValue(latestPrediction.sales, "sales")}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">
                  {((latestPrediction.sales / parseFloat(currentSales?.replace(/[^0-9.]/g, '') || '50000') - 1) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm">2026년 경쟁업체 예측</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatValue(latestPrediction.competitors, "competitors")}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">
                  {((latestPrediction.competitors / (currentCompetitors || 30) - 1) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

