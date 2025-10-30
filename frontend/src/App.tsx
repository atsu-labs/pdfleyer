import React, { useState, useRef, useEffect } from 'react'
import PdfViewer from './components/PdfViewer'
import PdfPagination from './components/PdfPagination'
import DrawingToolbar, { ToolType } from './components/DrawingToolbar'
import DrawingCanvas, { Annotation } from './components/DrawingCanvas'

export default function App() {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedTool, setSelectedTool] = useState<ToolType>(null)
  const pdfContainerRef = useRef<HTMLDivElement | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0]
    if (f) {
      const url = URL.createObjectURL(f)
      setFileUrl(url)
      setCurrentPage(1)
    }
  }

  function handleLoadSuccess(pages: number) {
    setNumPages(pages)
  }

  function handlePageChange(page: number) {
    setCurrentPage(page)
  }

  function handleAnnotationCreate(annotation: Annotation) {
    console.log('Annotation created:', annotation)
    setAnnotations(prev => [...prev, annotation])
  }

  // Update canvas size when PDF is loaded
  useEffect(() => {
    const updateSize = () => {
      const canvas = document.querySelector('[data-testid="pdf-canvas"]') as HTMLCanvasElement
      if (canvas) {
        const newWidth = canvas.width
        const newHeight = canvas.height
        if (newWidth > 0 && newHeight > 0 && (newWidth !== canvasSize.width || newHeight !== canvasSize.height)) {
          console.log('Canvas size updated:', newWidth, newHeight)
          setCanvasSize({ width: newWidth, height: newHeight })
        }
      }
    }
    
    // Check multiple times to ensure PDF is fully loaded
    const timer1 = setTimeout(updateSize, 100)
    const timer2 = setTimeout(updateSize, 500)
    const timer3 = setTimeout(updateSize, 1000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [fileUrl, currentPage])

  return (
    <div style={{ padding: 20 }}>
      <h1>PDF Overlay Annotator Demo</h1>
      <input type="file" accept="application/pdf" onChange={handleFile} />
      {fileUrl && (
        <div style={{ marginTop: 20 }}>
          {/* Drawing Toolbar */}
          <DrawingToolbar 
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
          />
          
          {/* PDF and Drawing Canvas Container */}
          <div style={{ position: 'relative', display: 'inline-block', marginTop: 10 }}>
            {/* PDF Layer (底) */}
            <div ref={pdfContainerRef}>
              <PdfViewer 
                url={fileUrl} 
                page={currentPage}
                onLoadSuccess={handleLoadSuccess}
              />
            </div>
            
            {/* Drawing Canvas Layer (上) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'auto'
            }}>
              <DrawingCanvas 
                width={canvasSize.width}
                height={canvasSize.height}
                selectedTool={selectedTool}
                page={currentPage}
                onAnnotationCreate={handleAnnotationCreate}
              />
            </div>
          </div>
          
          <div style={{ marginTop: 10 }}>
            <PdfPagination 
              numPages={numPages}
              initialPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
          {annotations.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>作成した注釈 ({annotations.length}件)</h3>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 10, 
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 200
              }}>
                {JSON.stringify(annotations, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
