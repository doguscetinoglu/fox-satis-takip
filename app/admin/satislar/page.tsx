import { SatislarPanel } from '@/components/admin/SatislarPanel'

export default function SatislarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Satışlar</h1>
        <p className="text-muted-foreground text-sm mt-1">Tüm satış girişleri — manuel ekle veya Excel ile aktar</p>
      </div>
      <SatislarPanel />
    </div>
  )
}
