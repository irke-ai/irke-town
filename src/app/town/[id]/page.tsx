import Header from '@/components/layout/Header'
import EditorLayout from '@/components/layout/EditorLayout'
import ToolPanel from '@/components/layout/ToolPanel'
import CanvasContainer from '@/components/canvas/CanvasContainer'

export default function TownEditorPage({ params: _params }: { params: { id: string } }) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <EditorLayout
        toolPanel={<ToolPanel />}
        canvas={<CanvasContainer />}
      />
    </div>
  )
}