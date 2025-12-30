"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { PostCard } from "@/src/components/post-card"
import { PenSquare, Search, TrendingUp, Clock, Heart } from "lucide-react"
import API from "@/src/api/axiosApi"

type BoardPost = {
  idx: number
  id?: number
  title: string,
  content: string,
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

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  // 정렬 옵션: latest(최신순), views(조회순), likes(좋아요순)
  const [sortBy, setSortBy] = useState<"latest" | "views" | "likes">("latest")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const POSTS_PER_PAGE = 5
  const categories = ["전체", "정보공유", "질문", "자유"]

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get('/board', {
        params: {
          page,
          limit: POSTS_PER_PAGE,
          sort: sortBy,
          category: selectedCategory === "all" ? undefined : selectedCategory,
        }
      })

      const { data = [], pagination } = response.data ?? {}
      setPosts(Array.isArray(data) ? data : [])
      if (pagination) {
        if (pagination.currentPage && pagination.currentPage !== page) {
          setPage(pagination.currentPage)
        }
        setTotalPages(pagination.totalPages ?? 1)
      } else {
        setTotalPages(1)
      }

    } catch (error) {
      console.log(error);
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [page, sortBy, selectedCategory]);

  // 게시글 필터링: 검색어와 카테고리로 필터링
  // 백엔드에서 이미 정렬된 데이터를 받아오므로, 검색어가 없을 때는 백엔드 정렬을 그대로 사용
  const filteredPosts = useMemo(() => {
    const filtered = posts.filter((post) => {
      const title = post.title ?? ""
      const content = post.content ?? ""
      const category = post.category ?? "전체"

      // 검색어 필터링: 제목 또는 내용에 검색어가 포함된 경우
      const matchesSearch =
        !searchQuery || // 검색어가 없으면 모든 게시글 포함
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.toLowerCase().includes(searchQuery.toLowerCase())

      // 카테고리 필터링: 선택한 카테고리와 일치하는 경우
      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "전체" ||
        category === selectedCategory

      return matchesSearch && matchesCategory
    })

    // 검색어가 있을 때만 클라이언트 사이드에서 재정렬 (백엔드 정렬이 우선)
    if (searchQuery) {
      return filtered.sort((a, b) => {
        if (sortBy === "latest") return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        if (sortBy === "views") return (b.views ?? 0) - (a.views ?? 0)  // 조회순: 조회수가 많은 순서대로
        if (sortBy === "likes") return (b.likes ?? 0) - (a.likes ?? 0)  // 좋아요순: 좋아요가 많은 순서대로
        return 0
      })
    }

    // 검색어가 없으면 백엔드에서 정렬된 순서 그대로 사용
    return filtered
  }, [posts, searchQuery, selectedCategory, sortBy])

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // 페이지 번호 버튼 생성 로직 - 5개씩 고정 표시
  const getPageNumbers = () => {
    const pagesPerGroup = 5 // 한 그룹당 표시할 페이지 수
    const pages: number[] = []
    
    // 현재 페이지가 속한 그룹 계산 (1-5: 그룹1, 6-10: 그룹2, ...)
    const currentGroup = Math.ceil(page / pagesPerGroup)
    
    // 해당 그룹의 시작 페이지와 끝 페이지 계산
    const startPage = (currentGroup - 1) * pagesPerGroup + 1
    const endPage = Math.min(currentGroup * pagesPerGroup, totalPages)
    
    // 해당 그룹의 페이지 번호들 생성
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  // 정렬 옵션 변경 핸들러: 정렬 변경 시 첫 페이지로 이동
  const handleSortChange = (value: string) => {
    setSortBy(value as "latest" | "views" | "likes")
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setPage(1)
  }


  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">커뮤니티</h1>
          <p className="text-muted-foreground">창업 정보와 경험을 공유하는 공간입니다</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/board/write">
            <PenSquare className="mr-2 h-5 w-5" />
            글쓰기
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색어를 입력하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                최신순
              </div>
            </SelectItem>
            <SelectItem value="views">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                조회순
              </div>
            </SelectItem>
            <SelectItem value="likes">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                좋아요순
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="mb-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="mb-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category === "전체" ? "all" : category} className="flex-shrink-0">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Posts Grid */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const postId = post.id ?? post.idx
              if (!postId) {
                return null
              }
              return (
                <PostCard key={postId} post={{
                  id: postId.toString(),
                  title: post.title,
                  content: post.content,
                  category: post.category ?? "카테고리 미지정",
                  tags: post.tags ? post.tags.split(',') : [],
                  views: post.views ?? 0,
                  likes: post.likes ?? 0,
                  comments: post.comments_count ?? 0,
                  createdAt: post.created_at ? new Date(post.created_at) : new Date(),
                  author: post.users?.nickname ?? "알 수 없음",
                  authorId: post.users?.user_id ?? post.users?.idx?.toString() ?? "",
                }} />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">게시글이 없습니다</p>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
            
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
              disabled={page === totalPages || loading} 
              onClick={() => handlePageChange(page + 1)}
            >
              다음
            </Button>
            
          </div>
        )}
        </div>
    </div>
  )
}
