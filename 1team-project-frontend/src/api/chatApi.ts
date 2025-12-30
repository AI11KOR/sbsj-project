// RAG 챗봇 API 클라이언트

const API_BASE_URL =
  process.env.NEXT_PUBLIC_RAG_URL && process.env.NEXT_PUBLIC_RAG_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_RAG_URL
    : "http://43.201.248.189:8001"

export interface Source {
  content: string
  metadata: {
    source: string
    [key: string]: any
  }
  score: number
  distance?: number
  id?: string
  rank?: number
}

export interface StreamChunk {
  event: 'sources' | 'answer' | 'error' | 'done'
  content?: string
  sources?: Source[]
  message?: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * RAG 챗봇 스트리밍 API 호출
 * 
 * @param message 사용자 메시지
 * @param conversationHistory 대화 히스토리
 * @param onChunk 스트리밍 청크 수신 콜백
 * @returns Promise<void>
 */
export async function ragChatStream(
  message: string,
  conversationHistory: ConversationMessage[],
  onChunk: (chunk: StreamChunk) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rag-chat-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        conversation_history: conversationHistory,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`서버 응답 오류: ${response.status} - ${errorText}`)
    }

    // SSE 스트리밍 처리
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('스트리밍 응답을 받을 수 없습니다.')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        // 버퍼에 남은 데이터 처리
        if (buffer.trim()) {
          processBuffer(buffer, onChunk)
        }
        break
      }

      // 청크 디코딩
      buffer += decoder.decode(value, { stream: true })
      
      // 줄 단위로 처리
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 마지막 불완전한 줄은 버퍼에 유지

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonStr = line.slice(5).trim()
          if (!jsonStr || jsonStr === '[DONE]') continue

          try {
            const data = JSON.parse(jsonStr)
            onChunk(data as StreamChunk)
          } catch (e) {
            console.error('JSON 파싱 오류:', e, line)
          }
        }
      }
    }
  } catch (error: any) {
    console.error('RAG API 호출 오류:', error)
    onChunk({
      event: 'error',
      message: error.message || '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
    })
    throw error
  }
}

/**
 * 버퍼 처리 헬퍼 함수
 */
function processBuffer(buffer: string, onChunk: (chunk: StreamChunk) => void) {
  const lines = buffer.split('\n')
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const jsonStr = line.slice(5).trim()
      if (!jsonStr) continue

      try {
        const data = JSON.parse(jsonStr)
        onChunk(data as StreamChunk)
      } catch (e) {
        console.error('JSON 파싱 오류:', e, line)
      }
    }
  }
}

/**
 * RAG 서비스 상태 확인
 */
export async function checkRAGHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rag-health`, {
      method: 'GET',
    })
    return response.ok
  } catch (error) {
    console.error('RAG 서비스 상태 확인 오류:', error)
    return false
  }
}

