import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseCrawler } from '../base/BaseCrawler'
import { NewsArticle } from '../types'

/**
 * RSS 피드 크롤러
 * 여러 RSS 피드에서 뉴스를 수집합니다.
 */
export class RssFeedCrawler extends BaseCrawler {
  name = 'RSS 피드'
  
  // RSS 피드 URL 목록 (작동하는 RSS 피드만 포함)
  private rssFeeds = [
    // 서울시 RSS (실제 RSS URL 확인 필요)
    // 'https://www.seoul.go.kr/news/news_notice.do', // RSS 형식이 아닐 수 있음
    // 기획재정부 RSS
    'https://www.moef.go.kr/rss/rss.do?ctgId=policy',
    // 중소벤처기업부는 도메인 문제로 제외
    // 'https://www.smba.go.kr/site/smba/rss.do', // ENOTFOUND 에러
  ]

  async crawl(): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = []

    for (const feedUrl of this.rssFeeds) {
      try {
        const articles = await this.crawlRssFeed(feedUrl)
        allArticles.push(...articles)
      } catch (error) {
        console.error(`[${this.name}] RSS 피드 크롤링 실패 (${feedUrl}):`, error)
      }
    }

    return allArticles
  }

  private async crawlRssFeed(feedUrl: string): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = []

    try {
      const response = await axios.get(feedUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      })

      const $ = cheerio.load(response.data, { xmlMode: true })

      // RSS 2.0 또는 Atom 형식 파싱
      $('item, entry').each((index, element) => {
        try {
          const $el = $(element)
          
          const title = this.cleanText($el.find('title').text())
          if (!title) return

          const link = $el.find('link').text() || $el.find('link').attr('href') || ''
          const pubDate = $el.find('pubDate, published, updated').text()
          const date = this.formatDate(pubDate)
          
          // 변경 전 코드 (주석 처리)
          // const description = this.cleanText(
          //   $el.find('description, summary, content').text()
          // ).substring(0, 300)
          
          // 변경 후: description에서 HTML 태그 제거 후 텍스트만 추출
          const descriptionHtml = $el.find('description, summary, content').html() || 
                                  $el.find('description, summary, content').text() || ''
          const description = this.cleanText(descriptionHtml).substring(0, 300)

          articles.push({
            id: `rss-${index}-${Date.now()}`,
            title,
            excerpt: description || title,
            link: link.trim(),
            date,
            source: this.extractSourceFromUrl(feedUrl),
          })
        } catch (error) {
          console.error(`[${this.name}] RSS 항목 파싱 오류:`, error)
        }
      })
    } catch (error) {
      console.error(`[${this.name}] RSS 피드 크롤링 오류 (${feedUrl}):`, error)
    }

    return articles
  }

  private extractSourceFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      if (hostname.includes('seoul.go.kr')) return '서울시'
      if (hostname.includes('moef.go.kr')) return '기획재정부'
      if (hostname.includes('smba.go.kr')) return '중소벤처기업부'
      return hostname
    } catch {
      return 'RSS 피드'
    }
  }
}

