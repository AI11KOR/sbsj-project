"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { X } from "lucide-react"
import API from "@/src/api/axiosApi"
import { useAuth } from "@/src/lib/auth-context"

export default function WritePostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false);



  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)


  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if(!category) {
      alert('카테고리를 입력하세요');
      categoryRef.current?.focus();
      return;
    }

    if(!title) {
      alert('제목을 입력해주세요');
      titleRef.current?.focus();
      return;
    }

    if(!content) {
      alert('내용을 입력하세요');
      contentRef.current?.focus();
      return;
    }

    

    if(!user?.user_id) {
      alert('로그인이 필요합니다.');
      router.push('/user/login');
      return;
    }

    setIsLoading(true)

    try {
      await API.post('/board/write', { 
        title, 
        content, 
        category, 
        tags: tags.length > 0 ? tags.join(',') : null, 
        user_id: user.user_id 
      })
      
      // 알림 업데이트 이벤트 발생 (헤더 알림 뱃지 업데이트)
      window.dispatchEvent(new CustomEvent('notification-updated'))
      
      router.push('/board')
    } catch (error:any) {
      console.log(error);
      alert(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">새 글 작성</CardTitle>
          <CardDescription>창업 경험과 정보를 공유해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="창업후기">창업후기</SelectItem> */}
                  <SelectItem value="정보공유">정보공유</SelectItem>
                  <SelectItem value="질문">질문</SelectItem>
                  {/* <SelectItem value="노하우">노하우</SelectItem> */}
                  <SelectItem value="자유">자유</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">태그 (최대 5개)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="태그를 입력하고 추가 버튼을 클릭하세요"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  disabled={tags.length >= 5}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddTag}
                  disabled={tags.length >= 5 || !tagInput.trim()}
                >
                  추가
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" className="font-bold cursor-pointer transition-all duration-300 hover:bg-green-500" onClick={() => router.back()}>
                취소
              </Button>
              <Button 
                type="submit"
                // disabled={tags.length >= 5 || !tagInput.trim()}
                disabled={isLoading || !category || !title || !content}
                className="font-bold cursor-pointer transition-all duration-300 hover:bg-green-500 hover:text-white"
                // className={cn(isLoading && "opacity-50 cursor-not-allowed")}
              >작성완료</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
