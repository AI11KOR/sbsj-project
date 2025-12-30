import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseCrawler } from '../base/BaseCrawler'
import { NewsArticle } from '../types'

/**
 * 연합뉴스 크롤러
 * 연합뉴스에서 키워드 검색으로 뉴스를 수집합니다.
 */
export class YonhapNewsCrawler extends BaseCrawler {
  name = '연합뉴스'
  private baseUrl = 'https://www.yna.co.kr'

  async crawl(): Promise<NewsArticle[]> {
    try {
      const articles: NewsArticle[] = []
      
      // 키워드 검색
      const keywords = ['상권분석', '자영업자', '소상공인', '창업', '상권']
      const searchKeyword = keywords.join(' OR ')
      
      // 연합뉴스 검색 URL
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(searchKeyword)}&sort=1&period=1m`
      
      console.log(`[${this.name}] 크롤링 URL: ${url}`)
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9'
        }
      })

      console.log(`[${this.name}] 응답 상태: ${response.status}, 데이터 크기: ${response.data.length} bytes`)

      const $ = cheerio.load(response.data)
      
      // 연합뉴스 검색 결과 선택자
      $('.news-con, .list-type038, .item-news, article').each((index, element) => {
        try {
          const $el = $(element)
          
          const titleEl = $el.find('.tit-news, h3, h2, .title, a.tit')
          const title = this.cleanText(titleEl.text())
          
          if (!title || title.length < 5) return

          const linkEl = titleEl.is('a') ? titleEl : titleEl.find('a').first()
          const relativeLink = linkEl.attr('href') || ''
          const link = this.normalizeUrl(relativeLink, this.baseUrl)

          const dateText = $el.find('.date, .time, time').text()
          const date = this.formatDate(dateText)
          
          const excerpt = this.cleanText(
            $el.find('.lead, .summary, .desc, p').first().text()
          ).substring(0, 300)

          articles.push({
            id: `yonhap-${index}-${Date.now()}`,
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

      console.log(`[${this.name}] ${articles.length}개 기사 수집`)
      return articles
    } catch (error) {
      console.error(`[${this.name}] 크롤링 오류:`, error)
      return []
    }
  }
}

