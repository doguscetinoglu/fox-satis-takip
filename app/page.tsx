import Link from 'next/link'
import { TrendingUp, Users, Target, FileText, CheckCircle, ChevronRight, BarChart2, Bell, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Fox Satış Takip</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/giris" className="text-sm text-slate-400 hover:text-white transition-colors">Giriş Yap</Link>
            <Link href="/kayit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors">
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="orb orb-delay-2 absolute top-1/2 -right-48 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="orb orb-delay-4 absolute -bottom-32 left-1/3 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(rgba(0,113,227,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,113,227,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            7 gün ücretsiz deneme · Kredi kartı gerekmez
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Satış ekibinizi{' '}
            <span className="gradient-text">tek ekrandan</span>{' '}
            yönetin
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ciro takibi, borç yönetimi, hedef belirleme ve detaylı raporları tek bir platformda birleştirin. Saha satış ekipleriniz için tasarlandı.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kayit" className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
              Hemen Başla <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/giris" className="px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-semibold text-lg transition-all">
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" id="ozellikler">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Her şey bir arada</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Satış sürecinizin her adımını takip edin</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Ciro Takibi', desc: 'Günlük satış girişleri, aylık hedefler ve tempo analizi. Hedefe ne kadar kaldığını anlık görün.', color: 'blue' },
              { icon: FileText, title: 'Borç Yönetimi', desc: 'Müşteri borçlarını vade yaşına göre renk kodlu tablolarla takip edin. 90+ gün gecikmeleri anında fark edin.', color: 'violet' },
              { icon: Users, title: 'Ekip Yönetimi', desc: 'Satış temsilcilerinize müşteri atayın, aylık hedef belirleyin ve karşılaştırmalı performans raporları alın.', color: 'emerald' },
              { icon: Target, title: 'Hedef Belirleme', desc: 'Her temsilci için aylık ciro ve satış adedi hedefi koyun. İlerlemeyi yüzde çubuklarıyla izleyin.', color: 'orange' },
              { icon: BarChart2, title: 'Detaylı Raporlar', desc: 'Tarih aralıklı grafikler, Excel ve PDF dışa aktarma. Yönetim sunumlarınız için hazır formatlar.', color: 'blue' },
              { icon: Bell, title: 'Anlık Uyarılar', desc: 'Gecikmiş borçlar, kritik müşteriler ve hedef gerisinde kalan temsilciler için otomatik uyarılar.', color: 'red' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mb-4 group-hover:bg-${color}-500/20 transition-colors`}>
                  <Icon className={`w-6 h-6 text-${color}-400`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Nasıl çalışır?</h2>
          </div>
          <div className="space-y-8">
            {[
              { step: '01', title: 'Kayıt olun', desc: 'Telefon numaranızla 30 saniyede kayıt olun. 7 günlük ücretsiz denemeniz otomatik başlar.' },
              { step: '02', title: 'Ekibinizi ekleyin', desc: 'Satış temsilcilerinizi sisteme ekleyin, müşterileri atayın ve aylık hedeflerini belirleyin.' },
              { step: '03', title: 'Takibi başlatın', desc: 'Temsilciler günlük cirolarını girer, siz dashboard\'dan anlık performansı görürsünüz.' },
              { step: '04', title: 'Raporları alın', desc: 'Excel veya PDF formatında haftalık/aylık raporlarınızı indirin, hedef karşılaştırmaları yapın.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm">{step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" id="fiyatlandirma">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Sade fiyatlandırma</h2>
            <p className="text-slate-400">Tek plan, tüm özellikler</p>
          </div>
          <div className="p-8 rounded-2xl border border-blue-500/30 bg-blue-500/5 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-xs font-semibold">
              7 GÜN ÜCRETSİZ
            </div>
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">100</span>
                <span className="text-xl text-slate-400">₺</span>
              </div>
              <p className="text-slate-400 mt-1">aylık · sınırsız temsilci</p>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Sınırsız satış temsilcisi',
                'Sınırsız müşteri kaydı',
                'Günlük ciro takibi',
                'Borç yaşlandırma analizi',
                'Aylık hedef belirleme',
                'Excel & PDF raporlar',
                'Excel ile toplu veri yükleme',
                '7/24 destek',
              ].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/kayit" className="block w-full py-3 text-center rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-colors">
              7 Gün Ücretsiz Başla
            </Link>
            <p className="text-center text-xs text-slate-500 mt-4">
              Ödeme IBAN ile yapılır · İptal istediğiniz zaman
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Sık sorulan sorular</h2>
          <div className="space-y-4">
            {[
              { q: 'Ödeme nasıl yapılıyor?', a: 'IBAN ile banka transferi yapılır. Ödemenizi sistem üzerinden bildirirsiniz, biz onaylarız.' },
              { q: 'Kaç temsilci ekleyebilirim?', a: 'Sınır yok. 100 TL aylık ücretle istediğiniz kadar temsilci ekleyebilirsiniz.' },
              { q: 'Mevcut müşteri verilerimi nasıl aktarırım?', a: 'Excel şablonunu indirin, verilerinizi girin ve sisteme tek seferde yükleyin.' },
              { q: 'Verilerim güvende mi?', a: 'Verileriniz şifreli Neon PostgreSQL veritabanında saklanır. Her firma kendi verisini görür.' },
              { q: 'İptal edebilir miyim?', a: 'İstediğiniz zaman. Sonraki ödeme döneminde işlem yapılmaz.' },
            ].map(({ q, a }) => (
              <details key={q} className="group p-5 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer">
                <summary className="font-medium list-none flex items-center justify-between">
                  {q}
                  <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-slate-400 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-2xl border border-blue-500/20 bg-blue-500/5">
            <Shield className="w-12 h-12 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Hemen başlayın</h2>
            <p className="text-slate-400 mb-8">7 gün boyunca tüm özellikleri ücretsiz kullanın. Kredi kartı gerekmez.</p>
            <Link href="/kayit" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-500/25">
              Ücretsiz Hesap Oluştur <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Fox Satış Takip · Tüm hakları saklıdır
      </footer>
    </div>
  )
}
