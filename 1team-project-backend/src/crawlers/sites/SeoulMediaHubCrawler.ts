import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseCrawler } from '../base/BaseCrawler'
import { NewsArticle } from '../types'

export class SeoulMediaHubCrawler extends BaseCrawler {
  name = '서울시 미디어허브'
  private baseUrl = 'https://mediahub.seoul.go.kr'

  async crawl(): Promise<NewsArticle[]> {
    try {
      const articles: NewsArticle[] = []
      const url = `${this.baseUrl}/archives`
      
      console.log(`[${this.name}] 크롤링 URL: ${url}`)
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      })

      console.log(`[${this.name}] 응답 상태: ${response.status}, 데이터 크기: ${response.data.length} bytes`)

      const $ = cheerio.load(response.data)
      
      // 여러 선택자 시도
      const selectors = [
        '.article-item',
        '.news-item', 
        'article',
        '.post',
        '.list-item',
        '.item',
        'li',
        'div[class*="article"]',
        'div[class*="news"]'
      ]
      
      let found = false
      for (const selector of selectors) {
        const elements = $(selector)
        if (elements.length > 0) {
          console.log(`[${this.name}] 선택자 "${selector}"로 ${elements.length}개 요소 발견`)
          found = true
          break
        }
      }
      
      if (!found) {
        console.warn(`[${this.name}] ⚠️ 기사 요소를 찾지 못했습니다. HTML 구조 확인 필요`)
        console.log(`[${this.name}] HTML 샘플 (처음 500자):`, response.data.substring(0, 500))
      }
      
      // 기사 목록 선택자 (사이트 구조에 맞게 수정 필요)
      $('.article-item, .news-item, article, .post, .list-item, .item').each((index, element) => {
        try {
          const $el = $(element)
          
          // 제목 추출
          const title = this.cleanText(
            $el.find('h3, h2, .title, a').first().text()
          )
          
          if (!title) return

          // 링크 추출
          const linkEl = $el.find('a').first()
          const relativeLink = linkEl.attr('href') || ''
          const link = this.normalizeUrl(relativeLink, this.baseUrl)

          // 날짜 추출
          const dateText = $el.find('.date, .published, time').first().text()
          const date = this.formatDate(dateText)

          // 요약 추출
          const excerpt = this.cleanText(
            $el.find('.excerpt, .summary, .description, p').first().text()
          ).substring(0, 300)

          articles.push({
            id: `seoul-${index}-${Date.now()}`,
            title,
            excerpt: excerpt || title,
            link,
            date,
            source: this.name,
          })
        } catch (error) {
          console.error(`[${this.name}] 기사 파싱 오류:`, error)
        }
      })

      return articles
    } catch (error) {
      console.error(`[${this.name}] 크롤링 오류:`, error)
      return []
    }
  }
}

