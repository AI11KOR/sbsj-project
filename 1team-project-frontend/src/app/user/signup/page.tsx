"use client"

import type React from "react"

import { useState, useEffect, useRef, ChangeEvent, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/src/lib/auth-context"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Building2, Mail, Lock, User } from "lucide-react";
import { EmailVal, CodeVal, PasswordVal, NameVal, NicknameVal } from "@/src/lib/validation";
import { handleEmailBtn, handleVerifyBtn } from "@/src/lib/handleCodeBtn";
import API from "@/src/api/axiosApi"

import AgreementPageModal from "../agreementModal/page"

export default function SignupPage() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [nickname, setNickname] = useState<string>("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [birth, setBirth] = useState("")  // YYMMDD (주민번호 앞 6자리)
  const [genderDigit, setGenderDigit] = useState(""); // "1" | "2" | "3" | "4"



  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false); // ✅ 모달 열림 여부
  
  const [terms, setTerms] = useState(false)

  const genderInputRef = useRef<HTMLInputElement>(null);

  const [showCodeBox, setShowCodeBox] = useState(false);
  const [emailReadOnly, setEmailReadOnly] = useState(false);
  const [isCounting, setIsCounting] = useState(false);
  const [code, setCode] = useState("")
  const [showTimer, setShowTimer] = useState(false);


  const { signup } = useAuth()
  const router = useRouter();

  const [emailErr, setEmailErr] = useState("")
  const [codeErr, setCodeErr] = useState("")
  const [passwordErr, setPasswordErr] = useState("")
  const [confirmPasswordErr, setConfirmPasswordErr] = useState("")
  const [nameErr, setNameErr] = useState("")
  const [nicknameErr, setNicknameErr] = useState("")
  const [termsErr, setTermsErr] = useState("")
  const [birthErr, setBirthErr] = useState("");
  const [genderErr, setGenderErr] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nicknameRef = useRef<HTMLInputElement>(null);
  const birthRef = useRef<HTMLInputElement>(null);
  const genderDigitRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);


  // email 전송 이벤트
  const handleSendSuccess = () => {
    setShowCodeBox(true);
    setShowTimer(true);
    setShowTimer(true);
    setEmailReadOnly(false);
  }

  const handleSendClick = handleEmailBtn({ 
    email, onSuccess: handleSendSuccess 
  });
  
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

  const handleVerifyClick = handleVerifyBtn({ 
    email: email, 
    code: Number(code), 
    onSuccess: handleVerifySuccess 
  });




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
    
    // 스페이스바만 있는 경우는 에러 메시지 표시 안 함
    const trimmedValue = codeValue.trim()
    if(trimmedValue === "") {
      setCodeErr("")
      return;
    }
    
    // 숫자가 아닌 문자가 포함되어 있는지 확인 (스페이스바 제외)
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
      setPasswordErr("비밀번호는 영문 대소문자, 숫자, 특수문자를 포함한 8자 이상 20자 이하로 입력해주세요.")
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

  // 이름 인증
  const handleName = (e: React.FormEvent) => {
    const nameValue = (e.target as HTMLInputElement).value
    setName(nameValue)
    if(!nameValue) {
      setNameErr("")
      return;
    }
    if(!NameVal(nameValue)) {
      setNameErr("이름은 2자 이상 5자 이하여야 합니다.")
      return;
    } else {
      setNameErr("")
      return;
    }
  }

  // 닉네임 인증
  const handleNickname = (e: React.FormEvent) => {
    const nicknameValue = (e.target as HTMLInputElement).value
    setNickname(nicknameValue)
    if(!nicknameValue) {
      setNicknameErr("")
      return;
    }
    if(!NicknameVal(nicknameValue)) {
      setNicknameErr("닉네임은 2자 이상이어야 합니다.")
      return;
    } else {
      setNicknameErr("")
      return;
    }
  }


// [추가] util 함수들
const onlyDigits = (s: string) => s.replace(/\D/g, "");

const clampBirth = (s: string) => onlyDigits(s).slice(0, 6); // YYMMDD 최대 6자리

const isValidYymmdd = (yymmdd: string) => {
  if (yymmdd.length !== 6) return false;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const d = parseInt(yymmdd.slice(4, 6), 10); // 수정: slice(4, 6)으로 변경
  if (yy < 0 || yy > 99) return false;
  if (mm < 1 || mm > 12) return false;
  if (d < 1 || d > 31) return false; // 기본 범위 체크
  // 실제 날짜 유효성 검사 (윤년, 월별 일수 고려)
  const daysInMonth = new Date(2000 + yy, mm, 0).getDate(); // 2000년 기준으로 계산 (YY를 20YY로 해석)
  return d >= 1 && d <= daysInMonth;
};

