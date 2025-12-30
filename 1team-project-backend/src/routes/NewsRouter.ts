import { Router } from 'express'
import { getNews, getNewsStatus } from '../controllers/NewsController'

const router = Router()

// 뉴스 기사 목록 조회
router.get('/', getNews)

// 뉴스 크롤러 상태 확인
router.get('/status', getNewsStatus)

export default router

