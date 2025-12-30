import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseCrawler } from '../base/BaseCrawler'
import { NewsArticle } from '../types'

/**
 * 네이버 뉴스 RSS 크롤러
 * 네이버 뉴스 RSS 피드를 사용하여 안정적으로 뉴스를 수집합니다.
 */
export class NaverNewsCrawler extends BaseCrawler {
  name = '네이버 뉴스'
  private baseUrl = 'https://news.google.com'

  async crawl(): Promise<NewsArticle[]> {
    try {
      const articles: NewsArticle[] = []
      
      // 네이버 뉴스는 RSS가 제한적이므로 Google News RSS를 통해 네이버 뉴스도 포함
      // 또는 직접 네이버 뉴스 RSS URL 사용
      const keywords = ['상권분석', '자영업자', '소상공인', '창업', '상권']
      
      // 각 키워드별로 RSS 피드 크롤링
      for (const keyword of keywords) {
        try {
          // 네이버 뉴스 RSS URL (공개 RSS)
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}+site:news.naver.com&hl=ko&gl=KR&ceid=KR:ko`
          
          const keywordArticles = await this.searchRssFeed(rssUrl, keyword)
          articles.push(...keywordArticles)
          
          // 요청 간 딜레이
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

  /**
   * RSS 피드에서 뉴스 수집
   */
  private async searchRssFeed(rssUrl: string, keyword: string): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = []
    
    try {
      console.log(`[${this.name}] 키워드 "${keyword}" RSS 피드 크롤링 중...`)
      
      const response = await axios.get(rssUrl, {
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
          if (!title || title.length < 5) return

          const link = $el.find('link').text() || ''
          const pubDate = $el.find('pubDate').text()
          const date = this.formatDate(pubDate)
          
          // 변경 전 코드 (주석 처리)
          // const description = this.cleanText(
          //   $el.find('description').text()
          // ).substring(0, 300)
          
          // 변경 후: description에서 HTML 태그 제거 후 텍스트만 추출
          const descriptionHtml = $el.find('description').html() || $el.find('description').text() || ''
          const description = this.cleanText(descriptionHtml).substring(0, 300)

          // 출처 추출
          const sourceMatch = description.match(/출처[:\s]+([^<]+)/) || 
                            title.match(/-\s*([^-]+)$/)
          const source = sourceMatch ? sourceMatch[1].trim() : '네이버 뉴스'

          articles.push({
            id: `naver-${keyword}-${index}-${Date.now()}`,
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
    } catch (error: any) {
      console.error(`[${this.name}] 키워드 "${keyword}" RSS 피드 오류:`, error.message)
    }

    return articles
  }
}

