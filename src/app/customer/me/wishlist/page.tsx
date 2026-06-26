import Link from 'next/link'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, buttonVariants } from '@/components/ui'

export default function WishlistPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">관심 업체 목록</CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            title="찜한 업체가 없습니다."
            description="포트폴리오에서 마음에 드는 공장을 찜하면 여기에 모아 볼 수 있습니다."
            action={
              <Link href="/portfolios" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                포트폴리오 둘러보기
              </Link>
            }
          />
        </CardBody>
      </Card>
    </div>
  )
}
