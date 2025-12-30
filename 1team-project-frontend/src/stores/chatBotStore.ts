// zustand 전역 상태 관리 - 챗봇 열림/닫힘 상태
import { create } from 'zustand'

export type ChatBotState = {
    isOpen: boolean
    // actions
    openChatbot: () => void
    closeChatbot: () => void
    toggleChatbot: () => void
}

export const useChatBotStore = create<ChatBotState>((set) => ({
    isOpen: false,

    // 챗봇 열기
    openChatbot: () => set({ isOpen: true }),

    // 챗봇 닫기
    closeChatbot: () => set({ isOpen: false }),

    // 챗봇 토글 (열려있으면 닫고, 닫혀있으면 열기)
    toggleChatbot: () => set((state) => ({ isOpen: !state.isOpen })),
}))

