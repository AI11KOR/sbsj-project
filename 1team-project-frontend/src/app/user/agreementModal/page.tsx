"use client"
import React, { useMemo, useState } from "react"
import { CheckCircle2, X } from "lucide-react"


type AgreementModalProps = {
  isOpen: boolean  // ✅ 모달 열림/닫힘
  onClose: () => void,  // ✅ 모달 닫기
  onConfirm: () => void,  // ✅ 약관 동의 확인
}

const TERMS = [
  {
    title: "서비스 이용약관",
    content: `제1조 (목적)
이 약관은 회사가 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 모든 서비스를 의미합니다.
2. "이용자"란 이 약관에 따라 회사의 서비스를 받는 회원 및 비회원을 말합니다.
3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사의 서비스를 계속적으로 이용할 수 있는 자를 말합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.
2. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지됩니다.

제4조 (서비스의 제공 및 변경)
1. 회사는 다음과 같은 업무를 수행합니다.
   - 재화 또는 용역에 대한 정보 제공 및 구매계약의 체결
   - 구매계약이 체결된 재화 또는 용역의 배송
   - 기타 회사가 정하는 업무

제5조 (서비스의 중단)
1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
2. 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상하지 않습니다.`,
  },
  {
    title: "개인정보 처리방침",
    content: `제1조 (개인정보의 처리목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

1. 홈페이지 회원 가입 및 관리
   - 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 만 14세 미만 아동의 개인정보처리 시 법정대리인의 동의여부 확인, 각종 고지·통지, 고충처리 목적으로 개인정보를 처리합니다.

2. 재화 또는 서비스 제공
   - 물품배송, 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산, 채권추심 목적으로 개인정보를 처리합니다.

3. 고충처리
   - 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 목적으로 개인정보를 처리합니다.

제2조 (개인정보의 처리 및 보유기간)
1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
   - 홈페이지 회원 가입 및 관리: 회원 탈퇴 시까지
   - 재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료시까지

제3조 (개인정보의 제3자 제공)
회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.`,
  },
  {
    title: "마케팅 정보 수신 동의",
    content: `제1조 (마케팅 정보 수신 동의)
회사는 다음과 같은 마케팅 정보를 제공할 수 있습니다.

1. 신상품 소식 및 이벤트 정보
   - 새로운 상품 출시 정보
   - 할인 이벤트 및 프로모션 정보
   - 시즌별 특가 상품 안내

2. 맞춤형 상품 추천
   - 구매 이력 기반 상품 추천
   - 관심 카테고리 상품 정보
   - 개인화된 쿠폰 및 혜택 제공

3. 서비스 개선 및 만족도 조사
   - 서비스 이용 만족도 조사
   - 새로운 기능 및 서비스 안내
   - 고객 의견 수렴을 위한 설문조사

제2조 (수신 방법)
마케팅 정보는 다음의 방법으로 제공됩니다.
1. 이메일
2. SMS/MMS
3. 앱 푸시 알림
4. 우편물

제3조 (동의 철회)
1. 마케팅 정보 수신에 대한 동의는 언제든지 철회할 수 있습니다.
2. 동의 철회 방법:
   - 이메일 하단의 수신거부 링크 클릭
   - 고객센터 전화 또는 이메일 문의
   - 마이페이지에서 직접 설정 변경

제4조 (동의하지 않을 권리)
정보주체는 마케팅 정보 수신 동의를 거부할 권리가 있으며, 동의를 거부하더라도 서비스 이용에는 제한이 없습니다. 단, 마케팅 정보를 받지 못할 수 있습니다.

본 동의는 회원가입과 별개이며, 동의하지 않아도 회원가입 및 서비스 이용이 가능합니다.`,
  },
]

