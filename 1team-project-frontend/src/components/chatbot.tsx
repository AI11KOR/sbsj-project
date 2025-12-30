"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react"
import Image from "next/image"
import { cn } from "@/src/lib/utils"
import { ragChatStream, type Source, type ConversationMessage } from "@/src/api/chatApi"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  isStreaming?: boolean
  sources?: Source[]
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "안녕하세요! 상권 분석 및 창업 상담 AI입니다. 무엇을 도와드릴까요? 😊",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 자동 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputText
    setInputText("")
    setIsLoading(true)

    // 최근 10개 대화만 선택 (첫 번째 환영 메시지 제외)
    const MAX_HISTORY = 10
    const recentMessages = [...messages, userMessage]
      .filter((msg) => !(msg.id === "1" && msg.sender === "bot"))
      .slice(-MAX_HISTORY)

    // OpenAI 형식으로 변환
    const conversationHistory: ConversationMessage[] = recentMessages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }))

    // 스트리밍 응답을 위한 AI 메시지 생성
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: Message = {
      id: aiMessageId,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isStreaming: true,
      sources: [],
    }
    setMessages((prev) => [...prev, aiMessage])

    try {
      let currentContent = ""
      let currentSources: Source[] = []

      await ragChatStream(currentInput, conversationHistory, (chunk) => {
        if (chunk.event === "sources") {
          // 참고 문서 정보 저장
          currentSources = chunk.sources || []
          console.log("📥 [Chatbot] 참고 문서:", currentSources.length, "개")
        } else if (chunk.event === "answer") {
          // 답변 청크 추가
          currentContent += chunk.content || ""
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, text: currentContent }
                : msg
            )
          )
        } else if (chunk.event === "error") {
          // 에러 처리
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    text: chunk.message || "오류가 발생했습니다.",
                    isStreaming: false,
                  }
                : msg
            )
          )
        } else if (chunk.event === "done") {
          // 스트리밍 완료
          console.log("📥 [Chatbot] RAG 스트리밍 완료")
        }
      })

      // 스트리밍 완료 후 참고 문서 추가
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, isStreaming: false, sources: currentSources }
            : msg
        )
      )
    } catch (error: any) {
      console.error("챗봇 API 호출 오류:", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: "죄송합니다. 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
                isStreaming: false,
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <div className="px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-primary/20 rounded-full shadow-md text-sm font-medium text-foreground whitespace-nowrap">
            챗봇 문의하기
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            size="icon"
            className="h-22 w-22 rounded-full shadow-lg bg-green-500/30 hover:bg-green-500/50 border-2 border-green-500/40"
          >
            <Image 
              src="/logo.png" 
              alt="챗봇 로고" 
              width={50} 
              height={50}
              className="object-contain"
            />
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[850px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/30 border-2 border-green-500/40 rounded-lg">
                <Image 
                  src="/logo.png" 
                  alt="챗봇 로고" 
                  width={32} 
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-base">AI 상담사</CardTitle>
                <p className="text-xs text-muted-foreground">온라인</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <ScrollArea
            ref={messagesContainerRef}
            className="flex-1 p-4 overflow-y-auto"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.text}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {/* 참고 문서 출처 표시 (AI 응답에만) */}
                    {message.sender === "bot" && message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          참고 문서:
                        </p>
                        <div className="space-y-2">
                          {message.sources.map((source, idx) => (
                            <div
                              key={idx}
                              className="bg-background rounded p-2 text-xs border"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-foreground">
                                  {source.metadata.source.split("/").pop() ||
                                    source.metadata.source}
                                </span>
                                <span className="text-muted-foreground">
                                  유사도: {(source.score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-muted-foreground line-clamp-2">
                                {source.content.length > 100
                                  ? source.content.substring(0, 100) + "..."
                                  : source.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <CardContent className="pt-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="메시지를 입력하세요..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
