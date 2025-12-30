// 뉴스 API 클라이언트

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000"

export interface NewsArticle {
  id: string
  title: string
  excerpt: string
  link: string
  date: string
  source: string
}

export interface NewsResponse {
  success: boolean
  data: NewsArticle[]
  count: number
  elapsedTime?: number
}

/**
 * 뉴스 기사 목록 조회
 */
export async function getNews(filterKeywords: boolean = true): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/news?filter=${filterKeywords}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`서버 응답 오류: ${response.status} - ${errorText}`)
    }

    const result: NewsResponse = await response.json()
    
    if (!result.success) {
      throw new Error('뉴스 조회 실패')
    }

    return result.data
  } catch (error: any) {
    console.error('뉴스 API 호출 오류:', error)
    throw error
  }
}

