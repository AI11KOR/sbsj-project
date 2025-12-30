"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import {
  Building2,
  MapPin,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Search,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Heart,
  Bell,
  Bot,
  ChevronRight,
  Star,
  Award,
  Target,
} from "lucide-react"
import { useAuthStore } from "@/src/stores/authStore"
import { useChatBotStore } from "@/src/stores/chatBotStore"

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()
  const { openChatbot } = useChatBotStore()

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const banners = [
    {
      title: "강남역 상권 분석",
      description: "유동인구 1위! 강남역 인근 점포 추천",
      location: "서울 강남구",
      badge: "인기",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "홍대 핫플레이스",
      description: "젊은 층 타겟! 홍대 상권 완벽 분석",
      location: "서울 마포구",
      badge: "추천",
      gradient: "from-lime-500 to-green-600",
    },
    {
      title: "판교 테크노밸리",
      description: "IT 기업 밀집! 높은 구매력의 상권",
      location: "경기 성남시",
      badge: "NEW",
      gradient: "from-green-500 to-emerald-600",
    },
  ]

  const features = [
    {
      icon: MapPin,
      title: "지도 기반 상권 분석",
      onClick: () => {
        router.push("/map")
      },
      description: "카카오맵 API로 원하는 위치를 선택하고 주변 정보를 한눈에 확인하세요",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: TrendingUp,
      title: "시각화 데이터",
      onClick: () => {
        router.push("/map")
      },
      description: "업종별, 지역별 데이터를 시각화하여 쉽게 확인하세요",
      gradient: "from-lime-500 to-green-500",
    },
    {
      icon: Users,
      title: "커뮤니티",
      onClick: () => {
        router.push("/board")
      },
      description: "실제 창업자들의 생생한 경험과 정보를 나누세요",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: MessageSquare,
      title: "chat bot 상담",
      className: "cursor-default",
      description: "AI 챗봇으로 창업에 대한 질문을 무료로 상담받으세요",
      gradient: "from-teal-500 to-cyan-500",
    },
  ]

  const stats = [
    { label: "등록 매물", value: "12,458", unit: "건", icon: Building2 },
    { label: "회원 수", value: "8,234", unit: "명", icon: Users },
    { label: "상권 분석", value: "3,567", unit: "건", icon: BarChart3 },
    { label: "만족도", value: "98.5", unit: "%", icon: Star },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div
          className={`relative max-w-7xl mx-auto px-4 py-24 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-6 text-base px-6 py-2 shadow-lg animate-bounce-slow">
              <Sparkles className="h-4 w-4 mr-2" />
              자영업자와 소상공인을 위한 스마트 플랫폼
            </Badge>
            <h1 className="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-8 animate-fade-in">
              상부상조
            </h1>
            <p className="text-2xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              상권 부동산 정보를 상시 분석하며 조사해드립니다
            </p>
            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              데이터 기반의 정확한 분석으로 성공적인 창업을 시작하세요
            </p>
          </div>

          <div className="max-w-5xl mx-auto mb-12">
            <Card className="overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-shadow">
              <div className={`relative bg-gradient-to-br ${banners[currentBanner].gradient} p-12 md:p-16 text-white`}>
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="relative z-10">
                  <Badge className="mb-5 bg-white/95 text-primary border-0 text-sm px-4 py-1.5 font-semibold shadow-lg">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    {banners[currentBanner].badge}
                  </Badge>
                  <h3 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{banners[currentBanner].title}</h3>
                  <p className="text-xl md:text-2xl mb-6 text-white/95 text-balance">
                    {banners[currentBanner].description}
                  </p>
                  <div className="flex items-center gap-3 text-white/90">
                    <MapPin className="h-6 w-6" />
                    <span className="text-lg font-medium">{banners[currentBanner].location}</span>
                  </div>
                </div>
              </div>
            </Card>
            <div className="flex justify-center gap-3 mt-6">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentBanner ? "w-12 bg-primary shadow-lg" : "w-2.5 bg-border hover:bg-border/70"
                  }`}
                  aria-label={`배너 ${index + 1}로 이동`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Button
              size="lg"
              className="min-w-[240px] text-lg h-14 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              asChild
            >
              <Link href="/map">
                <Search className="mr-2 h-5 w-5" />
                AI 입지 추천 시작
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-w-[240px] text-lg h-14 bg-background/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              asChild
            >
              <Link href="/board">
                커뮤니티 둘러보기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-6 text-base px-6 py-2 shadow-lg">
              <Target className="h-4 w-4 mr-2" />
              핵심 기능
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              데이터 기반의 스마트한 상권 분석
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance">
              상부상조는 다양한 데이터를 분석하여 최적의 창업 위치를 찾아드립니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                onClick={feature.onClick}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden relative cursor-pointer"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
                ></div>
                <CardHeader className="pb-4 relative">
                  <div
                    className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl w-fit mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base md:text-lg leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-6 text-base px-6 py-2 shadow-lg">
                <Award className="h-4 w-4 mr-2" />왜 상부상조인가?
              </Badge>
              <h2 className="text-5xl md:text-5xl font-bold mb-8 leading-relaxed">성공적인 창업을 위한<br className="mb-2"/> 완벽한 파트너</h2>
              <div className="space-y-5">
                {[
                  "실시간으로 업데이트되는 정확한 데이터",
                  "전문가가 분석한 상권 리포트",
                  "실제 창업자들의 생생한 후기",
                  "24시간 AI 챗봇 상담 서비스",
                  "관심 지역 알림 서비스",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <CheckCircle2 className="h-7 w-7 text-primary flex-shrink-0 mt-1" />
                    <span className="text-xl">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="mt-10 text-base h-12" asChild>
                <Link href="/user/signup">
                  지금 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Link href="/map" className="col-span-2 group">
                <Card className="col-span-2 bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer">
                  <CardContent className="p-8">
                    <BarChart3 className="h-14 w-14 mb-5 group-hover:scale-110 transition-transform" />
                    <h3 className="text-3xl font-bold mb-3">전국 상권 데이터</h3>
                    <p className="text-primary-foreground/90 text-lg">
                      전국 주요 상권의 매출, 유동인구, 경쟁 현황을 한눈에
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-primary-foreground/80">
                      <span className="text-sm">지도에서 확인하기</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <MapPin className="h-12 w-12 text-primary mb-5" />
                  <h3 className="text-xl font-bold mb-3">정확한 위치</h3>
                  <p className="text-sm text-muted-foreground">카카오맵 기반 정밀 분석</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <Users className="h-12 w-12 text-secondary mb-5" />
                  <h3 className="text-xl font-bold mb-3">커뮤니티</h3>
                  <p className="text-sm text-muted-foreground">실전 노하우 공유</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-muted/60 py-16 px-4 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="h-7 w-7 text-primary" />
                <span className="text-2xl font-bold">상부상조</span>
              </div>
              <p className="text-muted-foreground mb-5 text-balance text-base leading-relaxed">
                상권 부동산 정보를 상시 분석하며 조사해드립니다
              </p>
              <p className="text-sm text-muted-foreground">자영업자와 소상공인의 성공적인 창업을 응원합니다</p>
            </div>
            <div>
              <h3 className="font-semibold mb-5 text-lg">서비스</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link href="/map" className="hover:text-primary transition-colors">
                    상권 분석
                  </Link>
                </li>
                <li>
                  <Link href="/board" className="hover:text-primary transition-colors">
                    커뮤니티
                  </Link>
                </li>
                <li>
                  <Link href="/user/mypage" className="hover:text-primary transition-colors">
                    마이페이지
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-5 text-lg">고객지원</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    문의하기
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>© 2025 상부상조. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
