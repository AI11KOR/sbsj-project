import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseCrawler } from '../base/BaseCrawler'
import { NewsArticle } from '../types'

/**
 * Google News 검색 크롤러
 * Google News에서 키워드로 검색하여 뉴스를 수집합니다.
 */
export class GoogleNewsCrawler extends BaseCrawler {
  name = 'Google 뉴스'
  private baseUrl = 'https://news.google.com'

  async crawl(): Promise<NewsArticle[]> {
    try {
      const articles: NewsArticle[] = []
      
      // 여러 키워드로 검색 (각 키워드별로 최대 20개씩)
      const keywords = ['상권분석', '자영업자', '소상공인', '창업', '상권']
      
      for (const keyword of keywords) {
        try {
          const keywordArticles = await this.searchKeyword(keyword)
          articles.push(...keywordArticles)
          
          // 요청 간 딜레이 (너무 빠른 요청 방지)
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`[${this.name}] 키워드 "${keyword}" 검색 실패:`, error)
        }
      }

      return articles
    } catch (error) {
      console.error(`[${this.name}] 크롤링 오류:`, error)
      return []
    }
  }

  private async searchKeyword(keyword: string): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = []
    
    try {
      // Google News 검색 URL (한국어 뉴스)
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}+한국&hl=ko&gl=KR&ceid=KR:ko`
      
      console.log(`[${this.name}] 검색 키워드: ${keyword}`)
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      })

      const $ = cheerio.load(response.data, { xmlMode: true })

      $('item').each((index, element) => {
        try {
          const $el = $(element)
          
          const title = this.cleanText($el.find('title').text())
          if (!title) return

          const link = $el.find('link').text() || ''
          const pubDate = $el.find('pubDate').text()
          const date = this.formatDate(pubDate)
          
          // 변경 전 코드 (주석 처리)
          // const description = this.cleanText(
          //   $el.find('description').text()
          // ).substring(0, 300)
          
          // 변경 후: description에서 HTML 태그 제거 후 텍스트만 추출
          // description 필드에 HTML이 포함되어 있을 수 있으므로 cheerio로 파싱하여 텍스트만 추출
          const descriptionHtml = $el.find('description').html() || $el.find('description').text() || ''
          const description = this.cleanText(descriptionHtml).substring(0, 300)

          // 출처 추출 (description에서)
          const sourceMatch = description.match(/출처[:\s]+([^<]+)/) || 
                            title.match(/-\s*([^-]+)$/)
          const source = sourceMatch ? sourceMatch[1].trim() : 'Google 뉴스'

          articles.push({
            id: `google-${keyword}-${index}-${Date.now()}`,
            title,
            excerpt: description || title,
            link: link.trim(),
            date,
            source: source || this.name,
          })
        } catch (error) {
          console.error(`[${this.name}] 기사 파싱 오류:`, error)
        }
      })

      console.log(`[${this.name}] "${keyword}" 검색 결과: ${articles.length}개`)
    } catch (error) {
      console.error(`[${this.name}] 키워드 "${keyword}" 검색 오류:`, error)
    }

    return articles
  }
}

