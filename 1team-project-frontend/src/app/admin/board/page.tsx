"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import API from "@/src/api/axiosApi"
import { Title } from "@radix-ui/react-toast"
import { Button } from "@/src/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog"

type BoardPost = {
    idx: number
    id?: number
    title: string
    content: string
    category: string | null
    tags: string | null
    views: number
    likes: number
    comments_count: number
    created_at: string
    users: {
        nickname: string | null
        user_id: string | null
        idx: number | null
    } | null
}

export default function AdminBoardPage() {
  const router = useRouter()

  // 게시판 리스트
  const [boards, setBoards] = useState<BoardPost[]>([])

  // 페이지네이션
  const [totalPage, setTotalPage] = useState(1)
  const [page, setPage] = useState(1)

  // 검색 상태
  const [searchField, setSearchField] = useState<"title" | "nickname" | "category">("title")
  const [keyword, setKeyword] = useState("")
  const [appliedKeyword, setAppliedKeyword] = useState("")

  const POSTS_PER_PAGE = 7
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [warningModalOpen, setWarningModalOpen] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState<BoardPost | null>(null)
  const [warningData, setWarningData] = useState<{ message: string; userId: string } | null>(null)

  


  // 관리자 게시판 조회 불러오기
  const fetchAdminBoard = async () => {
    try {
        setLoading(true)
        setError(null)
        const response = await API.get(`/admin/board`, {
            params: {
                page,
                limit: POSTS_PER_PAGE,
                type: searchField,
                keyword: appliedKeyword || undefined,
            }
        })
        const { data = [], pagination } = response.data ?? {}
        setBoards(Array.isArray(data) ? data : [])
        if (pagination) {
            if (pagination.currentPage && pagination.currentPage !== page) {
                setPage(pagination.currentPage)
            }
            setTotalPage(pagination.totalPages ?? 1)
        } else {
            setTotalPage(1)
        }
       
    } catch (error:any) {
        console.log(error);
        setError(error.response?.data?.message || '게시판 조회 실패')
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminBoard()
  }, [page, searchField, appliedKeyword])


  // search enter event
  const applySearch = () => {
    setPage(1)
    setAppliedKeyword(keyword.trim())
  }

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applySearch()
    }
  }

  const handleChangeSearchField = (field: "title" | "nickname" | "category") => {
    setSearchField(field)
    setPage(1)
  };



  // 게시글 상세페이지 이동
  const handleViewBoard = (boardId: number) => {
    router.push(`/board/${boardId}`)
  }

  // 특정 게시글 삭제하기
  const handleDeleteBoard = async (boardId: number) => {
    const board = boards.find(b => (b.id ?? b.idx) === boardId)
    if (!board) return
    
    setSelectedBoard(board)
    setDeleteModalOpen(true)
  }

  const confirmDeleteBoard = async () => {
    if (!selectedBoard) return
    const boardId = selectedBoard.id ?? selectedBoard.idx

    try {
      await API.delete(`/admin/board/${boardId}`)
      setDeleteModalOpen(false)
      setSelectedBoard(null)
      fetchAdminBoard() // 삭제 후 목록 다시 불러오기
    } catch (error: any) {
      console.log(error)
      alert(error.response?.data?.message || "게시글 삭제 실패")
    }
  }

  // 게시글에 대한 유저 경고 보내기 (지금은 호출만)
  const handleSendWarning = async (
    boardId: number,
    warningMessage: string,
    userId: string,
  ) => {
    const board = boards.find(b => (b.id ?? b.idx) === boardId)
    if (!board) return
    
    setSelectedBoard(board)
    setWarningData({ message: warningMessage, userId })
    setWarningModalOpen(true)
  }

  const confirmSendWarning = async () => {
    if (!selectedBoard || !warningData) return
    const boardId = selectedBoard.id ?? selectedBoard.idx

    try {
      await API.post(`/admin/board/warning`, {
        boardId,
        warningMessage: warningData.message,
        user_id: warningData.userId,
      })
      setWarningModalOpen(false)
      setWarningData(null)
      setSelectedBoard(null)
    } catch (error: any) {
      console.log(error)
      alert(error.response?.data?.message || "경고 보내기 실패 다시 시도해주세요")
    }
  }


  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPage || nextPage === page) return
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // 페이지 번호 버튼 생성 로직 - 5개씩 고정 표시
  const getPageNumbers = () => {
    const pagesPerGroup = 7 // 한 그룹당 표시할 페이지 수
    const pages: number[] = []
    
    // 현재 페이지가 속한 그룹 계산 (1-5: 그룹1, 6-10: 그룹2, ...)
    const currentGroup = Math.ceil(page / pagesPerGroup)
    
    // 해당 그룹의 시작 페이지와 끝 페이지 계산
    const startPage = (currentGroup - 1) * pagesPerGroup + 1
    const endPage = Math.min(currentGroup * pagesPerGroup, totalPage)
    
    // 해당 그룹의 페이지 번호들 생성
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }


  // 🔹 여기서부터 JSX
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 px-5 py-10">
      {/* adminBoard 컨테이너 */}
      <div className="max-w-5xl mx-auto">
        <Title className="flex justify-left items-center text-3xl font-extrabold text-slate-900 mb-6 cursor-default">
          게시판 관리페이지
        </Title>

        {/* boardSection */}
        <div className="mt-8 flex flex-col gap-8">
          {/* leftSection */}
          <section className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* 섹션 헤더 h2 */}
            

            {/* topSection - 검색 영역 */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 px-6 py-6 border-b-2 border-slate-100">
              <div>
                {/* boardSelect */}
                <select
                  value={searchField}
                  onChange={(e) => handleChangeSearchField(e.target.value as "title" | "nickname" | "category")}
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white cursor-pointer min-w-[120px] transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="title">제목</option>
                  <option value="nickname">닉네임</option>
                  <option value="category">카테고리</option>
                </select>
              </div>

              {/* searchArea */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleEnter}
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl text-sm w-full md:w-64 bg-white h-[42px] transition-all.duration-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="검색입력"
                />
                <button
                  onClick={applySearch}
                  className="px-5 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg cursor-pointer"
                >
                  검색
                </button>
              </div>
            </div>

            {/* boardInfoSection */}
            <div className="px-4 md:px-6 max-h-[460px] overflow-y-auto">
              {/* 전체 테이블 상하 좌우 모서리 둥글게 */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <table className="w-full table-fixed text-xs md:text-sm">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[36%]" />
                  <col className="w-[20%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="bg-emerald-600 text-white border-b-2 border-emerald-700 font-semibold tracking-wide">
                    <th className="py-3 text-center rounded-tl-2xl">카테고리</th>
                    <th className="py-3 text-center">제목</th>
                    <th className="py-3 text-center">닉네임</th>
                    <th className="py-3 text-center">좋아요</th>
                    <th className="py-3 text-center">조회수</th>
                    <th className="py-3 text-center rounded-tr-2xl">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        로딩 중...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : boards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        게시글이 없습니다
                      </td>
                    </tr>
                  ) : (
                    boards.map((board: BoardPost) => {
                      const boardId = board.id ?? board.idx;
                      return (
                        <tr
                          key={boardId}
                          onClick={() => handleViewBoard(boardId)}
                          className="border-b border-slate-100 hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
                        >
                          <td className="py-3 text-center text-emerald-500 font-semibold text-[0.8rem] uppercase tracking-[0.08em]">
                            {board.category || '미지정'}
                          </td>
                          <td className="py-3 text-center font-semibold text-slate-800 truncate">
                            {board.title}
                          </td>
                          <td className="py-3 text-center font-semibold text-slate-800 truncate">
                            {board.users?.nickname || '알 수 없음'}
                          </td>
                          <td className="py-3 text-center font-semibold text-emerald-600">
                            {board.likes ?? 0}
                          </td>
                          <td className="py-3 text-center font-semibold text-emerald-600">
                            {board.views ?? 0}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              className="w-12 md:w-12 h-8 text-[0.85rem] font-bold rounded-lg text-white bg-gray-300 cursor-pointer transition-all duration-300 hover:bg-red-400"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteBoard(boardId)
                              }}
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* 나중에 페이지네이션 쓰면 여기 Tailwind로 추가 */}
            {totalPage > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 flex-wrap mb-10 mt-10">
            
            {/* 이전 페이지로 이동 버튼 */}
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === 1 || loading} 
              onClick={() => handlePageChange(page - 1)}
            >
              이전
            </Button>
            
            {/* 페이지 번호 버튼들 */}
            {getPageNumbers().map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={page === pageNumber ? "default" : "outline"}
                size="sm"
                disabled={loading}
                onClick={() => handlePageChange(pageNumber)}
                className="min-w-[40px]"
              >
                {pageNumber}
              </Button>
            ))}
            
            {/* 다음 페이지로 이동 버튼 */}
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === totalPage || loading} 
              onClick={() => handlePageChange(page + 1)}
            >
              다음
            </Button>
            
          </div>
        )}
          </section>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>게시글 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 이 게시글을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedBoard(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteBoard}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 경고 보내기 확인 모달 */}
      <Dialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>경고 보내기 확인</DialogTitle>
            <DialogDescription>
              정말로 경고를 보내시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWarningModalOpen(false);
                setWarningData(null);
                setSelectedBoard(null);
              }}
            >
              취소
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={confirmSendWarning}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
