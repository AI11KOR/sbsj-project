// // zustand 전역 상태 관리 (TypeScript + Next.js)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import API from '@/src/api/axiosApi'

type Role = 'guest' | 'member' | 'admin'

type User = {
    idx: number
    email: string
    nickname: string
    role: Role
}

// getTokenFromStore 함수를 authStore에서 사용하기 위해 정의
const getTokenFromStore = () => {
    if (typeof window !== 'undefined') {
        try {
            const authStore = localStorage.getItem('auth-store')
            if (authStore) {
                const parsed = JSON.parse(authStore)
                return {
                    accessToken: parsed.state?.accessToken || null,
                    refreshToken: parsed.state?.refreshToken || null,
                }
            }
        } catch (error) {
            console.error('Error reading token from store:', error)
        }
    }
    return { accessToken: null, refreshToken: null }
}

export type AuthState = {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isLoggedIn: boolean
    // actions
    login: (payload: {
        user: User;
        accessToken: string;
        refreshToken: string;
    }) => void
    logout: () => Promise<void>
    updateNickname: (nickname: string) => void
    updateAccessToken: (accessToken: string) => void
}

export const useAuthStore = create(
    persist<AuthState>(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoggedIn: false,

            login: ({ user, accessToken, refreshToken }) =>
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isLoggedIn: true,
                }),

            logout: async () => {
                // 백엔드에 로그아웃 요청 (DB에서 토큰 무효화)
                try {
                    const { refreshToken } = getTokenFromStore();
                    if (refreshToken) {
                        await API.post('/user/logout', { refreshToken });
                    }
                } catch (error) {
                    // 로그아웃 API 실패해도 프론트엔드 상태는 초기화
                    console.error('Logout API error:', error);
                }
                
                // 프론트엔드 상태 초기화
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isLoggedIn: false,
                });
            },

            updateNickname: (nickname) =>
                set((state) => 
                    state.user
                    ? { user: { ...state.user, nickname } }
                    : state
            ),

            updateAccessToken: (accessToken) =>
                set({ accessToken }),
        }),
        {
            name: 'auth-store',
            storage: createJSONStorage(() => localStorage),
            // 저장할 ㅣㄹ드만 선택 (예: 로딩 상태 같은 건 안 저장)
            partialize: (state) => ({ 
                user: state.user, 
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isLoggedIn: state.isLoggedIn 
            } as AuthState),
        }
    )
)