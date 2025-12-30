"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { TrendingUp, MapPin, Trophy, ChevronRight, X } from "lucide-react"
import { cn } from "@/src/lib/utils"
import API from "@/src/api/axiosApi"

interface RankingItem {
  rank: number
  district: string | null
  city: string | null
  count: number
}

export function RankingsSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await API.get("/api/map/district-rankings")
        if (response.data?.data) {
          setRankings(response.data.data)
        }
      } catch (error) {
        console.error("순위 데이터 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [])

  if (isCollapsed) {
    return (
      <Button
        onClick={() => setIsCollapsed(false)}
        variant="outline"
        size="icon"
        className="fixed right-4 top-24 z-40 shadow-lg"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-background border-l overflow-y-auto z-40 hidden lg:block">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">현재 인기있는 구</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              순위 데이터를 불러오는 중...
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              순위 데이터가 없습니다.
            </div>
          ) : (
            rankings.map((item, index) => (
              // <Link 
              //   key={`${item.rank}-${item.district}-${index}`} 
              //   href={`/map?location=${encodeURIComponent(item.district || '')}`}
              // >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm flex-shrink-0",
                          item.rank === 1
                            ? "bg-yellow-500 text-white"
                            : item.rank === 2
                              ? "bg-gray-400 text-white"
                              : item.rank === 3
                                ? "bg-orange-600 text-white"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {item.district ? `${item.district}` : '알 수 없음'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {item.city ? `${item.city} ` : ''}{item.district ? `${item.district}` : '주소 없음'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            <span className="font-medium">누적 검색 수:{item.count}건</span>
                          </div>
                          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden ml-2 max-w-[80px]">
                            <div 
                              className="h-full bg-primary" 
                              style={{ 
                                width: `${Math.min(100, (item.count / (rankings[0]?.count || 1)) * 100)}%` 
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              // </Link>
            ))
          )}

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">실시간 업데이트</p>
              <p className="text-xs text-muted-foreground">매시간 상권 데이터가 갱신됩니다</p>
            </CardContent>
          </Card>

          <Button className="w-full bg-transparent" variant="outline" asChild>
            <Link href="/map">전체 상권 보기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
