'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Users, Target, FileText, ChevronRight, BarChart2,
  Bell, Shield, CheckCircle2, Zap, ArrowRight, Play, X,
} from 'lucide-react'
import { SalesFoxIcon } from '@/components/ui/SalesFoxIcon'

/* ─── Animated counter ─── */
function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (inView) motionVal.set(to)
  }, [inView, to, motionVal])

  useEffect(() => spring.on('change', v => setDisplay(Math.round(v))), [spring])

  return <span ref={ref}>{prefix}{display.toLocaleString('tr-TR')}{suffix}</span>
}

/* ─── Falling charts background ─── */
type BarItem  = { id: number; left: string; delay: number; dur: number; kind: 'bars'; color: string; bars: number[] }
type LineItem = { id: number; left: string; delay: number; dur: number; kind: 'line'; color: string; pts: number[] }
type StatItem = { id: number; left: string; delay: number; dur: number; kind: 'stat'; color: string; value: string; sub: string }
type FallItem = BarItem | LineItem | StatItem

const FALL_CHARTS: FallItem[] = [
  { id: 0, left: '3%',  delay: 0,    dur: 14, kind: 'bars', color: '#3b82f6', bars: [40, 65, 50, 80, 60, 75, 90, 85] },
  { id: 1, left: '12%', delay: 5.5,  dur: 11, kind: 'stat', color: '#10b981', value: '₺184K', sub: 'Aylık Ciro' },
  { id: 2, left: '21%', delay: 2,    dur: 16, kind: 'bars', color: '#8b5cf6', bars: [70, 45, 85, 60, 90, 70, 80] },
  { id: 3, left: '31%', delay: 9,    dur: 13, kind: 'line', color: '#3b82f6', pts: [25, 45, 35, 62, 50, 76, 62, 88, 74] },
  { id: 4, left: '42%', delay: 3.5,  dur: 17, kind: 'bars', color: '#10b981', bars: [55, 75, 45, 85, 65, 90, 75] },
  { id: 5, left: '54%', delay: 11,   dur: 12, kind: 'stat', color: '#f59e0b', value: '%78', sub: 'Hedef' },
  { id: 6, left: '64%', delay: 1,    dur: 15, kind: 'bars', color: '#3b82f6', bars: [60, 80, 50, 90, 70, 85, 95, 75] },
  { id: 7, left: '74%', delay: 7,    dur: 14, kind: 'line', color: '#8b5cf6', pts: [20, 42, 34, 58, 48, 72, 60, 85, 78] },
  { id: 8, left: '83%', delay: 4,    dur: 15, kind: 'bars', color: '#10b981', bars: [45, 70, 55, 80, 65, 75, 85] },
  { id: 9, left: '92%', delay: 8,    dur: 11, kind: 'stat', color: '#3b82f6', value: '94%', sub: 'Başarı' },
]

