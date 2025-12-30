import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Eye, Heart, MessageSquare, Clock } from "lucide-react"
import type { Post } from "@/src/lib/community-data"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/board/${post.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="secondary">{post.category || "카테고리 미지정"}</Badge>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {post.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {post.comments}
              </span>
            </div>
          </div>
          <CardTitle className="text-lg leading-tight hover:text-primary transition-colors">{post.title}</CardTitle>
          <CardDescription className="line-clamp-2 leading-relaxed">{post.content}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{post.author}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ko })}
              </span>
            </div>
            <div className="flex gap-1.5">
              {post.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
