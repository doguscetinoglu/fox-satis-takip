'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LifeBuoy, Plus, Send, CheckCircle2, Clock, ArrowLeft,
  ChevronDown, ChevronUp, AlertCircle, Lightbulb, CreditCard,
  HelpCircle, MessageSquare, Inbox,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Ticket = {
  id: string; subject: string; message: string
  status: 'OPEN' | 'REPLIED' | 'CLOSED'
  reply: string | null; repliedAt: string | null; createdAt: string
}

const STATUS = {
  OPEN:    { label: 'Açık',        dot: 'bg-amber-400 animate-pulse',  cls: 'bg-amber-400/10 text-amber-500 border-amber-400/30 dark:text-amber-400' },
  REPLIED: { label: 'Yanıtlandı',  dot: 'bg-emerald-400',             cls: 'bg-emerald-400/10 text-emerald-600 border-emerald-400/30 dark:text-emerald-400' },
  CLOSED:  { label: 'Kapalı',      dot: 'bg-slate-400',               cls: 'bg-slate-400/10 text-slate-500 border-slate-400/30' },
}

const CATEGORIES = [
  { id: 'Teknik Sorun',   icon: AlertCircle,   desc: 'Sistem hatası veya erişim sorunu' },
  { id: 'Fatura / Ödeme', icon: CreditCard,    desc: 'Ödeme veya abonelik ile ilgili' },
  { id: 'Öneri',          icon: Lightbulb,     desc: 'Yeni özellik veya iyileştirme' },
  { id: 'Genel Soru',     icon: HelpCircle,    desc: 'Diğer konular' },
]

type View = 'list' | 'create'

export function DestekPanel() {
  const [view, setView] = useState<View>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  /* form state */
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = () =>
    fetch('/api/admin/talep').then(r => r.json()).then(d => { setTickets(Array.isArray(d) ? d : []); setLoading(false) })

  useEffect(() => { load() }, [])

  function openCreate() {
    setCategory(''); setSubject(''); setMessage(''); setError('')
    setView('create')
  }

  async function submit() {
    if (!subject.trim() || !message.trim()) { setError('Konu ve mesaj zorunlu'); return }
    setSending(true); setError('')
    const fullSubject = category ? `[${category}] ${subject.trim()}` : subject.trim()
    const res = await fetch('/api/admin/talep', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: fullSubject, message }),
    })
    setSending(false)
    if (res.ok) { setView('list'); load() }
    else { const d = await res.json(); setError(d.hata ?? 'Bir hata oluştu') }
  }

  const openCount = tickets.filter(t => t.status === 'OPEN').length
  const repliedCount = tickets.filter(t => t.status === 'REPLIED').length

  return (
    <div className="max-w-2xl">
      <AnimatePresence mode="wait">

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
            className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Destek Taleplerim</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Tüm destek taleplerinizi buradan takip edebilirsiniz</p>
              </div>
              <button onClick={openCreate}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer">
                <Plus className="w-4 h-4" />
                Yeni Talep
              </button>
            </div>

            {/* Summary cards */}
            {tickets.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Toplam', value: tickets.length, cls: 'text-foreground' },
                  { label: 'Açık', value: openCount, cls: 'text-amber-500 dark:text-amber-400' },
                  { label: 'Yanıtlandı', value: repliedCount, cls: 'text-emerald-600 dark:text-emerald-400' },
                ].map(c => (
                  <div key={c.label} className="p-3.5 rounded-2xl border border-border bg-card text-center">
                    <p className={`text-2xl font-extrabold ${c.cls}`}>{c.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tickets */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-card gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Inbox className="w-8 h-8 text-blue-500/60" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Henüz talep oluşturmadınız</p>
                  <p className="text-sm text-muted-foreground mt-1">Sorun veya önerinizi bize iletmek için yeni talep açın</p>
                </div>
                <button onClick={openCreate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer">
                  <Plus className="w-4 h-4" /> İlk Talebimi Oluştur
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tickets.map((t, i) => {
                  const s = STATUS[t.status]
                  const isExpanded = expanded === t.id
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-2xl border border-border bg-card overflow-hidden">
                      <button onClick={() => setExpanded(isExpanded ? null : t.id)}
                        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-foreground/[0.02] transition-colors cursor-pointer">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{t.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.createdAt)}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold flex-shrink-0 ${s.cls}`}>{s.label}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-5 pb-5 pt-4 border-t border-border space-y-4">
                              {/* Message */}
                              <div className="p-4 rounded-xl bg-muted/50">
                                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Talebiniz</p>
                                <p className="text-sm whitespace-pre-wrap">{t.message}</p>
                              </div>
                              {/* Reply */}
                              {t.reply ? (
                                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                      Fox Destek Ekibi · {t.repliedAt ? formatDate(t.repliedAt) : ''}
                                    </p>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{t.reply}</p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-1">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
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
          </motion.div>
        )}

        {/* ── CREATE VIEW ── */}
        {view === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.22 }}
            className="space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')}
                className="p-2 rounded-xl border border-border hover:bg-muted transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold">Yeni Destek Talebi</h2>
                <p className="text-sm text-muted-foreground">Ekibimiz en kısa sürede yanıt verecektir</p>
              </div>
            </div>

            {/* Category picker */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Konu Kategorisi</label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(({ id, icon: Icon, desc }) => (
                  <button key={id} onClick={() => setCategory(id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer
                      ${category === id
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                        : 'border-border bg-card hover:border-blue-500/40 hover:bg-blue-500/5'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                      ${category === id ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold leading-tight ${category === id ? 'text-blue-600 dark:text-blue-400' : ''}`}>{id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Konu Başlığı <span className="text-red-500">*</span></label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Talebinizi kısaca özetleyin..."
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Mesaj <span className="text-red-500">*</span></label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6}
                placeholder="Sorununuzu veya önerinizi detaylıca açıklayın. Ne zaman ve nasıl oluştuğunu, beklentinizi belirtirseniz daha hızlı yardımcı olabiliriz."
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none" />
              <p className="text-xs text-muted-foreground text-right">{message.length} karakter</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setView('list')}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
                İptal
              </button>
              <button onClick={submit} disabled={sending || !subject.trim() || !message.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] cursor-pointer">
                {sending
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
                Talebi Gönder
              </button>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
              <LifeBuoy className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Nasıl çalışır?</p>
                <p>Talebiniz platform yöneticisine iletilir. Yanıt verildiğinde Destek sayfanızda görünür.</p>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