function MiniChartCard({ c }: { c: FallItem }) {
  const base = 'p-3 rounded-2xl border border-white/10 bg-white/[0.05]'
  if (c.kind === 'stat') {
    return (
      <div className={`${base} px-5 py-3 text-center min-w-[80px]`}>
        <p className="text-base font-bold leading-tight" style={{ color: c.color }}>{c.value}</p>
        <p className="text-[9px] mt-0.5 text-white/30">{c.sub}</p>
      </div>
    )
  }
  if (c.kind === 'line') {
    const W = 88, H = 44
    const xs = c.pts.map((_, i) => (i / (c.pts.length - 1)) * W)
    const ys = c.pts.map(v => H - (v / 100) * H)
    const poly = c.pts.map((_, i) => `${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
    const fill = `0,${H} ${poly} ${W},${H}`
    return (
      <div className={base}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <polygon points={fill} fill={c.color + '25'} />
          <polyline points={poly} fill="none" stroke={c.color} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
          {c.pts.map((_, i) => (
            <circle key={i} cx={xs[i]} cy={ys[i]} r="2" fill={c.color} opacity={0.8} />
          ))}
        </svg>
      </div>
    )
  }
  return (
    <div className={base}>
      <div className="flex items-end gap-[3px] h-11 w-[76px]">
        {c.bars.map((h, i) => (
          <div key={i} style={{
            height: `${h}%`,
            background: i === c.bars.length - 1 ? c.color : c.color + '55',
          }} className="flex-1 rounded-[3px] min-w-0" />
        ))}
      </div>
    </div>
  )
}

function FallingCharts() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.22 }}>
      {FALL_CHARTS.map(c => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{ left: c.left }}
          initial={{ y: -220 }}
          animate={{ y: 1900 }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
        >
          <MiniChartCard c={c} />
        </motion.div>
      ))}
    </div>
  )
}

/* ─── Fade-up wrapper ─── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }} className={className}>
      {children}
    </motion.div>
  )
}

/* ─── Mock dashboard preview ─── */
function DashboardPreview() {
  const bars = [35, 62, 48, 75, 58, 90, 72, 85, 65, 95, 80, 100]
  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm shadow-2xl shadow-blue-500/10 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <div className="mx-auto text-xs text-slate-500 font-mono">SalesFox · Dashboard</div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          { label: 'Aylık Ciro', value: '₺184.600', pct: '+12%', color: 'text-blue-400' },
          { label: 'Açık Borç', value: '₺32.400', pct: '8 müşteri', color: 'text-amber-400' },
          { label: 'Hedef', value: '%78', pct: 'bu ay', color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white/5 border border-white/5 p-3">
            <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
            <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.pct}</p>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="px-4 pb-4">
        <p className="text-[10px] text-slate-500 mb-2">Bu ay günlük ciro</p>
        <div className="flex items-end gap-1 h-16">
          {bars.map((h, i) => (
            <motion.div key={i} className="flex-1 rounded-sm bg-blue-500/60"
              initial={{ height: 0 }} animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.04 + 0.3, duration: 0.5, ease: 'easeOut' }} />
          ))}
        </div>
      </div>
      {/* Rep list */}
      <div className="border-t border-white/5 px-4 py-3 space-y-2">
        {[
          { name: 'Ali Yılmaz', pct: 94, color: 'bg-blue-500' },
          { name: 'Elif Demir', pct: 72, color: 'bg-emerald-500' },
          { name: 'Murat Can', pct: 51, color: 'bg-amber-500' },
        ].map((r, i) => (
          <div key={r.name} className="flex items-center gap-3">
            <p className="text-[11px] text-slate-300 w-20 truncate">{r.name}</p>
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <motion.div className={`h-full rounded-full ${r.color}`}
                initial={{ width: 0 }} animate={{ width: `${r.pct}%` }}
                transition={{ delay: i * 0.1 + 0.8, duration: 0.6, ease: 'easeOut' }} />
            </div>
            <p className="text-[11px] text-slate-400 w-7 text-right">{r.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Feature card ─── */
const features = [
  { icon: TrendingUp, title: 'Ciro Takibi', desc: 'Günlük satış girişi, aylık hedef ve anlık tempo analizi.', color: 'blue', glow: 'rgba(59,130,246,0.3)' },
  { icon: FileText, title: 'Borç Yönetimi', desc: 'Müşteri borçlarını vade yaşına göre renk kodlu takip edin.', color: 'violet', glow: 'rgba(139,92,246,0.3)' },
  { icon: Users, title: 'Ekip Yönetimi', desc: 'Temsilci ekle, müşteri ata, aylık hedef belirle.', color: 'emerald', glow: 'rgba(16,185,129,0.3)' },
  { icon: Target, title: 'Hedef Belirleme', desc: 'Her temsilci için ciro ve satış adedi hedefi koy.', color: 'orange', glow: 'rgba(249,115,22,0.3)' },
  { icon: BarChart2, title: 'Detaylı Raporlar', desc: 'Tarih aralıklı grafikler. Excel dışa aktarma.', color: 'blue', glow: 'rgba(59,130,246,0.3)' },
  { icon: Bell, title: 'Anlık Uyarılar', desc: 'Gecikmiş borç ve hedef gerisindeki temsilciler için alert.', color: 'red', glow: 'rgba(239,68,68,0.3)' },
]

const colorMap: Record<string, string> = {
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
}

/* ─── FAQ ─── */
const faqs = [
  { q: 'Planlar arasındaki fark nedir?', a: 'Başlangıç planı 5 temsilciye kadar destekler (100 ₺/ay). Profesyonel planda temsilci sınırı yok, gelişmiş raporlar ve öncelikli destek dahildir (300 ₺/ay). Ömür Boyu pakette sistemi kendi sunucunuza kuruyoruz, tek ödeme yapıyorsunuz ve aylık ücret ödemiyorsunuz.' },
  { q: 'Ömür Boyu paket nasıl çalışır?', a: 'Sistemi sizin kendi sunucunuza (VPS/dedicated server) kuruyoruz, kaynak kodunu teslim ediyoruz. Kurulum yaklaşık 3 iş günü sürer. Sonrasında aylık hiçbir ücret yoktur.' },
  { q: 'Ödeme nasıl yapılıyor?', a: 'Aylık planlar için IBAN ile banka transferi yapıp sistem üzerinden bildiriyorsunuz, 1 iş günü içinde onaylıyoruz. Ömür Boyu paket için iletişime geçin.' },
  { q: 'Mevcut müşteri verilerimi nasıl aktarırım?', a: 'Excel şablonunu indirin, verilerinizi girin ve tek seferde yükleyin. Müşteri, satış ve borç verileri toplu aktarılabilir.' },
  { q: 'Verilerim güvende mi?', a: 'Şifreli PostgreSQL veritabanı. Her firma kendi verisini görür, başka hiçbir firmaya erişim yoktur.' },
  { q: 'İptal edebilir miyim?', a: 'İstediğiniz zaman iptal edebilirsiniz. Sonraki dönemde ödeme alınmaz. Verilerinizi Excel olarak dışa aktarabilirsiniz.' },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showVideo, setShowVideo] = useState(false)

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">

      {/* ── Navbar ── */}
      <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SalesFoxIcon size={32} />
            <span className="font-bold text-lg tracking-tight">SalesFox</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#nasil-calisir" className="hover:text-white transition-colors">Nasıl çalışır?</a>
            <a href="#fiyatlandirma" className="hover:text-white transition-colors">Fiyatlandırma</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/giris" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Giriş Yap</Link>
            <Link href="/kayit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25">
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-3xl" />
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-3xl" />
          <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-3xl" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
          {/* Falling charts */}
          <FallingCharts />
        </div>

        <div className="relative max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-8">
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-blue-400 block" />
                7 gün ücretsiz · Kredi kartı gerekmez
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                Satış ekibinizi{' '}
                <span className="relative">
                  <span className="gradient-text">tek ekrandan</span>
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 origin-left" />
                </span>{' '}
                yönetin
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-slate-400 mb-8 leading-relaxed">
                Ciro takibi, borç yönetimi, hedef belirleme ve detaylı raporları tek platformda birleştirin.
                Saha satış ekipleriniz için sıfırdan tasarlandı.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-4 mb-10">
                <Link href="/kayit" className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-base transition-all hover:shadow-xl hover:shadow-blue-500/30">
                  Hemen Başla
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button onClick={() => setShowVideo(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-medium text-base transition-all">
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </span>
                  Demo izle
                </button>
              </motion.div>

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 text-sm text-slate-500">
                {['SSL Şifreli', 'Türk lirası', 'Anlık destek'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right — Dashboard preview */}
            <motion.div initial={{ opacity: 0, x: 40, rotateY: 10 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="hidden lg:block">
              <DashboardPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="py-14 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto px-6">
          <FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { val: 200, suffix: '+', label: 'Aktif Firma' },
                { val: 12000, suffix: '+', label: 'Satış Kaydı' },
                { val: 100, suffix: ' ₺', prefix: '', label: 'Aylık Ücret' },
                { val: 7, suffix: ' gün', label: 'Ücretsiz Deneme' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-extrabold text-white mb-1">
                    <Counter to={s.val} suffix={s.suffix} prefix={s.prefix ?? ''} />
                  </p>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6" id="ozellikler">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-blue-400 text-sm font-medium mb-3 uppercase tracking-widest">Özellikler</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Her şey bir arada</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Satış sürecinizin her adımını tek platformda yönetin</p>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color, glow }, i) => (
              <FadeUp key={title} delay={i * 0.07}>
                <motion.div whileHover={{ y: -4, boxShadow: `0 20px 40px ${glow}` }}
                  className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] cursor-default group h-full">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 transition-colors group-hover:border-opacity-50 ${colorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 bg-white/[0.01] border-y border-white/5" id="nasil-calisir">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-blue-400 text-sm font-medium mb-3 uppercase tracking-widest">Süreç</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">4 adımda hazır</h2>
          </FadeUp>

          <div className="space-y-6">
            {[
              { step: '01', title: 'Kayıt olun', desc: 'Telefon numaranızla 30 saniyede kayıt olun. 7 günlük ücretsiz deneme otomatik başlar.', icon: Zap },
              { step: '02', title: 'Ekibinizi ekleyin', desc: 'Satış temsilcilerinizi sisteme ekleyin, müşterileri atayın, aylık hedefleri belirleyin.', icon: Users },
              { step: '03', title: 'Takibi başlatın', desc: 'Temsilciler günlük cirolarını girer, siz dashboard\'dan anlık performansı görürsünüz.', icon: TrendingUp },
              { step: '04', title: 'Raporları alın', desc: 'Excel veya PDF formatında raporlar indirin, haftalık/aylık karşılaştırmalar yapın.', icon: BarChart2 },
            ].map(({ step, title, desc, icon: Icon }, i) => (
              <FadeUp key={step} delay={i * 0.1}>
                <motion.div whileHover={{ x: 4 }} className="flex gap-5 items-start group">
                  <div className="flex-shrink-0 relative">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    {i < 3 && <div className="absolute left-1/2 top-12 -translate-x-1/2 w-px h-6 bg-gradient-to-b from-blue-500/30 to-transparent" />}
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-mono text-blue-400/60 mb-1 block">{step}</span>
                    <h3 className="font-semibold text-lg mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-6" id="fiyatlandirma">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-blue-400 text-sm font-medium mb-3 uppercase tracking-widest">Fiyatlandırma</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">İhtiyacınıza uygun plan seçin</h2>
            <p className="text-slate-400">7 gün ücretsiz deneyin, sonra devam edin</p>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6 items-start">

            {/* Starter */}
            <FadeUp delay={0.05}>
              <motion.div whileHover={{ scale: 1.01 }}
                className="relative p-7 rounded-2xl border border-white/10 bg-white/[0.03]">
                <p className="text-sm font-semibold text-slate-300 mb-1">Başlangıç</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold tracking-tight">100</span>
                  <span className="text-xl text-slate-400 font-semibold">₺</span>
                  <span className="text-slate-500 text-sm">/ay</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">Bulut tabanlı · IBAN ile ödeme</p>
                <ul className="space-y-2.5 mb-7 text-sm">
                  {[
                    '5 satış temsilcisine kadar',
                    'Sınırsız müşteri kaydı',
                    'Ciro & borç takibi',
                    'Aylık hedef belirleme',
                    'Excel içe/dışa aktarma',
                    'E-posta destek',
                  ].map(f => <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />{f}</li>)}
                </ul>
                <Link href="/kayit" className="block w-full py-3 text-center rounded-xl border border-white/15 hover:bg-white/5 text-sm font-semibold transition-all">
                  7 Gün Ücretsiz Başla
                </Link>
              </motion.div>
            </FadeUp>

            {/* Pro — öne çıkan */}
            <FadeUp delay={0.1}>
              <motion.div whileHover={{ scale: 1.01 }}
                className="relative p-7 rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-500/10 to-blue-500/5">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-blue-600 text-xs font-bold tracking-wide shadow-lg shadow-blue-500/30 whitespace-nowrap">
                  EN POPÜLER
                </div>
                <p className="text-sm font-semibold text-blue-300 mb-1 pt-2">Profesyonel</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold tracking-tight">300</span>
                  <span className="text-xl text-slate-400 font-semibold">₺</span>
                  <span className="text-slate-500 text-sm">/ay</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">Bulut tabanlı · IBAN ile ödeme</p>
                <ul className="space-y-2.5 mb-7 text-sm">
                  {[
                    'Sınırsız satış temsilcisi',
                    'Sınırsız müşteri kaydı',
                    'Ciro & borç takibi',
                    'Aylık hedef belirleme',
                    'Excel içe/dışa aktarma',
                    'Gelişmiş raporlar & analizler',
                    'Öncelikli destek',
                    '7/24 teknik yardım',
                  ].map(f => <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />{f}</li>)}
                </ul>
                <Link href="/kayit" className="block w-full py-3 text-center rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30">
                  7 Gün Ücretsiz Başla
                </Link>
                <p className="text-center text-xs text-slate-500 mt-3">İptal istediğiniz zaman</p>
              </motion.div>
            </FadeUp>

            {/* Ömür Boyu */}
            <FadeUp delay={0.15}>
              <motion.div whileHover={{ scale: 1.01 }}
                className="relative p-7 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/8 to-transparent">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-amber-600 text-xs font-bold tracking-wide shadow-lg shadow-amber-500/30 whitespace-nowrap">
                  TEK SEFERLİK
                </div>
                <p className="text-sm font-semibold text-amber-300 mb-1 pt-2">Ömür Boyu</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold tracking-tight">20.000</span>
                  <span className="text-xl text-slate-400 font-semibold">₺</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">Tek ödeme · Aylık ücret yok</p>
                <p className="text-xs text-amber-400/80 font-medium mb-6">Kendi sunucunuza kurulur</p>
                <ul className="space-y-2.5 mb-7 text-sm">
                  {[
                    'Kendi sunucunuza kurulum',
                    'Sınırsız temsilci & müşteri',
                    'Tüm Pro özellikleri',
                    'Kaynak kodu teslimi',
                    'Kurulum & yapılandırma dahil',
                    'Ömür boyu güncelleme',
                    'Öncelikli destek hattı',
                  ].map(f => <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />{f}</li>)}
                </ul>
                <a href="mailto:dogus5455@gmail.com?subject=SalesFox%20Ömür%20Boyu%20Lisans"
                  className="block w-full py-3 text-center rounded-xl border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 text-sm font-semibold transition-all">
                  Teklif Al → İletişime Geç
                </a>
                <p className="text-center text-xs text-slate-500 mt-3">Kurulum süreci ~3 iş günü</p>
              </motion.div>
            </FadeUp>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Sık sorulan sorular</h2>
          </FadeUp>

          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <FadeUp key={q} delay={i * 0.05}>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <span className="font-medium text-sm sm:text-base">{q}</span>
                    <motion.span animate={{ rotate: openFaq === i ? 90 : 0 }} transition={{ duration: 0.2 }}
                      className="text-slate-400 flex-shrink-0 ml-4">
                      <ChevronRight className="w-4 h-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
                        <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6">
        <FadeUp>
          <div className="max-w-2xl mx-auto text-center">
            <motion.div whileHover={{ scale: 1.01 }}
              className="relative p-10 sm:p-14 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-transparent overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
              </div>
              <div className="relative">
                <Shield className="w-10 h-10 text-blue-400 mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Hemen başlayın</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  7 gün boyunca tüm özellikleri ücretsiz kullanın.<br />Kredi kartı gerekmez, kurulum yok.
                </p>
                <Link href="/kayit"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-lg transition-all hover:shadow-xl hover:shadow-blue-500/30">
                  Ücretsiz Hesap Oluştur
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <SalesFoxIcon size={22} />
            <span>SalesFox</span>
          </div>
          <p>© {new Date().getFullYear()} Tüm hakları saklıdır</p>
          <div className="flex gap-5">
            <Link href="/giris" className="hover:text-slate-300 transition-colors">Giriş Yap</Link>
            <Link href="/kayit" className="hover:text-slate-300 transition-colors">Kayıt Ol</Link>
          </div>
        </div>
      </footer>

      {/* ── Demo modal (placeholder) ── */}
      <AnimatePresence>
        {showVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowVideo(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
              <button onClick={() => setShowVideo(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Play className="w-6 h-6 text-blue-400 fill-blue-400" />
              </div>
              <h3 className="font-bold text-xl mb-2">Demo videosu yakında</h3>
              <p className="text-slate-400 mb-6">Sistemi hemen denemek için 7 günlük ücretsiz hesap oluşturun.</p>
              <Link href="/kayit" onClick={() => setShowVideo(false)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-all">
                Ücretsiz Başla <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
