import { NewsArticle } from '../types'

// 필터링할 키워드 목록
const KEYWORDS = [
  '서울시 상권분석',
  '상권분석',
  '자영업자',
  '소상공인',
  '창업',
  '창업자',
  '점포',
  '상권',
  '상가',
  '자영업',
  '소상공인 지원',
  '창업 지원',
  '상권 활성화',
  '골목상권',
  '상권 변화',
  '점포수',
  '유동인구',
  '상권 분석',
  '자영업자 지원',
  '소상공인 정책',
]

/**
 * 뉴스 기사를 키워드로 필터링
 */
export function filterByKeywords(articles: NewsArticle[]): NewsArticle[] {
  return articles.filter(article => {
    const searchText = `${article.title} ${article.excerpt}`.toLowerCase()
    
    // 키워드 중 하나라도 포함되어 있으면 통과
    return KEYWORDS.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    )
  })
}

/**
 * 키워드 목록 반환 (확장 가능)
 */
export function getKeywords(): string[] {
  return [...KEYWORDS]
}

