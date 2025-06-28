import Header from '@/components/layout/Header'
import CanvasContainer from '@/components/canvas/CanvasContainer'

export default function TownEditorPage({ params: _params }: { params: { id: string } }) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative">
        <CanvasContainer />
      </div>
    </div>
  )
}