"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar"
import { Badge } from "@/src/components/ui/badge"
import { Menu, X, User, Settings, LogOut, Bell, Heart, Newspaper } from "lucide-react"
import Image from "next/image"
import { cn } from "@/src/lib/utils"
import { useAuthStore } from "@/src/stores/authStore"
import { useRouter } from "next/navigation"
import { getNotifications, type Notification } from "@/src/api/notificationApi"

export function Header() {
  const { user, logout, updateNickname } = useAuthStore()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const router = useRouter()

  // 알림 데이터 가져오기
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      const response = await getNotifications()
      if (response?.data) {
        setNotifications(response.data)
      }
    } catch (error) {
      console.error("알림 조회 실패:", error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  // 알림 업데이트 이벤트 리스너
  useEffect(() => {
    const handleNotificationUpdate = () => {
      fetchNotifications()
    }

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('notification-updated', handleNotificationUpdate)

    // 주기적으로 알림 확인 (30초마다)
    const interval = setInterval(() => {
      if (user) {
        fetchNotifications()
      }
    }, 30000)

    return () => {
      window.removeEventListener('notification-updated', handleNotificationUpdate)
      clearInterval(interval)
    }
  }, [user, fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const navItems = [
    { name: "홈", href: "/" },
    { name: "지도 분석", href: "/map" },
    { name: "커뮤니티", href: "/board" },
    { name: "정보망", href: "/news" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
          <div className="p-1.5 bg-white border-2 border-green-500 rounded-xl shadow-md">
            <Image 
              src="/main_logo.png" 
              alt="상부상조 로고" 
              width={32} 
              height={32}
              className="object-contain"
            />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">상부상조</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/10" asChild>
                <Link href="/user/mypage?tab=notifications">
                  {/* <div className="text-lg font-medium mr-150 hover:opacity-80 transition-opacity w-100 hover:default text-center cursor-default">
                    <strong>{user?.nickname || user?.email}</strong> 
                    님 환영합니다
                  </div> */}
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs animate-pulse absolute -top-2 -right-1">
                {unreadCount}
              </Badge>
            )}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-primary/10 cursor-pointer">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                        {user.nickname?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block font-medium">{user.nickname || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user.nickname || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/user/mypage" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      마이페이지
                    </Link>
                  </DropdownMenuItem>
                  {
                    // 관리자 권한 확인 관리자 인 경우 관리자 대시보드 표시 
                    // 즉, 관리자(role===admin)이고 이메일(email)이 admin@admin.com인 경우 관리자 대시보드 표시
                    user.role === 'admin' && user.email === 'admin@admin.com' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Heart className="mr-2 h-4 w-4" />
                          관리자 대시보드
                        </Link>
                      </DropdownMenuItem>
                    )
                  }
                  
                  {/* <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      설정
                    </Link>
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      await logout();
                      router.push('/user/login');
                    }} 
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild className="hover:bg-primary/10">
                <Link href="/user/login">로그인</Link>
              </Button>
              <Button asChild className="shadow-md">
                <Link href="/user/signup">회원가입</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted active:bg-muted",
                )}
              >
                {item.name}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  href="/user/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  로그인
                </Link>
                <Link
                  href="/user/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
