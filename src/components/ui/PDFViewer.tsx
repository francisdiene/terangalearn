'use client'

import { useState } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'

interface Props {
  url: string
  titre?: string
}

export default function PDFViewer({ url, titre }: Props) {
  const [loading, setLoading] = useState(true)

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`

  return (
    <div className="flex flex-col h-full">
      {/* Barre outils */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <span className="text-xs text-gray-500 truncate flex-1 mr-3">{titre}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-green font-medium hover:underline whitespace-nowrap flex-shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ouvrir
        </a>
      </div>

      {/* Loader */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-green" />
              <p className="text-sm text-gray-500">Chargement du document...</p>
            </div>
          </div>
        )}
        <iframe
          src={googleViewerUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title={titre}
          allow="autoplay"
        />
      </div>
    </div>
  )
}