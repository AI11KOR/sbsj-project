"use client"

import { useEffect, useState } from "react"
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

type User = {
    idx: number
    name: string | null
    nickname: string | null
    user_id: string
    role: string | null
    use_yn: string | null
    created_at: string
}


export default function AdminUserPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 페이지네이션
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPage, setTotalPage] = useState(1)
    const USERS_PER_PAGE = 7
    
    // 검색 상태
    const [searchField, setSearchField] = useState<"name" | "nickname" | "email">("name")
    const [keyword, setKeyword] = useState('')
    const [appliedKeyword, setAppliedKeyword] = useState('')

    // 모달 상태
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [statusModalOpen, setStatusModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [actionType, setActionType] = useState<'delete' | 'toggle' | null>(null)


    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await API.get("/admin/user", {
                params: {
                    page: currentPage,
                    limit: USERS_PER_PAGE,
                    type: searchField,
                    keyword: appliedKeyword || undefined,
                },
            });
            const { data = [], pagination } = response.data ?? {}
            setUsers(Array.isArray(data) ? data : [])
            setTotalPage(pagination?.totalPages ?? 1)
        } catch (error: any) {
            console.log(error);
            setError(error.response?.data?.message || '유저 조회에 실패했습니다.')
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchField, appliedKeyword]);

    if (loading) {
        return <div>Loading...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }



    // 유저 정보 삭제하기
    const handleDeleteUser = async (userId: number) => {
        const user = users.find(u => u.idx === userId);
        if (!user) return;
        
        setSelectedUser(user);
        setActionType('delete');
        setDeleteModalOpen(true);
    }

    const confirmDeleteUser = async () => {
        if (!selectedUser) return;
        
        try {
            await API.delete(`/admin/user/${selectedUser.idx}`);
            setDeleteModalOpen(false);
            setSelectedUser(null);
            setActionType(null);
            fetchUsers();
        } catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || '유저 삭제에 실패했습니다.');
        }
    }

    // 유저 상태 토글 (use_yn Y/N 변경)
    const handleToggleUserStatus = async (user: User) => {
        setSelectedUser(user);
        setActionType('toggle');
        setStatusModalOpen(true);
    }

    const confirmToggleStatus = async () => {
        if (!selectedUser) return;
        
        try {
            await API.patch(`/admin/user/${selectedUser.idx}/status`);
            setStatusModalOpen(false);
            setSelectedUser(null);
            setActionType(null);
            fetchUsers();
        } catch (error: any) {
            console.log(error);
            alert(error.response?.data?.message || '회원 상태 변경에 실패했습니다.');
        }
    }

    const applySearch = () => {
        setCurrentPage(1)
        setAppliedKeyword(keyword.trim())
    }

    // 검색 기능
    const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            applySearch();
        }
    }

    const handleChangeSearchField = (field: "name" | "nickname" | "email") => {
        setSearchField(field)
        setCurrentPage(1)
    }


    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPage || page === currentPage) return
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const getPageNumbers = () => {
        const pagesPerGroup = 5
        const pages: number[] = []
        const currentGroup = Math.ceil(currentPage / pagesPerGroup)
        const startPage = (currentGroup - 1) * pagesPerGroup + 1
        const endPage = Math.min(currentGroup * pagesPerGroup, totalPage)
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }
        return pages
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 px-5 py-10">
      {/* adminBoard 컨테이너 */}
      <div className="max-w-5xl mx-auto">
        <Title className="flex justify-left items-center text-3xl font-extrabold text-slate-800 mb-6 cursor-default">
          유저 관리페이지
        </Title>

        {/* boardSection */}
        <div className="mt-8 flex flex-col gap-8">
          {/* leftSection */}
          <section className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* 섹션 헤더 h2 */}


            {/* topSection - 검색 영역 */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 px-6 py-6 border-b-2 border-slate-100">
              <div>
                {/* userSelect */}
                <select
                  value={searchField}
                  onChange={(e) => handleChangeSearchField(e.target.value as "name" | "nickname" | "email")}
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white cursor-pointer min-w-[120px] transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="name">이름</option>
                  <option value="nickname">닉네임</option>
                  <option value="email">이메일</option>
                </select>
              </div>

              {/* searchArea */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleEnter}
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl text-sm w-full md:w-64 bg-white h-[42px] transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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

            {/* userInfoSection */}
            <div className="px-4 md:px-6 max-h-[460px] overflow-y-auto">
              <table className="w-full table-fixed text-xs md:text-sm">
                <colgroup>
                  <col className="w-[8%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                  <col className="w-[24%]" />
                  <col className="w-[14%]" />
                  <col className="w-[8%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
                  <tr className="bg-emerald-600 text-white border-b-2 border-emerald-700 font-semibold tracking-wide">
                    <th className="py-3 text-center">번호</th>
                    <th className="py-3 text-center">이름</th>
                    <th className="py-3 text-center">닉네임</th>
                    <th className="py-3 text-center">이메일</th>
                    <th className="py-3 text-center">가입일</th>
                    <th className="py-3 text-center">상태</th>
                    <th className="py-3 text-center">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        로딩 중...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        유저가 없습니다
                      </td>
                    </tr>
                  ) : (
                    users.map((user: User) => (
                      <tr
                        key={user.idx}
                        className="border-b border-slate-100 hover:bg-indigo-50 transition-all duration-200"
                      >
                        <td className="py-3 text-center font-semibold text-slate-700">
                          {user.idx}
                        </td>
                        <td className="py-3 text-center font-semibold text-slate-800 truncate">
                          {user.name || '-'}
                        </td>
                        <td className="py-3 text-center font-semibold text-slate-800 truncate">
                          {user.nickname || '-'}
                        </td>
                        <td className="py-3 text-center font-semibold text-emerald-600 truncate">
                          {user.user_id}
                        </td>
                        <td className="py-3 text-center text-slate-600">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className={`py-3 text-center font-semibold ${user.use_yn === 'Y' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {user.use_yn === 'Y' ? '활동회원' : '탈퇴회원'}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            className="w-20 md:w-24 h-8 text-[0.85rem] font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition-all duration-300"
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            {user.use_yn === 'Y' ? '탈퇴 처리' : '회원 복구'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 나중에 페이지네이션 쓰면 여기 Tailwind로 추가 */}
            {totalPage > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 flex-wrap mb-10 mt-10">
            
            {/* 이전 페이지로 이동 버튼 */}
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === 1 || loading} 
              onClick={() => handlePageChange(currentPage - 1)}
            >
              이전
            </Button>
            
            {/* 페이지 번호 버튼들 */}
            {getPageNumbers().map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
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
              disabled={currentPage === totalPage || loading} 
              onClick={() => handlePageChange(currentPage + 1)}
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
            <DialogTitle>유저 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 {selectedUser?.name || selectedUser?.nickname || '이 유저'}를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedUser(null);
                setActionType(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상태 변경 확인 모달 */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>회원 상태 변경</DialogTitle>
            <DialogDescription>
              {selectedUser?.use_yn === 'Y' 
                ? `${selectedUser?.name || selectedUser?.nickname || '이 회원'}을 탈퇴 처리하시겠습니까?`
                : `${selectedUser?.name || selectedUser?.nickname || '이 회원'}을 회원으로 복구하시겠습니까?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusModalOpen(false);
                setSelectedUser(null);
                setActionType(null);
              }}
            >
              취소
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={confirmToggleStatus}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    )
}