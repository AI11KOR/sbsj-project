"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/lib/auth-context"
import API from "@/src/api/axiosApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { Separator } from "@/src/components/ui/separator"
import { Bell, Mail, MapPin, Shield, User } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    favorites: true,
    community: false,
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm("계정을 비활성화하시겠습니까? 로그인할 수 없게 됩니다.")
    if (!confirmed) return

    try {
      setIsDeleting(true)
      await API.post("/user/withdraw")
      alert("계정이 비활성화되었습니다.")
      await logout()
      router.push("/")
    } catch (error) {
      console.error(error)
      alert("계정 비활성화에 실패했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">설정</h1>
        <p className="text-muted-foreground">계정 및 알림 설정을 관리하세요</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              프로필 설정
            </CardTitle>
            <CardDescription>기본 정보를 수정할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" defaultValue={user.email} disabled />
              <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input id="phone" type="tel" placeholder="010-0000-0000" />
            </div> */}
            <Button>변경사항 저장</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              알림 설정
            </CardTitle>
            <CardDescription>받고 싶은 알림을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="email-notif">이메일 알림</Label>
                </div>
                <p className="text-sm text-muted-foreground">중요한 업데이트를 이메일로 받습니다</p>
              </div>
              <Switch
                id="email-notif"
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="push-notif">푸시 알림</Label>
                </div>
                <p className="text-sm text-muted-foreground">실시간 알림을 받습니다</p>
              </div>
              <Switch
                id="push-notif"
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>
            <Separator />
    
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="community-notif">커뮤니티 알림</Label>
                </div>
                <p className="text-sm text-muted-foreground">내 게시글의 댓글 알림을 받습니다</p>
              </div>
              <Switch
                id="community-notif"
                checked={notifications.community}
                onCheckedChange={(checked) => setNotifications({ ...notifications, community: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              보안 설정
            </CardTitle>
            <CardDescription>비밀번호를 변경할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button>비밀번호 변경</Button>
          </CardContent>
        </Card> */}

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">계정 삭제</CardTitle>
            <CardDescription>계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDeactivateAccount} disabled={isDeleting}>
              {isDeleting ? "처리 중..." : "계정 비활성화"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
