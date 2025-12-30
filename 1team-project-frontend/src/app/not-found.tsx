import Link from "next/link"
import Image from "next/image"
import { Button } from "@/src/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* 404 이미지 */}
        <div className="relative w-full h-auto max-w-lg mx-auto">
          <Image
            src="/404_image.png"
            alt="404 Not Found"
            width={1800}
            height={1800}
            className="w-full h-auto rounded-lg shadow-lg"
            priority
          />
        </div>

        {/* 안내 메시지 */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-slate-800">페이지를 찾을 수 없습니다</h1>
          <p className="text-lg text-slate-600">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        {/* 홈으로 돌아가기 버튼 */}
        <div className="pt-4">
          <Button asChild size="lg" className="shadow-md">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

