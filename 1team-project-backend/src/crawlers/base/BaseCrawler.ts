import { NewsArticle, BaseCrawler as IBaseCrawler } from '../types'

export abstract class BaseCrawler implements IBaseCrawler {
  abstract name: string

  abstract crawl(): Promise<NewsArticle[]>

  // 공통 유틸리티: 날짜 포맷팅
  protected formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0]
      }
      return date.toISOString().split('T')[0]
    } catch {
      return new Date().toISOString().split('T')[0]
    }
  }

  // 공통 유틸리티: 텍스트 정리
  protected cleanText(text: string): string {
    if (!text) return ''
    
    // 변경 전 코드 (주석 처리)
    // return text
    //   .replace(/\s+/g, ' ')
    //   .replace(/\n+/g, ' ')
    //   .trim()
    
    // 변경 후: HTML 태그 제거 추가
    return text
      // HTML 태그 제거 (<태그> 또는 </태그> 형태 모두 제거)
      .replace(/<[^>]*>/g, '')
      // HTML 엔티티 디코딩 (&lt; → <, &gt; → >, &amp; → &, &quot; → ", &#39; → ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // 연속된 공백을 하나로 통합
      .replace(/\s+/g, ' ')
      // 줄바꿈을 공백으로 변환
      .replace(/\n+/g, ' ')
      // 앞뒤 공백 제거
      .trim()
  }

  // 공통 유틸리티: URL 정규화
  protected normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl)
      return `${base.origin}${url}`
    }
    return `${baseUrl}/${url}`
  }
}

