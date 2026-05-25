'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Phone, Lock, User, Building2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { SalesFoxIcon } from '@/components/ui/SalesFoxIcon'

export default function KayitPage() {
  const router = useRouter()
  const [form, setForm] = useState({ ownerName: '', companyName: '', phone: '', password: '', confirm: '' })
  const [goster, setGoster] = useState(false)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    if (form.password !== form.confirm) { setHata('Şifreler eşleşmiyor'); return }
    if (form.password.length < 6) { setHata('Şifre en az 6 karakter olmalı'); return }
    setYukleniyor(true)
    try {
      const res = await fetch('/api/auth/kayit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerName: form.ownerName, companyName: form.companyName, phone: form.phone, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setHata(data.hata ?? 'Kayıt başarısız'); return }
      router.push('/admin/abonelik')
      router.refresh()
    } catch {
      setHata('Sunucu hatası, tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  const fields = [
    { key: 'ownerName', label: 'Ad Soyad', icon: User, placeholder: 'Ahmet Yılmaz', type: 'text' },
    { key: 'companyName', label: 'Şirket Adı', icon: Building2, placeholder: 'Yılmaz Ticaret A.Ş.', type: 'text' },
    { key: 'phone', label: 'Telefon Numarası', icon: Phone, placeholder: '05XX XXX XXXX', type: 'tel' },
  ]

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020617] py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="orb orb-delay-2 absolute bottom-0 -left-48 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4">
              <SalesFoxIcon size={64} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Hesap Oluşturun</h1>
            <p className="text-sm text-slate-400">7 gün ücretsiz · Kredi kartı gerekmez</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, icon: Icon, placeholder, type }, i) => (
              <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={set(key)}
                    required
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </motion.div>
            ))}

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={goster ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  required
                  placeholder="En az 6 karakter"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button type="button" onClick={() => setGoster(!goster)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </motion.div>

            {hata && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {hata}
              </motion.p>
            )}

            <button
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
                  Hesap oluşturuluyor...
                </span>
              ) : 'Ücretsiz Başla →'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600">
            Zaten hesabınız var mı?{' '}
            <Link href="/giris" className="text-blue-400 hover:text-blue-300 transition-colors">Giriş yapın</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
