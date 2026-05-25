'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Plus, Send, CheckCircle2, Clock, X, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Ticket = {
  id: string; subject: string; message: string
  status: 'OPEN' | 'REPLIED' | 'CLOSED'
  reply: string | null; repliedAt: string | null; createdAt: string
}

const STATUS = {
  OPEN:    { label: 'Açık',     cls: 'bg-amber-400/15 text-amber-400 border-amber-400/30' },
  REPLIED: { label: 'Yanıtlandı', cls: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-400' },
  CLOSED:  { label: 'Kapalı',   cls: 'bg-slate-400/15 text-slate-400 border-slate-400/30' },
}

export function DestekPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () =>
    fetch('/api/admin/talep').then(r => r.json()).then(d => { setTickets(d); setLoading(false) })

  useEffect(() => { load() }, [])

  async function submit() {
    if (!subject.trim() || !message.trim()) { setError('Konu ve mesaj zorunlu'); return }
    setSending(true); setError('')
    const res = await fetch('/api/admin/talep', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message }),
    })
    if (res.ok) {
      setSubject(''); setMessage(''); setShowForm(false); load()
    } else {
      const d = await res.json()
      setError(d.hata ?? 'Bir hata oluştu')
    }
    setSending(false)
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Destek Talepleri</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Sorun veya önerinizi iletebilirsiniz</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'İptal' : 'Yeni Talep'}
        </button>
      </div>

      {/* New ticket form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <p className="font-semibold text-sm">Yeni Destek Talebi</p>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Konu</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Talebinizin konusu..."
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Mesaj</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                  placeholder="Sorununuzu veya önerinizi detaylıca açıklayın..."
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex justify-end">
                <button onClick={submit} disabled={sending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer">
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                  Gönder
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border bg-card text-muted-foreground gap-3">
          <MessageSquare className="w-10 h-10 opacity-30" />
          <p className="text-sm">Henüz destek talebiniz yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t, i) => {
            const s = STATUS[t.status]
            const isOpen = expanded === t.id
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-foreground/3 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{t.subject}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${s.cls}`}>{s.label}</span>
                      {t.status === 'REPLIED' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.createdAt)}</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                        {/* Original message */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Talebiniz</p>
                          <p className="text-sm whitespace-pre-wrap">{t.message}</p>
                        </div>
                        {/* Reply */}
                        {t.reply && (
                          <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Fox Destek Ekibi · {t.repliedAt ? formatDate(t.repliedAt) : ''}</p>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{t.reply}</p>
                          </div>
                        )}
                        {t.status === 'OPEN' && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            Talebiniz inceleniyor, en kısa sürede yanıt verilecektir.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
