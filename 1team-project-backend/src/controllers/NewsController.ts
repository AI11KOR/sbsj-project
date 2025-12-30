import { Request, Response } from 'express'
import { NewsCrawlerManager } from '../crawlers/NewsCrawlerManager'

const crawlerManager = new NewsCrawlerManager()

/**
 * 뉴스 기사 목록 조회
 * GET /api/news
 */
export const getNews = async (req: Request, res: Response) => {
  try {
    const { filter = 'true' } = req.query
    const filterKeywords = filter === 'true'

    console.log('[NewsController] 뉴스 크롤링 시작...')
    console.log(`[NewsController] 키워드 필터링: ${filterKeywords ? '활성화' : '비활성화'}`)
    const startTime = Date.now()

    // 크롤링 실행
    let articles = await crawlerManager.crawlAll(filterKeywords)

    console.log(`[NewsController] 크롤링 후 기사 수: ${articles.length}개`)

    // 날짜순 정렬
    articles = crawlerManager.sortByDate(articles)

    const elapsedTime = Date.now() - startTime
    console.log(`[NewsController] 크롤링 완료 (${elapsedTime}ms, ${articles.length}개 기사)`)

    // 디버깅: 첫 번째 기사 정보 출력
    if (articles.length > 0) {
      console.log(`[NewsController] 첫 번째 기사: ${articles[0].title.substring(0, 50)}...`)
    } else {
      console.warn('[NewsController] ⚠️ 기사가 0개입니다. 크롤러나 필터링을 확인하세요.')
    }

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      elapsedTime,
      filterKeywords,
    })
  } catch (error: any) {
    console.error('[NewsController] 오류:', error)
    console.error('[NewsController] 스택:', error.stack)
    res.status(500).json({
      success: false,
      error: '뉴스 크롤링 중 오류가 발생했습니다.',
      message: error.message,
    })
  }
}

/**
 * 뉴스 크롤링 상태 확인
 * GET /api/news/status
 */
export const getNewsStatus = async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '뉴스 크롤러가 정상 작동 중입니다.',
    crawlers: crawlerManager.crawlers.map(c => c.name),
  })
}

