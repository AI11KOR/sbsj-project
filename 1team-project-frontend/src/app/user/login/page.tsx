"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/src/stores/authStore"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Mail, Lock, Sparkles } from "lucide-react";
import Image from "next/image";
import { EmailVal, PasswordVal } from "@/src/lib/validation";
import API from "@/src/api/axiosApi";


export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, isLoggedIn, accessToken } = useAuthStore()
  const router = useRouter()

  // 이미 로그인되어 있고 토큰이 있으면 마이페이지로 리다이렉트
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      router.push("/user/mypage");
    }
  }, [isLoggedIn, accessToken, router])

  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);



  const handleEmailCheck = (e: React.FormEvent) => {
    const emailValue = (e.target as HTMLInputElement).value
    setEmail(emailValue)
    if(!emailValue) {
      setEmailErr("")
      return;
    }

    if(!EmailVal(emailValue)) {
      setEmailErr("이메일 형식이 올바르지 않습니다.")
      return;
    } else {
      setEmailErr("")
    }
  }

  const handlePasswordCheck = (e: React.FormEvent) => {
    const passwordValue = (e.target as HTMLInputElement).value
    setPassword(passwordValue)
    if(!passwordValue) {
      setPasswordErr("")
      return;
    }

    if(!PasswordVal(passwordValue)) {
      setPasswordErr("비밀번호는 8자리 이상 입력해주세요.")
      return;
    } else {
      setPasswordErr("")
    }
  }


  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if(!email) {
      alert('이메일을 적어주세요')
      emailRef.current?.focus();
      return;
    }

    if(!EmailVal(email)) {
      alert('이메일 형식이 올바르지 않습니다.');
      emailRef.current?.focus();
      return;
    }


    if(!password) {
      alert('비밀번호를 적어주세요');
      passwordRef.current?.focus();
      return;
    }

    if(!PasswordVal(password)) {
      alert('비밀번호는 8자리 이상 입력해주세요.');
      passwordRef.current?.focus();
      return;
    }

    try {
      const response = await API.post(
        "/user/login", 
        { 
          email, password 
        })
      if(response.status === 200) {
        const { user, accessToken, refreshToken } = response.data;
        // Zustand store에 로그인 정보 저장
        login({ user, accessToken, refreshToken });
        router.push("/user/mypage");
      } else {
        setError(response.data.message);
        passwordRef.current?.focus();
      }
    } catch (err:any) {
      setError(err.response?.data?.message || "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError("")
    setIsLoading(true)

    try {
      const response = await API.post("/user/login", {
        email: "demo@sangbusangjo.com",
        password: "demo1234"
      })
      if(response.status === 200) {
        const { user, accessToken, refreshToken } = response.data;
        // Zustand store에 로그인 정보 저장
        login({ user, accessToken, refreshToken });
        router.push("/user/mypage")
      }
    } catch (err) {
      setError("데모 로그인에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <Image 
                src="/main_logo.png" 
                alt="상부상조 로고" 
                width={56} 
                height={56}
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            상부상조
          </CardTitle>
          <CardDescription className="text-balance">상권 부동산 정보를 상시 분석하며 조사해드립니다</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground"></span>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/20 border border-destructive/40 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={handleEmailCheck}
                    className="pl-10 h-11"
                    required
                  />
                </div>
                {emailErr && <p className="text-sm text-red-500">{emailErr}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordCheck}
                    className="pl-10 h-11"
                    required
                  />
                </div>
                {passwordErr && <p className="text-sm text-red-500">{passwordErr}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              {/* <Link href="/auth/findPassword"  */}
              <div
                className="text-red-300 hover:underline hover:text-red-500 transition-all duration-300 cursor-pointer m-1"
                onClick={() => router.push("/user/findPassword")}
              >
                비밀번호를 잊으셨나요?
                </div>
              {/* </Link> */}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
            type="submit" 
            className="w-full h-11 shadow-md cursor-pointer hover:text-white transition-all duration-300 font-bold" 
            disabled={isLoading}
            onClick={handleSubmit}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
            <div className="flex items-center justify-between text-sm text-muted-foreground gap-4">
              <span>계정이 없으신가요?</span>
              <button
                type="button"
                className="text-primary font-medium hover:underline cursor-pointer hover:text-green-500 transition-all duration-300"
                onClick={() => router.push("/user/signup")}
              >
                회원가입
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
