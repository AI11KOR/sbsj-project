// 뉴스 기사 데이터 타입
export interface NewsArticle {
  id: string
  title: string
  excerpt: string
  link: string
  date: string
  source: string
}

// 크롤러 인터페이스
export interface BaseCrawler {
  name: string
  crawl(): Promise<NewsArticle[]>
}

