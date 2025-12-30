"use client"

import { use, useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Textarea } from "@/src/components/ui/textarea"
import { Separator } from "@/src/components/ui/separator"
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar"
import { Heart, MessageSquare, Eye, Clock, ArrowLeft, Share2, Flag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import API from "@/src/api/axiosApi"
import { useAuth } from "@/src/lib/auth-context"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog"

// 댓글 타입 정의: 댓글 정보와 작성자 정보를 포함
type Comment = {
  idx: number
  content: string | null
  created_at: string | null
  likes: number | null
  user_id: string | null  // 댓글 작성자의 user_id (이메일) - 본인 댓글 확인용
  users: {
    nickname: string | null
    user_id: string | null  // users 테이블의 user_id 필드
  } | null
}

type BoardDetail = {
  idx: number
  title: string | null
  content: string | null
  category: string | null
  tags: string | null
  views: number | null
  likes: number | null
  comments_count: number | null
  created_at: string | null
  users: {
    nickname: string | null
    idx: number | null
    user_id: string | null
  } | null
  comments?: Comment[]
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // const { id } = use(params)
  const { id } = use(params)

  // const [id, setId] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [post, setPost] = useState<BoardDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likeLoading, setLikeLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const COMMENTS_PER_PAGE = 5
  const [commentPage, setCommentPage] = useState(1)
  const [commentTotalPages, setCommentTotalPages] = useState(1)
  const [commentTotalCount, setCommentTotalCount] = useState(0)
  const [commentsLoading, setCommentsLoading] = useState(false)
  
  // 모달 상태
  const [deletePostModalOpen, setDeletePostModalOpen] = useState(false)
  const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false)
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null)
  
  // 조회수 증가가 이미 실행되었는지 추적하는 ref
  const viewCountIncremented = useRef<string | null>(null)

  // 조회수 증가 함수 (한 번만 실행)
  const incrementView = useCallback(async () => {
    if (!id || viewCountIncremented.current === id) return
    
    try {
      await API.post(`/board/${id}/view`)
      viewCountIncremented.current = id
    } catch (err: any) {
      console.error('조회수 증가 실패:', err)
      // 조회수 증가 실패해도 게시글은 표시
    }
  }, [id])

  const fetchPost = useCallback(
    async (
      targetPage: number,
      options: { showFullLoading?: boolean } = {}
    ) => {
      if (!id) return
      const { showFullLoading = false } = options
      
      try {
        if (showFullLoading) {
          setLoading(true)
        } else {
          setCommentsLoading(true)
        }
        const response = await API.get(`/board/${id}`, {
          params: {
            user_id: user?.user_id ?? "",
            commentPage: targetPage,
            commentLimit: COMMENTS_PER_PAGE,
          },
        })
        const data = response.data?.data
        if (data) {
          setPost(data)
          setIsLiked(Boolean(data.isLiked))
          const pagination = response.data?.commentPagination
          const safePage = pagination?.currentPage ?? targetPage
          setCommentTotalPages(pagination?.totalPages ?? 1)
          setCommentTotalCount(pagination?.totalCount ?? data.comments?.length ?? 0)
          setCommentPage(safePage)
        }
        setError(null)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.message || "게시글을 불러오지 못했습니다.")
      } finally {
        if (showFullLoading) {
          setLoading(false)
        } else {
          setCommentsLoading(false)
        }
      }
    },
    [id, user?.user_id]
  )

  // 게시글 ID가 변경될 때만 조회수 증가 플래그 리셋 및 게시글 로드
  useEffect(() => {
    if (!id) return
    // 새로운 게시글 ID로 변경될 때 조회수 증가 플래그 리셋
    viewCountIncremented.current = null
    fetchPost(1, { showFullLoading: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // id만 의존성으로 사용하여 게시글 변경 시에만 실행
  
  // 게시글 로드 후 조회수 증가 (한 번만)
  useEffect(() => {
    if (!id || !post) return
    // 이미 조회수를 증가시켰으면 스킵
    if (viewCountIncremented.current === id) return
    
    // 게시글이 로드된 후 조회수 증가 (비동기로 실행하여 게시글 로드에 영향 없음)
    incrementView()
  }, [id, post, incrementView])
  
  // 사용자 정보가 로드된 후 좋아요 상태만 업데이트 (조회수 증가 없음)
  useEffect(() => {
    if (!id || !user?.user_id || !post || viewCountIncremented.current === id) return
    // 조회수는 이미 증가했으므로 조회수 증가 없이 게시글만 다시 로드
    fetchPost(commentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]) // user_id만 의존성으로 사용

  const tags = useMemo(() => (post?.tags ? post.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : []), [post?.tags])
  const commentList = post?.comments ?? []
  const authorInitial = post?.users?.nickname?.[0] ?? "U"
  const commentsCount = commentTotalCount ?? post?.comments_count ?? 0

  const handleCommentPageChange = (nextPage: number) => {
    if (commentsLoading) return
    if (nextPage < 1 || nextPage > commentTotalPages) return
    if (nextPage === commentPage) return
    setCommentPage(nextPage)
    // 댓글 페이지 변경 시에는 조회수 증가하지 않음
    fetchPost(nextPage)
  }

  const getCommentPageNumbers = () => {
    const pagesPerGroup = 5
    const pages: number[] = []
    const currentGroup = Math.ceil(commentPage / pagesPerGroup)
    const startPage = (currentGroup - 1) * pagesPerGroup + 1
    const endPage = Math.min(currentGroup * pagesPerGroup, commentTotalPages)
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }



  const handleLikeClick = async () => {
    if (!user?.user_id) {
      alert('로그인이 필요합니다.')
      router.push('/user/login')
      return
    }

    if (likeLoading) return

    const action = isLiked ? 'unlike' : 'like'

    try {
      setLikeLoading(true)
      const response = await API.post(`/board/${id}/like`, { 
        action,
        user_id: user.user_id, 
      })
      
      if (response.data?.data?.likes !== undefined) {
        setPost((prev) => prev ? { ...prev, likes: response.data.data.likes } : null)
      }
      if (typeof response.data?.data?.isLiked === 'boolean') {
        setIsLiked(response.data.data.isLiked)
      } else {
        setIsLiked(!isLiked)
      }
      
      // 좋아요를 눌렀을 때만 알림 업데이트 이벤트 발생 (unlike가 아닐 때)
      // 백엔드에서 알림이 생성되었으므로 즉시 헤더 알림 업데이트
      if (action === 'like' && response.data?.message === '좋아요 처리 성공') {
        // 약간의 지연을 두어 백엔드 알림 생성이 완료된 후 이벤트 발생
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('notification-updated'))
        }, 100)
      }
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.message || '좋아요 처리에 실패하였습니다. 다시 시도해 주세요')
    } finally {
      setLikeLoading(false)
    }
  }



  // 댓글 작성 후 댓글 수 증가 및 댓글 내용 초기화 및 댓글 작성 후 댓글 리스트에 추가
  const handleCommentSubmit = async () => {
    // 중복 클릭 방지
    if (commentLoading) return;
    
    if (!user?.user_id) {
      alert('로그인이 필요합니다.');
      router.push('/user/login');
      return;
    }
    
    if (commentText.trim()) {
      setCommentLoading(true);
      try {
        const response = await API.post(`/board/${id}/comment`, { 
          content: commentText,
          user_id: user.user_id 
        })
        if (response.data?.data) {
          setPost((prev) => prev ? { ...prev, comments_count: (prev.comments_count ?? 0) + 1 } : null);
          setCommentText("")
          setCommentPage(1)
          await fetchPost(1)
          
          // 헤더에 알림 업데이트 이벤트 전송
          window.dispatchEvent(new CustomEvent('notification-updated'))
        }
      } catch (error: any) {
        console.error(error);
        alert(error.response?.data?.message || '댓글 작성에 실패하였습니다. 다시 시도해 주세요.');
      } finally {
        setCommentLoading(false);
      }
    }
    }

  // 댓글 삭제 핸들러: 본인의 댓글만 삭제할 수 있도록 백엔드에 user_id 전달
  const handleCommentDelete = async (commentId: number) => {
    // 로그인 확인: 로그인하지 않은 사용자는 삭제 불가
    if (!user?.user_id) {
      alert('로그인이 필요합니다.');
      router.push('/user/login');
      return;
    }

    setSelectedCommentId(commentId)
    setDeleteCommentModalOpen(true)
  }

  const confirmCommentDelete = async () => {
    if (!selectedCommentId || !user?.user_id) return;

    // 중복 요청 방지: 이미 삭제 요청 중이면 무시
    if (commentLoading) return;
    setCommentLoading(true);
    
    try {
      // 댓글 삭제 API 호출: DELETE 메서드 사용
      // 백엔드에서 본인 댓글인지 확인하기 위해 user_id를 body에 포함
      const response = await API.delete(`/board/${id}/comment/${selectedCommentId}`, {
        data: {
          user_id: user.user_id  // 본인 확인을 위한 user_id 전달
        }
      })
      
      setDeleteCommentModalOpen(false)
      setSelectedCommentId(null)

      // 댓글 삭제 후 현재 페이지의 댓글 목록 새로고침
      await fetchPost(commentPage)
    } catch (error: any) {
      console.error(error);
      // 백엔드에서 반환한 에러 메시지 표시 (권한 없음, 로그인 필요 등)
      alert(error.response?.data?.message || "댓글 삭제에 실패했습니다. 다시 시도해 주세요.")
    } finally {
      setCommentLoading(false);
    }
  }

  // useEffect(() => {})

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl text-center py-12">
        <p className="text-muted-foreground">게시글을 불러오는 중입니다...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto p-4 max-w-4xl text-center py-12">
        <p className="text-muted-foreground">{error ?? "게시글을 찾을 수 없습니다"}</p>
        <Button className="mt-4" onClick={() => router.push("/board")}>
          커뮤니티로 돌아가기
        </Button>
      </div>
    )
  }

  const createdAt = post.created_at ? new Date(post.created_at) : null


  // 게시글 삭제
  const handleDeleteClick = async () => {
    setDeletePostModalOpen(true)
  }

  const confirmDeletePost = async () => {
    try {
      const response = await API.delete(`/board/delete/${id}`)
      setDeletePostModalOpen(false)
      if(response.data?.message) {
        router.push('/board');
      } else {
        alert('게시글 삭제에 실패했습니다. 다시 시도해 주세요')
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || '게시글 삭제에 실패했습니다. 다시 시도해 주세요')
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" className="mb-4" onClick={() => router.push('/board')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        목록으로
      </Button>

      {/* Post Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary">{post.category ?? "카테고리 미지정"}</Badge>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.views ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.likes ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {commentsCount}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">{authorInitial}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.users?.nickname ?? "알 수 없음"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {createdAt ? formatDistanceToNow(createdAt, { addSuffix: true, locale: ko }) : "방금 전"}
                </p>
              </div>
            </div>
            {/* <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Flag className="h-4 w-4" />
              </Button>
            </div> */}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant={isLiked ? "default" : "outline"} 
              className="flex-1" 
              onClick={handleLikeClick}
              disabled={likeLoading}
            >
              <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              좋아요 {post.likes ?? 0}
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              <MessageSquare className="mr-2 h-4 w-4" />
              댓글 {commentsCount}
            </Button>
            {/* 게시글 수정/삭제 버튼: 본인 게시글이거나 관리자인 경우 표시 */}
            {/* 관리자 확인: user_id가 'admin@admin.com'이거나 role이 'admin'인 경우 */}
            {(user?.user_id === post?.users?.user_id || user?.user_id === 'admin@admin.com' || user?.role === 'admin') && (
              <div>
                <Button variant="outline" 
                className="flex-1 bg-transparent cursor-pointer" 
                onClick={() => router.push(`/board/${id}/edit`)}>
                  수정하기
                </Button>
                <Button variant="outline" 
                className="flex-1 bg-transparent cursor-pointer" 
                onClick={handleDeleteClick}>
                  삭제하기
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="mt-6 space-y-4">
        <h2 className="text-2xl font-bold">댓글 {commentsCount}</h2>

        {/* Write Comment */}
        <Card>
          <CardContent className="pt-6">
            {!user?.user_id ? (
              <div className="text-center py-4 text-muted-foreground">
                댓글을 작성하려면 로그인이 필요합니다.
              </div>
            ) : (
              <>
                <Textarea
                  placeholder="댓글을 입력하세요"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="mb-3 resize-none h-24 overflow-y-auto"
                  disabled={commentLoading}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCommentSubmit} 
                    className="cursor-pointer hover:text-white"
                    disabled={!commentText.trim() || commentLoading}
                  >
                    {commentLoading ? "작성 중..." : "댓글 작성"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Comments List */}
        {commentsLoading ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              댓글을 불러오는 중입니다...
            </CardContent>
          </Card>
        ) : commentList.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
            </CardContent>
          </Card>
        ) : (
          <>
            {commentList.map((comment) => (
              <Card key={comment.idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-secondary">
                        {comment.users?.nickname?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{comment.users?.nickname ?? "익명"}</p>
                          <p className="text-xs text-muted-foreground">
                            {comment.created_at
                              ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })
                              : "방금 전"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    {/* 댓글 삭제 버튼: 본인 댓글이거나 관리자인 경우 표시 */}
                    {/* 관리자는 모든 댓글 삭제 가능, 일반 사용자는 본인 댓글만 삭제 가능 */}
                    {user?.user_id && (
                      (comment.user_id === user.user_id || comment.users?.user_id === user.user_id) || 
                      user.user_id === 'admin@admin.com' || 
                      user.role === 'admin'
                    ) && (
                      <Button 
                        onClick={() => handleCommentDelete(comment.idx)}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer hover:text-white hover:bg-destructive hover:text-destructive-foreground">
                        삭제
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {commentTotalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                {/* <p className="text-sm text-muted-foreground">
                  총 {commentTotalCount.toLocaleString()}개 댓글 · {commentPage}/{commentTotalPages} 페이지
                </p> */}
                <div className="flex items-center justify-center w-full gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCommentPageChange(commentPage - 1)}
                    disabled={commentPage === 1 || commentsLoading}
                    className="min-w-[70px]"
                  >
                    이전
                  </Button>
                  {getCommentPageNumbers().map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === commentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCommentPageChange(pageNumber)}
                      disabled={commentsLoading}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCommentPageChange(commentPage + 1)}
                    disabled={commentPage === commentTotalPages || commentsLoading}
                    className="min-w-[70px]"
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 게시글 삭제 확인 모달 */}
      <Dialog open={deletePostModalOpen} onOpenChange={setDeletePostModalOpen}>
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
              onClick={() => setDeletePostModalOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePost}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 댓글 삭제 확인 모달 */}
      <Dialog open={deleteCommentModalOpen} onOpenChange={setDeleteCommentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>댓글 삭제 확인</DialogTitle>
            <DialogDescription>
              정말로 이 댓글을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteCommentModalOpen(false);
                setSelectedCommentId(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCommentDelete}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
