"use client"
import { useAuth } from "@/src/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Title } from "@radix-ui/react-toast"

const carDData = [
    {
        id: 1,
        title: '게시글',
        content: '게시글 확인 및 수정 삭제 등',
        color:'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
        border: "#ffb74d",
        path: "/admin/board",
    },
    {
        id: 2,
        title: '회원관리',
        content: '회원정보 확인 및 수정',
        color: "linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)",
        border: "#81d4fa",
        path: "/admin/user",
    }
]

export default function AdminDashboardPage() {


    const [activeCard, setActiveCard] = useState(1)
    const router = useRouter()
    const sortedCards = [...carDData].sort((a, b) => (a.id === activeCard ? -1 : b.id === activeCard ? 1 : 0))


    const { user } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false)
    useEffect(() => {
        if (user?.role === "admin") {
            setIsAdmin(true)
        }
    }, [user])
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700">
                <p>접근 권한이 없습니다</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary to-secondary p-20 flex flex-col items-center justify-start">
      {/* 제목 영역 - 위쪽에 고정 */}
      <Title className="text-4xl font-extrabold text-white mb-4 cursor-default">
        관리자 대시보드
      </Title>

      <div className="text-center mb-10 text-white cursor-default">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 opacity-90 font-medium">
          시스템 관리 및 모니터링
        </p>
      </div>

      {/* 🔹 카드 덱 컨테이너 (중앙에 포개지는 영역) */}
      <div className="relative w-[450px] h-[600px] mx-auto">
        {sortedCards.map((card, index) => {
          const isActive = activeCard === card.id

          return (
            <div
              key={card.id}
              onClick={() => setActiveCard(card.id)}
              className={[
                // 예전 .card 역할
                "absolute left-1/2 top-1/2",
                "w-[350px] h-[450px] rounded-2xl border cursor-pointer",
                "shadow-[0_20px_40px_rgba(0,0,0,0.15)]",
                "transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
                "opacity-90 overflow-hidden backdrop-blur-lg",
                "[transform-style:preserve-3d]",
                isActive &&
                  "opacity-100 shadow-[0_25px_50px_rgba(0,0,0,0.3)]",
              ].join(" ")}
              style={{
                zIndex: carDData.length - index,
                transform: isActive
                  // 활성 카드: 살짝 위로, 살짝 크게
                  ? "translate(-50%, -50%) translateY(-10px) scale(1.05) rotateY(0deg)"
                  // 비활성 카드: 조금 옆으로 밀어서 포개진 느낌
                  : `translate(-50%, -50%) translateX(${index * 40}px) rotateY(-5deg)`,
                background: card.color,
                borderColor: card.border,
              }}
            >
              {/* 🔹 카드 내용 (비활성도 내용 보이도록) */}
              <div
                className={[
                  "relative z-10 h-[90%] flex flex-col justify-start px-8 py-8",
                  "transition-all duration-500",
                  isActive
                    ? "opacity-100 translate-y-0"
                    : "opacity-80 translate-y-1", // ⬅ 비활성도 살짝만 내려가게
                ].join(" ")}
              >
                <h3 className="text-2xl font-extrabold text-slate-900 mb-5 tracking-tight drop-shadow">
                  {card.title}
                </h3>

                <p className="text-base leading-relaxed text-slate-600 mb-10 font-medium flex-grow">
                  {card.content}
                </p>

                {/* 🔹 버튼은 활성 카드에서만 표시 */}
                {isActive && (
                  <div className="mt-auto pt-6 border-t-2 border-white/40">
                    <button
                      className={[
                        "relative w-full px-6 py-4 rounded-xl font-bold text-base tracking-tight cursor-pointer",
                        "bg-gradient-to-br from-slate-900 to-slate-800 text-white",
                        "shadow-[0_8px_25px_rgba(30,41,59,0.3)]",
                        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        "overflow-hidden",
                        "hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(30,41,59,0.4)]",
                        "active:translate-y-0 active:shadow-[0_6px_20px_rgba(30,41,59,0.3)]",
                        "before:content-[''] before:absolute before:inset-y-0 before:-left-full",
                        "before:w-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                        "before:transition-[left] before:duration-500 hover:before:left-full",
                      ].join(" ")}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(card.path)
                      }}
                    >
                      {card.title} 관리하러 가기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
    )
}