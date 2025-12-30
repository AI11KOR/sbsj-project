import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseCrawler } from '../base/BaseCrawler'
import { NewsArticle } from '../types'

export class DaumNewsCrawler extends BaseCrawler {
  name = '다음 뉴스'
  private baseUrl = 'https://search.daum.net'

  async crawl(): Promise<NewsArticle[]> {
    try {
      const articles: NewsArticle[] = []
      
      // 각 키워드별로 검색 (더 많은 기사 수집)
      const keywords = ['상권분석', '자영업자', '소상공인', '창업', '상권']
      
      for (const keyword of keywords) {
        try {
          const url = `${this.baseUrl}/search?q=${encodeURIComponent(keyword)}&w=news&sort=recency&p=1`
          const keywordArticles = await this.searchKeyword(url, keyword)
          articles.push(...keywordArticles)
          
          // 요청 간 딜레이
          await new Promise(resolve => setTimeout(resolve, 500))
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

  private async searchKeyword(url: string, keyword: string): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = []
    
    try {
      console.log(`[${this.name}] 키워드 "${keyword}" 검색 중...`)
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      })

      const $ = cheerio.load(response.data)
      
      // 더 포괄적인 선택자 사용
      $('.wrap_cont, .item_news, .cont_thumb, .list_news li, article, div[class*="news"]').each((index, element) => {
        try {
          const $el = $(element)
          
          const titleEl = $el.find('.tit_thumb, a.tit_thumb, .f_link_b')
          const title = this.cleanText(titleEl.text())
          
          if (!title) return

          const link = titleEl.attr('href') || $el.find('a').first().attr('href') || ''
          const dateText = $el.find('.info_news, .f_nb').text()
          const date = this.formatDate(dateText)
          
          const excerpt = this.cleanText(
            $el.find('.desc_thumb, .f_eb').text()
          ).substring(0, 300)

          const source = $el.find('.f_nb, .info_news').first().text() || '다음 뉴스'

          articles.push({
            id: `daum-${keyword}-${index}-${Date.now()}`,
            title,
            excerpt: excerpt || title,
            link: link.startsWith('http') ? link : `https://v.daum.net${link}`,
            date,
            source: source || this.name,
          })
        } catch (error) {
          console.error(`[${this.name}] 기사 파싱 오류:`, error)
        }
      })

      console.log(`[${this.name}] "${keyword}" 검색 결과: ${articles.length}개`)
      return articles
    } catch (error) {
      console.error(`[${this.name}] 키워드 "${keyword}" 검색 오류:`, error)
      return []
    }
  }
}

