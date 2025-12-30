"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Newspaper, ExternalLink, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { getNews, type NewsArticle } from "@/src/api/newsApi"

// 기사 데이터 (폴백용 - 크롤링 실패 시 사용)
const fallbackArticles: NewsArticle[] = [
  {
    id: "1",
    title: "'최대 360만원' 소상공인 아이돌봄서비스 확대…기준완화·가사지원",
    excerpt: "서울시는 소상공인 대상 민간 아이돌봄서비스 지원을 확대해 일‧육아 병행이 가능한 환경 조성에 힘쓴다. 경기 침체와 물가 상승으로 소상공인들의 어려움이 커지는 가운데, 서울시는 소상공인 사업주와 종사자 대상으로 추진하고 있는 '소상공인 민간 아이돌봄서비스 지원사업'의 자격요건을 대폭 완화해 지원을 확대한다. ‘소상공인 민간 아이돌봄서비스 지원사업’은 자녀를 키우는 소상공인이 민간기관에서 아이돌봄서비스를 이용할 경우, 시간당 돌봄비의 2/3를 서울시가 지원해 주는 정책이다.",
    link: "https://mediahub.seoul.go.kr/archives/2013897",
    date: "2025.03.28",
    source: "서울시 미디어허브",
  },
  {
    id: "2",
    title: "서초 12개 주요상권 절반이 골목형상점가 지정",
    excerpt: "방배역먹자골목, 아이러브서초강남역 상권 제5, 6호 골목형상점가로! 27일 방배역먹자골목 및 강남역 일대 제5호, 제6호 골목형상점가로 지정 완료",
    link: "https://v.daum.net/v/20251128084425391",
    date: "2025.11.28",
    source: "문화일보",
  },
  {
    id: "3",
    title: "나도 모르게 이곳으로 발길을 잡으면 겨울읻, 수정생태",
    excerpt: "최근 자영업자 창업 트렌드를 분석한 결과, 온라인 쇼핑몰과 푸드트럭 사업이 급증하고 있는 것으로 나타났다. 특히 20-30대 젊은 창업자들의 비중이 높아지고 있으며, 디지털 마케팅 활용도가 높은 업종일수록 성공률이 높은 것으로 조사되었다.",
    link: "https://seoulpi.io/cityfolio/article/00489606236079468544",
    date: "2025.11.25",
    source: "Seoul Property Insight",
  },
  {
    id: "4",
    title: "부동산 투자 넘어 개발·운영까지 가능한 '프로젝트 리츠' 이달부터 도입",
    excerpt: "리츠(REITs·부동산투자회사)가 부동산 투자 외에 개발·운영까지 할 수 있도록 한 ‘프로젝트 리츠’가 이달부터 본격적으로 도입된다. 리츠는 다수의 투자자로부터 자금을 모아",
    link: "https://www.chosun.com/economy/real_estate/2025/11/25/GQ4DCMDEGYYTKMBWGQ3TMYRTGA/",
    date: "2025.11.25",
    source: "조선일보",
  },
  {
    id: "5",
    title: "전국 100호점 돌파한 샤브올데이, 위례 상업지에 프랜차이즈 성공 모델 더해",
    excerpt: "위례 상권에 프리미엄 외식 플랫폼 상륙… ‘샤브올데이’ 100호점 출점으로 주목",
    link: "https://www.sangga114.co.kr/document/investment_detail?documentSrl=27495",
    date: "2025.05.13",
    source: "상가114",
  },
  {
    id: "6",
    title: "상가권리금, 감정평가로 보는 회수 기회의 경제학",
    excerpt: "법원감정인으로 마주하는 이 세상에 존재하는 무수히 많은 부동산 소송 중에 ‘상가 권리금 회수’ 분쟁이 있다. 자영업자라면 피땀 흘려 가게를 운영하면서 쌓은 영업적 가치",
    link: "https://magazine.hankyung.com/business/article/202511131315b",
    date: "2025.11.22",
    source: "한경 BUSINESS",
  },
  {
    id: "7",
    title: "소상공인, 자영업자 종합 대책",
    excerpt: "",
    link: "https://www.innovation.go.kr/ucms/bbs/B0000023/view.do?nttId=16911&menuNo=300107&pageIndex=1",
    date: "2024.07.04",
    source: "혁신24",
  },
  {
    id: "8",
    title: "소상공인, 자영업자 종합대책 발표",
    excerpt: "정부는 7.3(수) 대통령 주재 '2024년 하반기 경제정책방향 및 역동경제 로드맵' 발표 행사를 개최하여 '소상공인·자영업자 종합대책'을 확정·발표하였습니다.",
    link: "https://www.moef.go.kr/nw/nes/detailNesDtaView.do?searchBbsId1=MOSFBBS_000000000028&searchNttId1=MOSF_000000000069591&menuNo=4010100",
    date: "2024.07.03",
    source: "기획재정부",
  },
  {
    id: "9",
    title: "文때 폐기됐는데…조국이 쏘아 올린 ‘토지공개념’ 대체 뭐길래",
    excerpt: "토지 공적 통제 및 소유권 제한 확대할 수 있는 개념 토허제 등 이미 도입 중인데…저항 가능성",
    link: "https://n.news.naver.com/article/016/0002563211",
    date:"2025.11.26",
    source: "N뉴스"
    
  }
]

