'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, TrendingUp, Lock, Phone } from 'lucide-react'
import Link from 'next/link'

export default function GirisPage() {
  const router = useRouter()
  const [telefon, setTelefon] = useState('')
  const [sifre, setSifre] = useState('')
  const [goster, setGoster] = useState(false)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)
    try {
      const res = await fetch('/api/auth/giris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefon, sifre }),
      })
      const data = await res.json()
      if (!res.ok) { setHata(data.hata ?? 'Giriş başarısız'); return }
      if (data.rol === 'TENANT_ADMIN') router.push('/admin')
      else if (data.rol === 'SALES_REP') router.push('/temsilci')
      else router.push('/platform')
      router.refresh()
    } catch {
      setHata('Sunucu hatası, tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020617]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="orb orb-delay-2 absolute top-1/2 -right-48 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="orb orb-delay-4 absolute -bottom-32 left-1/3 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(0,113,227,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,113,227,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow-lg glow-blue"
            >
              <TrendingUp className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1">Fox Satış Takip</h1>
            <p className="text-sm text-slate-400">Saha satış yönetim sistemi</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefon Numarası</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={telefon}
                  onChange={e => setTelefon(e.target.value)}
                  required
                  placeholder="05XX XXX XXXX"
                  inputMode="numeric"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={goster ? 'text' : 'password'}
                  value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button type="button" onClick={() => setGoster(!goster)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {hata && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {hata}
              </motion.p>
            )}

            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              type="submit"
              disabled={yukleniyor}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 mt-2"
            >
              {yukleniyor ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : 'Giriş Yap'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600">
            Hesabınız yok mu?{' '}
            <Link href="/kayit" className="text-blue-400 hover:text-blue-300 transition-colors">Ücretsiz başlayın</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
