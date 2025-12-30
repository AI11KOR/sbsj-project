"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useAuthStore, type AuthState } from "@/src/stores/authStore"

interface User {
  id?: string | number
  user_id?: string
  email?: string
  name?: string
  nickname?: string
  role?: string
  accessToken?: string
  refreshToken?: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const mapStoreUserToContextUser = (storeUser: AuthState["user"] | undefined): User | null => {
  if (!storeUser) return null
  return {
    id: storeUser.idx,
    user_id: storeUser.email,
    email: storeUser.email,
    name: storeUser.nickname,
    nickname: storeUser.nickname,
    role: storeUser.role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storeUser = useAuthStore((state) => state.user)
  const storeLogin = useAuthStore((state) => state.login)
  const storeLogout = useAuthStore((state) => state.logout)

  const value = useMemo<AuthContextType>(() => {
    return {
      user: mapStoreUserToContextUser(storeUser),
      login: async (userData: User) => {
        // useAuthStore와 호환되도록 변환
        storeLogin({
          user: {
            idx: typeof userData.id === "number" ? userData.id : Number(userData.id ?? 0),
            email: userData.user_id || userData.email || "",
            nickname: userData.nickname || userData.name || "",
            role: (userData.role as "guest" | "member" | "admin") || "member",
          },
          accessToken: userData.accessToken || "",
          refreshToken: userData.refreshToken || "",
        })
      },
      signup: async (_email: string, _password: string, _name: string) => {
        // 회원가입 API는 각 페이지/폼에서 직접 호출하므로
        // 컨텍스트 레벨에서는 추가 동작이 필요하지 않음
        return
      },
      logout: async () => {
        await storeLogout()
      },
      isLoading: false,
    }
  }, [storeUser, storeLogin, storeLogout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