export default function NewsPage() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  // 뉴스 데이터 로드 (한 번만 실행)
  useEffect(() => {
    // 이미 데이터가 있으면 다시 로드하지 않음
    if (newsArticles.length > 0 && !isLoading) {
      return
    }

    const loadNews = async () => {
      setIsLoading(true)
      setError(null)
      try {
        console.log('[NewsPage] 뉴스 로드 시작...')
        
        // 필터링 적용하여 뉴스 가져오기
        const articles = await getNews(true) // 키워드 필터링 활성화
        console.log(`[NewsPage] 필터링 후: ${articles.length}개 기사`)
        
        if (articles.length > 0) {
          setNewsArticles(articles)
        } else {
          // 기사가 없으면 폴백 데이터 사용
          setNewsArticles(fallbackArticles)
          setError('뉴스를 불러올 수 없어 기본 데이터를 표시합니다.')
        }
      } catch (err: any) {
        console.error('[NewsPage] 뉴스 로드 실패:', err)
        setError(err.message || '뉴스를 불러오는데 실패했습니다.')
        // 오류 시 폴백 데이터 사용 (이전 데이터가 있으면 유지)
        if (newsArticles.length === 0) {
          setNewsArticles(fallbackArticles)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadNews()
  }, []) // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

  // 첫 페이지의 기사만 슬라이더에 사용 (newsArticles가 변경될 때마다 업데이트)
  const firstPageArticles = useMemo(() => {
    return newsArticles.slice(0, ITEMS_PER_PAGE)
  }, [newsArticles]) // newsArticles를 의존성으로 추가

  // 메인 슬라이더 자동 전환 (5초마다)
  useEffect(() => {
    if (firstPageArticles.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % firstPageArticles.length)
    }, 5000) // 3000 → 5000: 자동 전환 시간을 3초에서 5초로 늘림

    return () => clearInterval(interval)
  }, [firstPageArticles.length])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % firstPageArticles.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + firstPageArticles.length) % firstPageArticles.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // 페이지네이션 계산
  const totalPages = Math.ceil(newsArticles.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentArticles = useMemo(() => {
    return newsArticles.slice(startIndex, endIndex)
  }, [startIndex, endIndex])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // 페이지 번호 버튼 생성
  const getPageNumbers = () => {
    const pagesPerGroup = 5
    const pages: number[] = []
    const currentGroup = Math.ceil(currentPage / pagesPerGroup)
    const startPage = (currentGroup - 1) * pagesPerGroup + 1
    const endPage = Math.min(currentGroup * pagesPerGroup, totalPages)
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">뉴스를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">정보망</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          취업동향 및 자영업자 관련 최신 정보를 확인하세요
        </p>
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ {error} (폴백 데이터를 표시합니다)
            </p>
          </div>
        )}
      </div>

      {/* 메인 슬라이더 */}
      {firstPageArticles.length > 0 && (
        <div className="mb-12">
          <div className="relative w-full">
            <div className="overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {firstPageArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="w-full flex-shrink-0 px-2"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Card
                    className={cn(
                      "h-120 cursor-pointer transition-all duration-300 border-2",
                      hoveredIndex === index
                        ? "border-primary shadow-xl scale-[1.02] bg-primary/5"
                        : "border-primary/10 hover:border-primary/30"
                    )}
                    onClick={() => window.open(article.link, "_blank")}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-6 flex-wrap">
                            <Badge variant="secondary" className="text-xl">
                              {article.source}
                            </Badge>
                            <span className="text-xm text-muted-foreground">{article.date}</span>
                          </div>
                          <h3
                            className={cn(
                              "font-bold mb-4 transition-all duration-300 break-words",
                              hoveredIndex === index ? "text-2xl text-primary" : "text-6xl"
                            )}
                          >
                            {article.title}
                          </h3>
                          <p
                            className={cn(
                              "text-muted-foreground leading-relaxed transition-all duration-300 break-words mt-10",
                              hoveredIndex === index
                                ? "text-base line-clamp-5"
                                : "text-xm line-clamp-2"
                            )}
                          >
                            {article.excerpt}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "flex-shrink-0 transition-all duration-300",
                            hoveredIndex === index ? "opacity-100 scale-110" : "opacity-50"
                          )}
                        >
                          <ExternalLink className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      {hoveredIndex === index && (
                        <div className="mt-12 pt-6 border-t border-primary/20 animate-in fade-in duration-300">
                          <Button
                            variant="outline"
                            size="lg"
                            className="w-full mt-5"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(article.link, "_blank")
                            }}
                          >
                            <ExternalLink className="mr-2 h-5 w-4" />
                            전체 기사 보기
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* 이전/다음 버튼 */}
          {firstPageArticles.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg z-10 h-10 w-10"
                onClick={prevSlide}
                aria-label="이전 기사"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg z-10 h-10 w-10"
                onClick={nextSlide}
                aria-label="다음 기사"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* 인디케이터 */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {firstPageArticles.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted hover:bg-primary/50"
              )}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
        </div>
      )}

      {/* 기사 목록 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">최신 기사</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentArticles.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer hover:shadow-lg transition-all border-2 border-primary/10 hover:border-primary/30 h-full flex flex-col"
              onClick={() => window.open(article.link, "_blank")}
            >
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {article.source}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{article.date}</span>
                </div>
                <h4 className="font-bold text-lg mb-3 line-clamp-2 flex-1">{article.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{article.excerpt}</p>
                <Button variant="ghost" size="sm" className="w-full mt-auto">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  기사 보기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="min-w-[70px]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Button>
            {getPageNumbers().map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNumber)}
                className="min-w-[40px]"
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="min-w-[70px]"
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

