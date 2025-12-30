"use client"

import type React from "react"
import { useEffect } from "react"

import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Chatbot } from "./chatbot"
import { RankingsSidebar } from "./rankings-sidebar"
import { useAuthStore } from "@/src/stores/authStore"
import { refreshToken } from "@/src/api/axiosApi"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/user/login" || pathname === "/user/signup"
  const isMapPage = pathname === "/map"
  const { isLoggedIn } = useAuthStore()

  // 주기적으로 토큰 갱신 (1분마다 확인, 만료되기 전에 갱신)
  useEffect(() => {
    if (!isLoggedIn) return;

    // 즉시 한 번 실행 (컴포넌트 마운트 시)
    refreshToken();

    // 1분마다 토큰 만료 시간 확인 및 갱신
    const interval = setInterval(() => {
      refreshToken();
    }, 60 * 1000); // 1분마다 확인

    return () => {
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  return (
    <>
      <Header />
      <div className="flex">
        <main className={`flex-1 ${!isMapPage && !isAuthPage ? "lg:mr-80" : ""}`}>{children}</main>
        {!isAuthPage && !isMapPage && <RankingsSidebar />}
      </div>
      {!isAuthPage && <Chatbot />}
    </>
  )
}