const AgreementPageModal = ({ isOpen, onClose, onConfirm }: AgreementModalProps) => {
  const refs = useMemo(
    () => TERMS.map(() => React.createRef<HTMLDivElement>()),
    []
  )

  const [scrollStates, setScrollStates] = useState(() =>
    TERMS.map(() => false)
  )
  const [checkStates, setCheckStates] = useState(() =>
    TERMS.map(() => false)
  )

  const handleScroll = (i: number) => {
    const box = refs[i].current
    if (!box) return

    const { scrollTop, scrollHeight, clientHeight } = box

    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setScrollStates((prev) => {
        if (prev[i]) return prev
        const next = [...prev]
        next[i] = true
        return next
      })
    }
  }

  const handleCheckbox =
    (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked
      setCheckStates((prev) => {
        const next = [...prev]
        next[i] = checked
        return next
      })
    }

  const allAgreed = checkStates.every(Boolean)

  const handleAgreeAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    setCheckStates(TERMS.map(() => isChecked))
    setScrollStates(TERMS.map(() => isChecked))
  }



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.4)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4 border border-slate-200/70">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-emerald-900">
          <h2 className="text-xl font-bold text-white tracking-tight">서비스 이용약관 동의</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="overflow-y-auto flex-1 bg-slate-50 p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            {/* 설명 */}
            <div className="text-center mb-6 p-6 bg-white rounded-xl shadow-sm">
              <p className="text-base md:text-lg text-slate-600 font-medium">
                서비스 이용을 위해 아래 약관을 확인하고 동의해주세요
              </p>
            </div>

        {/* 전체 동의 섹션 */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-900 rounded-2xl px-6 py-5 mb-8 shadow-2xl">
          <label className="flex items-center gap-4 cursor-pointer text-white">
            {/* 숨김 체크박스 + 커스텀 체크박스 */}
            <input
              type="checkbox"
              onChange={handleAgreeAll}
              checked={allAgreed}
              className="peer sr-only"
            />
            <span className="w-7 h-7 rounded-lg border-2 border-white/40 flex items-center justify-center bg-white/10 text-white text-lg transition peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:border-white">
              {allAgreed && <CheckCircle2 className="w-5 h-5" />}
            </span>
            <span className="text-lg md:text-xl font-bold tracking-tight">
              모든 약관에 동의합니다
            </span>
          </label>
        </div>

        {/* 개별 약관 섹션들 */}
        <div className="flex flex-col gap-6 mb-10">
          {TERMS.map((term, i) => {
            const isScrolled = scrollStates[i] ?? false
            const isChecked = checkStates[i] ?? false
            const disabled = !isScrolled

            return (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md border-2 border-slate-100 overflow-hidden transition-all duration-300 hover:border-slate-200 hover:shadow-xl"
              >
                {/* 약관 헤더 */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  {/* <Icon className="w-5 h-5 text-blue-700" /> */}
                  <h3 className="text-base md:text-lg font-bold text-slate-900 flex-1">
                    {term.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-600 text-[11px] font-bold tracking-[0.08em] uppercase text-white">
                    필수
                  </span>
                </div>

                {/* 약관 내용 */}
                <div
                  ref={refs[i]}
                  onScroll={() => handleScroll(i)}
                  className="relative h-52 md:h-56 overflow-y-auto bg-slate-50 border-b border-slate-200"
                >
                  <div className="px-6 py-6 text-sm leading-7 text-slate-700 whitespace-pre-line font-medium">
                    {term.content}
                  </div>

                  {!isScrolled && (
                    <div className="sticky bottom-0 left-0 right-0 px-4 py-3 text-center text-sm font-bold text-red-600 bg-gradient-to-t from-red-100/70 via-red-100/30 to-transparent backdrop-blur-sm animate-pulse">
                      ↓ 약관을 끝까지 읽어주세요 ↓
                    </div>
                  )}
                </div>

                {/* 동의 체크박스 */}
                <label
                  className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-colors ${
                    !disabled ? "hover:bg-slate-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={isChecked}
                    onChange={handleCheckbox(i)}
                    className="peer sr-only"
                  />
                  <span
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold transition 
                      ${
                        disabled
                          ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
                          : "bg-white border-slate-300 text-emerald-600 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-checked:text-white"
                      }`}
                  >
                    {isChecked && "✓"}
                  </span>
                  <span
                    className={`text-sm md:text-base font-semibold transition-colors ${
                      disabled ? "text-slate-400" : "text-slate-900"
                    }`}
                  >
                    위 약관에 동의합니다
                  </span>
                </label>
              </div>
            )
          })}
        </div>

            {/* 버튼 영역 */}
            <div className="flex justify-center gap-4 pt-6 pb-4">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-base font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
              >
                취소
              </button>
              <button
                disabled={!allAgreed}
                onClick={() => {
                  if (allAgreed) {
                    onConfirm();
                    onClose();
                  }
                }}
                className={`inline-flex items-center justify-center gap-2 px-10 py-3 rounded-xl text-base font-bold min-w-[220px] tracking-tight transition-all ${
                  allAgreed
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-2xl"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>동의하고 계속하기</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgreementPageModal;