// // zustand 전역 상태 관리
// import { create } from 'zustand'
// import { persist, createJSONStorage } from 'zustand/middleware'

// // 상태관리 타입 정의
// interface BoardState {
//     board: Board[]
//     setBoard: (board: Board[]) => void
// }

// const useBoardStore = create<BoardState>()(
//     persist(
//         (set) => ({
//             board: [],
//             setBoard: (board: Board[]) => set({ board }),
//         })
//     )
// )