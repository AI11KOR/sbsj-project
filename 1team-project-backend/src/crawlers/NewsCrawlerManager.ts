import { NewsArticle } from './types'
import { BaseCrawler } from './base/BaseCrawler'
import { SeoulMediaHubCrawler } from './sites/SeoulMediaHubCrawler'
import { NaverNewsCrawler } from './sites/NaverNewsCrawler'
import { DaumNewsCrawler } from './sites/DaumNewsCrawler'
import { GoogleNewsCrawler } from './sites/GoogleNewsCrawler'
import { RssFeedCrawler } from './sites/RssFeedCrawler'
import { YonhapNewsCrawler } from './sites/YonhapNewsCrawler'
import { filterByKeywords } from './utils/keywordFilter'

export class NewsCrawlerManager {
  public crawlers: BaseCrawler[] = []

  constructor() {
    // 크롤러 등록 (안정적인 크롤러 우선)
    // RSS 기반 크롤러가 가장 안정적 (동적 로딩 없음)
    this.crawlers = [
      new GoogleNewsCrawler(),      // Google News RSS (가장 안정적, 많은 기사)
      new RssFeedCrawler(),         // 정부 사이트 RSS (안정적)
      new NaverNewsCrawler(),       // 네이버 뉴스 RSS (RSS로 변경)
      // 다음 뉴스와 연합뉴스는 HTML 파싱이라 불안정할 수 있음
      // new DaumNewsCrawler(),     // 다음 뉴스 (HTML 파싱, 불안정)
      // new YonhapNewsCrawler(),   // 연합뉴스 (HTML 파싱, 불안정)
      // new SeoulMediaHubCrawler(), // 서울시 미디어허브 (HTML 파싱, 불안정)
    ]
  }

  /**
   * 모든 크롤러를 실행하고 결과를 합침
   */
  async crawlAll(filterKeywords: boolean = true): Promise<NewsArticle[]> {
    console.log(`[NewsCrawler] ${this.crawlers.length}개 크롤러 시작...`)
    console.log(`[NewsCrawler] 키워드 필터링: ${filterKeywords ? '활성화' : '비활성화'}`)
    
    const allArticles: NewsArticle[] = []
    
    // 병렬 크롤링
    const results = await Promise.allSettled(
      this.crawlers.map(crawler => {
        console.log(`[NewsCrawler] ${crawler.name} 크롤링 시작...`)
        return crawler.crawl()
      })
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const articles = result.value
        console.log(`[${this.crawlers[index].name}] ✅ ${articles.length}개 기사 수집`)
        if (articles.length > 0) {
          console.log(`[${this.crawlers[index].name}] 첫 기사 예시: ${articles[0].title.substring(0, 50)}...`)
        }
        allArticles.push(...articles)
      } else {
        console.error(`[${this.crawlers[index].name}] ❌ 크롤링 실패:`, result.reason)
        if (result.reason?.message) {
          console.error(`[${this.crawlers[index].name}] 오류 메시지:`, result.reason.message)
        }
      }
    })

    console.log(`[NewsCrawler] 총 ${allArticles.length}개 기사 수집 완료`)

    // 중복 제거 (제목 기준)
    const uniqueArticles = this.removeDuplicates(allArticles)
    console.log(`[NewsCrawler] 중복 제거 후 ${uniqueArticles.length}개 기사`)

    // 키워드 필터링
    if (filterKeywords) {
      const beforeFilter = uniqueArticles.length
      const filtered = filterByKeywords(uniqueArticles)
      console.log(`[NewsCrawler] 키워드 필터링: ${beforeFilter}개 → ${filtered.length}개`)
      
      // 필터링 후 기사가 부족한 경우 (크롤러가 성공했지만 필터링으로 제거된 경우)
      if (filtered.length < 30 && beforeFilter >= 30) {
        console.log(`[NewsCrawler] 필터링으로 기사가 ${filtered.length}개로 줄었습니다. 완화된 필터링 적용...`)
        
        // 필터링을 완화하여 더 많은 기사 포함
        const relaxedFiltered = this.relaxedFilter(uniqueArticles)
        console.log(`[NewsCrawler] 완화된 필터링: ${relaxedFiltered.length}개`)
        
        // 최대 100개까지만 반환
        return relaxedFiltered.slice(0, 100)
      }
      
      if (filtered.length === 0 && beforeFilter > 0) {
        console.warn(`[NewsCrawler] ⚠️ 필터링으로 모든 기사가 제거되었습니다.`)
        console.warn(`[NewsCrawler] ⚠️ 크롤러는 ${beforeFilter}개 기사를 수집했지만, 키워드 필터링에서 모두 제거되었습니다.`)
        // 필터링 전 기사 샘플 출력
        console.log(`[NewsCrawler] 필터링 전 기사 샘플 (최대 3개):`)
        uniqueArticles.slice(0, 3).forEach((article, idx) => {
          console.log(`  ${idx + 1}. ${article.title.substring(0, 60)}...`)
        })
      }
      
      // 최대 100개까지만 반환
      return filtered.slice(0, 100)
    }

    // 필터링 없이도 최대 100개까지만 반환
    return uniqueArticles.slice(0, 100)
  }

  /**
   * 중복 기사 제거 (제목 기준)
   */
  private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>()
    return articles.filter(article => {
      const key = article.title.toLowerCase().trim()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * 완화된 필터링 (더 많은 기사 포함)
   * 핵심 키워드만 체크하여 필터링
   */
  private relaxedFilter(articles: NewsArticle[]): NewsArticle[] {
    const coreKeywords = [
      '상권', '자영업', '소상공인', '창업', '점포', '상가'
    ]
    
    return articles.filter(article => {
      const searchText = `${article.title} ${article.excerpt}`.toLowerCase()
      return coreKeywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      )
    })
  }

  /**
   * 날짜순 정렬 (최신순)
   */
  sortByDate(articles: NewsArticle[]): NewsArticle[] {
    return articles.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA // 최신순
    })
  }
}