const allowedGenderDigits = (yymmdd: string): ("1"|"2"|"3"|"4")[] => {
  if (yymmdd.length < 6 || !isValidYymmdd(yymmdd)) return ["1","2","3","4"];
  // 주민번호 규칙:
  // - 1900년대 출생 (YY: 00~99 중에서 실제로는 00~23 정도가 2000년대, 24~99는 1900년대로 해석 가능)
  // - 2000년 이후 출생자는 3(남), 4(여)만 사용
  // - 1999년 이전 출생자는 1(남), 2(여)만 사용
  // 
  // YYMMDD 형식에서 YY가 00~23이면 2000~2023년으로 해석 (3,4만 허용)
  // YY가 24~99이면 1924~1999년으로 해석 (1,2만 허용)
  // 하지만 실제로는 사용자가 선택할 수 있도록 둘 다 허용하는 것이 더 유연함
  // 여기서는 간단히 모든 경우에 1,2,3,4 모두 허용하되, 에러 메시지만 표시
  // 또는 더 엄격하게: YY < 24면 3,4만, YY >= 24면 1,2만
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  // 2000년 이후 출생 (YY: 00~23)은 3,4만 허용
  // 1999년 이전 출생 (YY: 24~99)은 1,2만 허용
  if (yy >= 0 && yy <= 23) {
    return ["3", "4"]; // 2000~2023년 출생
  } else {
    return ["1", "2"]; // 1924~1999년 출생 (또는 2024~2099년 출생도 1,2 사용 가능)
  }
};

const genderFromDigit = (digit: "1"|"2"|"3"|"4") => (digit === "1" || digit === "3" ? "M" : "F");



// 생년월일 인증
// [추가] 생년월일 변경
const handleBirthChange = (e: ChangeEvent<HTMLInputElement>) => {
  const next = clampBirth(e.target.value);
  setBirth(next);

  // 유효성 검사
  if (next.length === 0) {
    setBirthErr("생년월일을 입력하세요.");
  } else if (next.length < 6) {
    setBirthErr("6자리로 입력하세요. 예: 000415");
  } else if (!isValidYymmdd(next)) { // 수정: next 전체를 전달
    setBirthErr("유효한 날짜가 아닙니다.");
  } else {
    setBirthErr("");
  }

  // 생년월일 바뀌면 성별코드 가능 범위도 바뀜 → 현재 값이 허용 범위 밖이면 비우기
  const allow = allowedGenderDigits(next);
  if (genderDigit && !allow.includes(genderDigit as any)) {
    setGenderDigit("");
    setGenderErr(""); // 성별 에러도 초기화
  }
};

// [추가] 성별 한 자리 변경 (숫자만, 길이 1, 허용 범위 체크)
const handleGenderDigitChange = (e: ChangeEvent<HTMLInputElement>) => {
  const inputValue = e.target.value;
  const digit = onlyDigits(inputValue).slice(0, 1);
  const allow = allowedGenderDigits(birth) as string[]; // 수정: birth 전체를 전달
  
  // 빈 값이면 그대로 설정
  if (!digit) {
    setGenderDigit("");
    setGenderErr("");
    return;
  }
  
  // 허용 범위 체크
  if (!allow.includes(digit)) {
    const yy = parseInt(birth.slice(0, 2), 10);
    setGenderErr(
      birth && isValidYymmdd(birth)
        ? yy >= 0
          ? "2000년생 이후는 3(남) 또는 4(여)만 가능합니다."
          : "1999년생 이전은 1(남) 또는 2(여)만 가능합니다."
        : "생년월일을 올바르게 입력하세요."
    );
    // 허용되지 않아도 입력은 유지 (사용자가 볼 수 있도록)
    setGenderDigit(digit);
    return;
  }
  
  // 허용된 값이면 설정하고 에러 제거
  setGenderDigit(digit);
  setGenderErr("");
};

