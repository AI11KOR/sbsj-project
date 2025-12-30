"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Progress } from "@/src/components/ui/progress"
import { MapPin, Users, DollarSign, Store, TrendingUp, Star, Sparkles } from "lucide-react"

interface LocationRecommendation {
  id: number
  name: string
  address: string
  totalScore: number
  scores: {
    traffic: number
    rent: number
    competitors: number
    location: number
  }
  description: string
  lat: number
  lng: number
}

interface LocationRecommendationsProps {
  recommendations: LocationRecommendation[]
  onSelectLocation: (location: LocationRecommendation) => void
  onClose: () => void
}

export function LocationRecommendations({ recommendations, onSelectLocation, onClose }: LocationRecommendationsProps) {
  const topRecommendation = recommendations[0]

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">분석 결과</h2>
            <p className="text-sm text-muted-foreground">가장 적합한 창업 입지를 찾아드렸습니다.</p>
          </div>
        </div>
      </div>

      {/* Top 3 Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-3">TOP 3 추천 입지</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommendations.slice(0, 3).map((location, index) => (
            <button
              key={location.id}
              onClick={() => onSelectLocation(location)}
              className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-lg ${
                index === 0 ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant={index === 0 ? "default" : "secondary"} className="text-sm">
                  {index + 1}
                </Badge>
                {index === 0 && (
                  <Badge variant="default" className="bg-accent text-accent-foreground">
                    추천
                  </Badge>
                )}
              </div>
              <h4 className={`font-semibold mb-1 ${index === 0 ? "text-primary" : ""}`}>{location.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{location.address}</p>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3 w-3 fill-accent text-accent" />
                <span className="font-medium">{location.totalScore}점</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Location Detail */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl mb-1">{topRecommendation.name}</CardTitle>
              <CardDescription>{topRecommendation.address}</CardDescription>
              {topRecommendation.id === 1 && (
                <Badge className="mt-2 bg-accent text-accent-foreground">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Best Match
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1">{topRecommendation.totalScore}</div>
              <p className="text-xs text-muted-foreground">총합 점수</p>
              <p className="text-xs text-accent font-medium mt-1">이 지역은 가장 적합합니다</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">항목별 분석</h4>
            <div className="space-y-3">
              {/* Traffic Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">입지</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{topRecommendation.scores.traffic}점</span>
                </div>
                <Progress value={topRecommendation.scores.traffic} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  지하철역 도보 2분 거리로 접근성이 우수한 프리미엄 입지입니다
                </p>
              </div>

              {/* Rent Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-secondary/10 rounded">
                      <DollarSign className="h-4 w-4 text-secondary" />
                    </div>
                    <span className="text-sm font-medium">유동인구</span>
                  </div>
                  <span className="text-sm font-bold text-secondary">{topRecommendation.scores.rent}점</span>
                </div>
                <Progress value={topRecommendation.scores.rent} className="h-2 [&>div]:bg-secondary" />
                <p className="text-xs text-muted-foreground mt-1">
                  평균 31,000명/일의 유동인구로 충분한 잠재 고객을 확보합니다
                </p>
              </div>

              {/* Competitors Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-accent/10 rounded">
                      <Store className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium">임대료</span>
                  </div>
                  <span className="text-sm font-bold text-accent">{topRecommendation.scores.competitors}점</span>
                </div>
                <Progress value={topRecommendation.scores.competitors} className="h-2 [&>div]:bg-accent" />
                <p className="text-xs text-muted-foreground mt-1">
                  평균 대비 15% 저렴한 임대료로 초기 비용을 절감할 수 있습니다
                </p>
              </div>

              {/* Location Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">경쟁업체</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{topRecommendation.scores.location}점</span>
                </div>
                <Progress value={topRecommendation.scores.location} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  동종 업계 경쟁업체가 없어 시장 포화도가 낮은 청정 상권입니다
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-background/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm">AI 추천 분석</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{topRecommendation.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={() => onSelectLocation(topRecommendation)} className="flex-1" size="lg">
              <MapPin className="h-4 w-4 mr-2" />
              지도에서 보기
            </Button>
            <Button onClick={onClose} variant="outline" size="lg">
              닫기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">참고:</strong> 위치를 클릭하면 지도에서 상세한 상권 정보를 확인할 수
            있습니다. 평점 위치: 약속 장소로 주변 맛집 추천시 이용할 경우 고객층을 고려하였습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
