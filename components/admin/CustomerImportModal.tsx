'use client'
import { useState, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

type Props = { onClose: () => void; onSuccess: () => void }
type ParseError = { row: number; field: string; message: string }

export function CustomerImportModal({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; duplicatesSkipped: number } | null>(null)
  const [errors, setErrors] = useState<ParseError[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setErrors([])
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/musteriler/import', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.status === 422) { setErrors(data.errors); return }
    if (res.ok) { setResult(data) }
    else { setErrors([{ row: 0, field: 'Genel', message: data.hata ?? 'Yükleme başarısız' }]) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">Excel ile Müşteri Yükle</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Dosya seçin veya sürükleyin</p>
                  <p className="text-xs text-muted-foreground mt-1">.xlsx veya .xls</p>
                </>
              )}
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>

            {errors.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm font-medium text-red-400 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" /> {errors.length} hata bulundu
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {errors.map((e, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {e.row > 0 ? `Satır ${e.row} · ` : ''}{e.field}: {e.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">İptal</button>
              <button onClick={handleUpload} disabled={!file || uploading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60 transition-colors">
                {uploading ? 'Yükleniyor...' : 'Yükle'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="font-semibold text-lg mb-2">Yükleme Tamamlandı</p>
            <p className="text-muted-foreground text-sm">{result.inserted} müşteri eklendi · {result.duplicatesSkipped} tekrar atlandı</p>
            <button onClick={onSuccess} className="mt-6 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              Tamam
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
