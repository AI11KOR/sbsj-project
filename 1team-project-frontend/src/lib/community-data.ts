export interface Post {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  category: string
  views: number
  likes: number
  comments: number
  createdAt: Date
  tags: string[]
  isLiked?: boolean
}

export interface Comment {
  id: string
  postId: string
  content: string
  author: string
  authorId: string
  createdAt: Date
  likes: number
}

// Mock data for demonstration
export const mockPosts: Post[] = [
  {
    id: "1",
    title: "강남역 근처 카페 창업 후기 공유합니다",
    content: "작년 11월에 강남역 10번 출구 근처에 카페를 오픈했습니다. 처음에는 유동인구만 보고 결정했는데...",
    author: "카페사장",
    authorId: "user1",
    category: "창업후기",
    views: 1234,
    likes: 45,
    comments: 12,
    createdAt: new Date("2025-01-15"),
    tags: ["강남", "카페", "창업후기"],
  },
  {
    id: "2",
    title: "홍대 상권 분석 자료 공유",
    content: "최근 3개월간 홍대 상권을 분석한 자료입니다. 유동인구와 매출 트렌드를 정리했어요.",
    author: "상권분석가",
    authorId: "user2",
    category: "정보공유",
    views: 2341,
    likes: 89,
    comments: 23,
    createdAt: new Date("2025-01-14"),
    tags: ["홍대", "상권분석", "데이터"],
  },
  {
    id: "3",
    title: "판교에서 음식점 하시는 분들 계신가요?",
    content: "판교에서 음식점 창업을 고민 중인데 실제로 운영하시는 분들의 조언이 필요합니다.",
    author: "예비사장님",
    authorId: "user3",
    category: "질문",
    views: 456,
    likes: 12,
    comments: 8,
    createdAt: new Date("2025-01-13"),
    tags: ["판교", "음식점", "질문"],
  },
  {
    id: "4",
    title: "임대료 협상 꿀팁 알려드립니다",
    content: "5년간 3번의 계약을 하면서 터득한 임대료 협상 노하우를 공유합니다.",
    author: "베테랑",
    authorId: "user4",
    category: "노하우",
    views: 3456,
    likes: 156,
    comments: 34,
    createdAt: new Date("2025-01-12"),
    tags: ["임대료", "협상", "팁"],
  },
  {
    id: "5",
    title: "건대 상권 요즘 어떤가요?",
    content: "건대입구역 근처에서 치킨집을 생각중인데 최근 상황이 궁금합니다.",
    author: "신규유저",
    authorId: "user5",
    category: "질문",
    views: 234,
    likes: 5,
    comments: 3,
    createdAt: new Date("2025-01-11"),
    tags: ["건대", "치킨", "상권"],
  },
]

export const mockComments: Comment[] = [
  {
    id: "c1",
    postId: "1",
    content:
      "저도 강남에서 카페 운영중인데 공감되는 내용이네요. 유동인구도 중요하지만 타겟층 분석이 더 중요한 것 같아요.",
    author: "카페오너",
    authorId: "user6",
    createdAt: new Date("2025-01-15T10:30:00"),
    likes: 8,
  },
  {
    id: "c2",
    postId: "1",
    content: "좋은 정보 감사합니다! 참고하겠습니다.",
    author: "예비창업자",
    authorId: "user7",
    createdAt: new Date("2025-01-15T14:20:00"),
    likes: 3,
  },
]
