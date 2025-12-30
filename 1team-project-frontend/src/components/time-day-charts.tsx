////////////////////////
// 시간대/요일별 유동인구 차트 컴포넌트
////////////////////////

"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

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

const DAY_COLORS = {
  '월': '#3B82F6',
  '화': '#8B5CF6',
  '수': '#EC4899',
  '목': '#F59E0B',
  '금': '#10B981',
  '토': '#06B6D4',
  '일': '#EF4444'
};

interface TimeDayChartsProps {
  timeDayData: TimeDayData | null;
}

// 숫자 포맷팅
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num));
};

// 시간대별 데이터 가공
const getTimeChartData = (timeDayData: TimeDayData | null) => {
  if (!timeDayData?.time) return [];
  
  return timeDayData.time.map(item => ({
    시간대: item.시간대,
    유동인구: Math.round(item.유동인구),
  }));
};

// 요일별 데이터 가공
const getDayChartData = (timeDayData: TimeDayData | null) => {
  if (!timeDayData?.day) return [];
  
  return timeDayData.day.map(item => ({
    요일: item.요일,
    유동인구: Math.round(item.유동인구),
    color: DAY_COLORS[item.요일 as keyof typeof DAY_COLORS] || '#6B7280',
  }));
};

// 커스텀 툴팁 컴포넌트
const CustomLineTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded shadow-lg">
        <p className="font-semibold">{payload[0].payload.시간대}</p>
        <p className="text-sm text-muted-foreground">
          유동인구: {formatNumber(payload[0].value)}명
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded shadow-lg">
        <p className="font-semibold">{payload[0].payload.요일}요일</p>
        <p className="text-sm text-muted-foreground">
          유동인구: {formatNumber(payload[0].value)}명
        </p>
      </div>
    );
  }
  return null;
};

export default function TimeDayCharts({ timeDayData }: TimeDayChartsProps) {
  const timeChartData = getTimeChartData(timeDayData);
  const dayChartData = getDayChartData(timeDayData);

  if (!timeDayData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 시간대별 유동인구 - 선그래프 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-lg">시간대별 유동인구</h4>
        </div>
        <h2 className="text-xs text-muted-foreground font-semibold mb-4">
          24시간 평균 유동인구 자료를 기준으로 분석되었습니다.
        </h2>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={timeChartData}
                margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="시간대" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "11px" }}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "11px" }}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="유동인구" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 요일별 유동인구 - 막대그래프 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-lg">요일별 유동인구</h4>
        </div>
        <h2 className="text-xs text-muted-foreground font-semibold mb-4">
          요일별 평균 유동인구 자료를 기준으로 분석되었습니다.
        </h2>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={dayChartData}
                margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="요일" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "11px" }}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "11px" }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend />
                <Bar 
                  dataKey="유동인구" 
                  radius={[4, 4, 0, 0]}
                >
                  {dayChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* <div className="grid grid-cols-7 gap-2 mt-4">
              {dayChartData.map((item) => (
                <div key={item.요일} className="bg-background rounded-lg p-2 border text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold">{item.요일}</span>
                  </div>
                  <p className="text-sm font-bold">{formatNumber(item.유동인구)}</p>
                </div>
              ))}
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

