'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'


interface Props {
  url: string
  titre?: string
}

export default function PDFViewer({ url, titre }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<any>(null)
  const [pageActuelle, setPageActuelle] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const renderTaskRef = useRef<any>(null)

  useEffect(() => {
    let pdfDoc: any = null

    const chargerPDF = async () => {
      try {
        setLoading(true)
        setError(false)

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        // Utiliser Google Docs comme proxy pour éviter les problèmes CORS
        const proxyUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`

        
        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setPageActuelle(1)
        setLoading(false)
      } catch (err) {
        console.error('Erreur chargement PDF:', err)
        setError(true)
        setLoading(false)
      }
    }

    chargerPDF()

    return () => {
      if (pdfDoc) pdfDoc.destroy()
    }
  }, [url])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return

    const renderPage = async () => {
      try {
        // Annuler le rendu précédent
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }

        const page = await pdf.getPage(pageActuelle)
        const canvas = canvasRef.current
        if (!canvas) return

        const viewport = page.getViewport({ scale: zoom })
        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport,
        }

        renderTaskRef.current = page.render(renderContext)
        await renderTaskRef.current.promise
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Erreur rendu page:', err)
        }
      }
    }

    renderPage()
  }, [pdf, pageActuelle, zoom])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-gray-500 text-sm text-center">
          Impossible de charger ce PDF directement.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          Ouvrir dans le navigateur
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">

      {/* Barre de contrôles */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 gap-2 flex-shrink-0">
        
        {/* Navigation pages */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageActuelle(p => Math.max(1, p - 1))}
            disabled={pageActuelle <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 whitespace-nowrap">
            {loading ? '...' : `${pageActuelle} / ${totalPages}`}
          </span>
          <button
            onClick={() => setPageActuelle(p => Math.min(totalPages, p + 1))}
            disabled={pageActuelle >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.2))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Ouvrir dans navigateur */}
        
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green font-medium hover:underline whitespace-nowrap"
        <a>
          Ouvrir ↗
        </a>
      </div>

      {/* Canvas PDF */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {loading ? (
          <div className="flex items-center gap-3 mt-20">
            <Loader2 className="w-6 h-6 animate-spin text-green" />
            <span className="text-sm text-gray-500">Chargement du document...</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-lg max-w-full"
            style={{ display: 'block' }}
          />
        )}
      </div>
    </div>
  )
}