// [참고] 전송/저장 시 가공 예시 주민번호
const payloadPreview = useMemo(() => {
    if (birth.length === 6 && isValidYymmdd(birth) && ["1","2","3","4"].includes(genderDigit)) {
    const yy = birth.slice(0,2);
    const gender = genderFromDigit(genderDigit as "1"|"2"|"3"|"4"); // "M" | "F"
    return {
      birth: birth, // "000415" (YYMMDD 형식)
      genderDigit,                     // "1"|"2"|"3"|"4"
      gender,                          // "M"|"F"
    };
  }
  return null;
}, [birth, genderDigit]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if(!email) {
      alert("이메일을 입력하세요.")
      emailRef.current?.focus();
      return;
    }

    if(!password) {
      alert('비밀번호를 입력하세요')
      passwordRef.current?.focus();
      return;
    }

    if(!confirmPassword) {
      alert('비밀번호 확인을 입력하세요')
      confirmPasswordRef.current?.focus();
      return;
    }

    if(password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.')
      passwordRef.current?.focus();
      confirmPasswordRef.current?.focus();
      return;
    }

    if(!name) {
      alert('이름을 입력하세요');
      nameRef.current?.focus();
      return;
    }

    if(!nickname) {
      alert('닉네임을 입력하세요');
      nicknameRef.current?.focus();
      return;
    }

    if(!birth) {
      alert('생년월일을 입력하세요');
      birthRef.current?.focus();
      return;
    }

    if(!genderDigit) {
      alert('성별을 입력하세요');
      genderDigitRef.current?.focus();
      return;
    }

    if(!agreedToTerms) {
      alert('이용약관에 동의하세요');
      setIsAgreementModalOpen(true); // 바로 모달 띄워주기
      return;
    }

    
    setIsLoading(true)

    try {
  
      await API.post("/user/signup", { email, password, name, nickname, birth, genderDigit })
      alert('회원가입 완료 로그인 화면으로 전환합니다')
      router.push("/user/login")
    } catch (err) {
      setError("회원가입에 실패했습니다. 다시 시도해주세요.")
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
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
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
              <Label htmlFor="name">이름</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  ref={nameRef}
                  
                  placeholder="홍길동"
                  value={name}
                  onChange={handleName}
                  className="pl-10"
                  required
                />
              </div>
              <div className="text-xs text-red-500">{nameErr}</div>
            </div>
            <div style={{ display: emailReadOnly ? "none" : "block" }} className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  readOnly={emailReadOnly}
                  type="email"
                  ref={emailRef}
                  placeholder="example@email.com"
                  value={email}
                  onChange={handleEmail}
                  className={`pl-10 ${emailReadOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  required
                />
              </div>
            </div>                
            

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


          {/* ✅ 주민등록번호 (생년월일 + 성별을 한 그룹으로) */}
          <div className="space-y-2">
            <Label htmlFor="birth">주민등록번호</Label>

            {/* 위 줄: 입력 영역 한 줄 */}
            <div className="flex items-center gap-1">
              {/* 생년월일 */}
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="birth"
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 000415"
                  value={birth}
                  onChange={handleBirthChange}
                  maxLength={6}
                  className="pl-10"
                  required
                />
              </div>

              <div className="text-lg px-1">-</div>

              {/* 성별 한 자리 + ****** */}
              <div className="flex items-center gap-2 flex-1">
                <div className="relative w-10">
                  <Input
                    id="genderDigit"
                    ref={genderInputRef}
                    type="text"
                    inputMode="numeric"
                    value={genderDigit}
                    onChange={handleGenderDigitChange}
                    maxLength={1}
                    className="text-center"
                    required
                  />
                </div>
                <div className="text-lg">******</div>
              </div>
            </div>

            {/* 아래 줄: 에러 메시지 (둘 다 같이) */}
            <div className="flex justify-between text-xs text-red-500 min-h-[1rem]">
              <span>{birthErr}</span>
              <span>{genderErr}</span>
            </div>
          </div>

            {/* 닉네임 인증 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nickname"
                  type="nickname"
                  placeholder="닉네임을 입력하세요"
                  value={nickname}
                  ref={nicknameRef}
                  onChange={handleNickname}
                  className="pl-10"
                  required
                />
              </div>
              <div className="text-xs text-red-500">{nicknameErr}</div>
            </div>

            <div className="flex items-center space-x-2 mb-4 flex justify-center items-center">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                onClick={() => setIsAgreementModalOpen(true)}
              />
              <button
                type="button"
                onClick={() => setIsAgreementModalOpen(true)}
                className="text-sm leading-none text-left text-primary hover:underline cursor-pointer"
              >
                이용약관 및 개인정보처리방침에 동의합니다
              </button>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full cursor-pointer hover:text-white" 
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? "가입 중..." : "가입하기"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/user/login" className="text-primary font-medium hover:underline">
                로그인
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      {/* ✅ AgreementModal 연결 */}
      <AgreementPageModal
        isOpen={isAgreementModalOpen}  // ✅ 모달 열림 여부
        onClose={() => setIsAgreementModalOpen(false)}  // ✅ 모달 닫기
        onConfirm={() => setAgreedToTerms(true)}  // ✅ 약관 동의 확인
      />
    </div>
  )
}
