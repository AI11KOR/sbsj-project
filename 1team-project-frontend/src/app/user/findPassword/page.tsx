"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/src/lib/auth-context"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Building2, Mail, Lock, User } from "lucide-react";
import { EmailVal, CodeVal, PasswordVal } from "@/src/lib/validation";
import { handleSendResetBtn, handleVerifyResetBtn } from "@/src/lib/handleCodeBtn";
import API from "@/src/api/axiosApi"


export default function FindPasswordPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [emailReadOnly, setEmailReadOnly] = useState(false);
  const [isCounting, setIsCounting] = useState(false);
  const [code, setCode] = useState("");
  const [showTimer, setShowTimer] = useState(false);


  const { signup } = useAuth()
  const router = useRouter();

  const [emailErr, setEmailErr] = useState("")
  const [codeErr, setCodeErr] = useState("")
  const [passwordErr, setPasswordErr] = useState("")
  const [confirmPasswordErr, setConfirmPasswordErr] = useState("")

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);


  // email 전송 이벤트
  const handleSendSuccess = () => {
    setShowCodeBox(true);
    setShowTimer(true);
    setShowTimer(true);
    setEmailReadOnly(false);
  }

  const handleSendClick = handleSendResetBtn({ email, onSuccess: handleSendSuccess });
  
  // 인증번호 확인 이벤트
  const handleVerifySuccess = () => {
    setShowCodeBox(false);
    setShowTimer(false);
    setShowTimer(false);
    setEmailReadOnly(true);
  }

  const handleTimeout = () => {
    alert('시간이 만료되었습니다.')
    setIsCounting(false);
    setShowTimer(false);
  }

  const handleVerifyClick = handleVerifyResetBtn({ email, code: Number(code), onSuccess: handleVerifySuccess });


  // 이메일 인증
  const handleEmail = (e: React.FormEvent) => {
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
      return;
    }
  }


  // 인증번호 인증
  const handleCode = (e: React.FormEvent) => {
    const codeValue = (e.target as HTMLInputElement).value
    setCode(codeValue)
    if(!codeValue) {
      setCodeErr("")
      return;
    }
    
    // 스페이스바 있는 경우 에러 메시지 표시 안함
    const trimmedValue = codeValue.trim()
    if(trimmedValue === "") {
      setCodeErr("")
      return;
    }


    // 숫자가 아닌 문자가 포함되어 있는지 확인(space bar 제외)
    const hasNonNumericNonSpace = /[^0-9\s]/.test(codeValue)
    if(hasNonNumericNonSpace) {
      setCodeErr("인증번호는 6자리 숫자여야 합니다.")
      return;
    }

    // 숫자만 추출해서 검증
    const numericOnly = codeValue.replace(/\s/g, '')
    if(!CodeVal(numericOnly)) {
      setCodeErr("인증번호는 6자리 숫자여야 합니다.")
      return;
    } else {
      setCodeErr("")
      return;
    }
  }

  // 비밀번호 인증
  const handlePassword = (e: React.FormEvent) => {
    const passwordValue = (e.target as HTMLInputElement).value
    setPassword(passwordValue)
    if(!passwordValue) {
      setPasswordErr("")
      return;
    }
    if(!PasswordVal(passwordValue)) {
      setPasswordErr("비밀번호는 8자 이상 및 특수문자를 포함해야 합니다.")
      return;
    } else {
      setPasswordErr("")
      return;
    }
  }

  // 비밀번호 확인 인증
  const handleConfirmPassword = (e: React.FormEvent) => {
    const confirmPasswordValue = (e.target as HTMLInputElement).value
    setConfirmPassword(confirmPasswordValue)
    if(!confirmPasswordValue) {
      setConfirmPasswordErr("")
      return;
    }
    if(confirmPasswordValue !== password) {
      setConfirmPasswordErr("비밀번호가 일치하지 않습니다.")
      return;
    } else {
      setConfirmPasswordErr("")
      return;
    }
  }

  
  // 비밀번호 변경 제출 이벤트
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.")
      return
    }

    setIsLoading(true)

    try {
      await API.post("/user/find-password", { email, password })
      alert('비밀번호 변경 완료 로그인 화면으로 전환합니다')
      router.push("/user/login")
    } catch (err) {
      setError("비밀번호 변경에 실패패했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">비밀번호 변경</CardTitle>
          <CardDescription className="text-balance">상부상조와 함께 성공적인 창업을 시작하세요</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  ref={emailRef}
                  readOnly={emailReadOnly}
                  placeholder="example@email.com"
                  value={email}
                  onChange={handleEmail}
                  className="pl-10"
                  required
                />
              </div>
              <div className="text-xs text-red-500">{emailErr}</div>
            </div>
            {/* 인증번호 전송 button */}
            {/* <Button 
            type="button"
            className="w-full space-y-2 cursor-pointer hover:text-white transition-all duration-300"
            onClick={handleSendClick}
            >
              인증번호 전송
            </Button> */}

            {/* 인증번호 기입란 및 인증번호 확인 */}
                {/* <div className="space-y-2" style={{ display: showCodeBox ? "block" : "none" }}>
                <Label htmlFor="email-code">인증번호</Label>
                <div className="relative flex items-center gap-2 justify-between">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-code"
                    type="code"
                    ref={codeRef}
                    value={code}
                    onChange={handleCode}
                    className="pl-10 w-50"
                    placeholder="******"
                  />
                  
                  <Button 
                  type="button"
                  className="w-50 space-y-2 cursor-pointer hover:text-white transition-all duration-300 font-bold"
                  onClick={handleVerifyClick}
                  // disabled={isLoading}
                  >
                    인증번호 확인
                  </Button>  
                  </div>
                  <div className="text-xs text-red-500">{codeErr}</div>
                </div> */}
            

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="8자리 이상 입력"
                  value={password}
                  ref={passwordRef}
                  onChange={handlePassword}
                  className="pl-10"
                  required
                />
              </div>
              <div className="text-xs text-red-500">{passwordErr}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={confirmPassword}
                  ref={confirmPasswordRef}
                  onChange={handleConfirmPassword}
                  className="pl-10"
                  required
                />
              </div>
              <div className="text-xs text-red-500">{confirmPasswordErr}</div>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-bold cursor-pointer hover:text-white transition-all duration-300" disabled={isLoading}>
              {isLoading ? "비밀번호 변경 중..." : "비밀번호 변경"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
