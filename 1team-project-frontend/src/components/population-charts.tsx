////////////////////////
// 유동인구 차트 컴포넌트
////////////////////////

"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Users, BarChart3 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";

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

const GENDER_COLORS = {
  '남성': '#3B82F6',
  '여성': '#EC4899'
};

interface PopulationChartsProps {
  populationData: PopulationData | null;
}

// 숫자 포맷팅
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num));
};

// 성별 유동인구 데이터 가공
const getGenderChartData = (populationData: PopulationData | null) => {
  if (!populationData?.gender) return [];
  
  return populationData.gender.map(item => ({
    name: item.성별 === '남자' ? '남성' : '여성',
    value: Math.round(item['성별총합']),
    percentage: item['성별비율(%)'].toFixed(1)
  }));
};

// 연령대별 유동인구 데이터 가공
const getAgeChartData = (populationData: PopulationData | null) => {
  if (!populationData?.age) return [];
  
  const ageChartData = populationData.age.map(item => {
    const ageGroup = item.연령대.replace('남자', '').replace('여자', '');
    const gender = item.연령대.includes('남자') ? '남성' : '여성';
    return {
      age: ageGroup,
      gender: gender,
      value: Math.round(item.합계)
    };
  });
  
  // 연령대별로 그룹화
  const ageGroups: { [key: string]: any } = {};
  ageChartData.forEach(item => {
    if (!ageGroups[item.age]) {
      ageGroups[item.age] = { age: item.age, 남성: 0, 여성: 0 };
    }
    ageGroups[item.age][item.gender] = item.value;
  });
  
  return Object.values(ageGroups).sort((a: any, b: any) => {
    const ageA = parseInt(a.age.replace('대', ''));
    const ageB = parseInt(b.age.replace('대', ''));
    return ageA - ageB;
  });
};

// 커스텀 툴팁 컴포넌트
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded shadow-lg">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {formatNumber(payload[0].value)}명 ({payload[0].payload.percentage}%)
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
        <p className="font-semibold mb-2">{payload[0].payload.age}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}명
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PopulationCharts({ populationData }: PopulationChartsProps) {
  const genderChartData = getGenderChartData(populationData);
  const ageChartData = getAgeChartData(populationData);

  if (!populationData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 성별 유동인구 - 원그래프 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-lg">성별 유동인구</h4>
        </div>
        <h2 className="text-xs text-muted-foreground font-semibold mb-4">
          2024년 평균 유동인구 자료를 기준으로 분석되었습니다.
        </h2>
        <Card className="bg-muted/30 relative">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, payload }) => `${name} ${payload.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name as keyof typeof GENDER_COLORS]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              {genderChartData.map((item) => (
                <div key={item.name} className="bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: GENDER_COLORS[item.name as keyof typeof GENDER_COLORS] }}
                    />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </div>
                  <p className="text-lg font-bold">{formatNumber(item.value)}명</p>
                  <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 연령대별 유동인구 - 막대그래프 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-lg">연령대별 유동인구</h4>
        </div>
        <h2 className="text-xs text-muted-foreground font-semibold mb-4">
          2024년 평균 유동인구 자료를 기준으로 분석되었습니다.
        </h2>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={ageChartData}
                margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="age" 
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
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="남성" fill={GENDER_COLORS['남성']} radius={[4, 4, 0, 0]} />
                <Bar dataKey="여성" fill={GENDER_COLORS['여성']} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

