/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx'

// ─── TEMPLATE GENERATORS ───────────────────────────────────

export function generateCustomerTemplate(): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Müşteri Kodu*', 'Müşteri Adı*', 'Telefon', 'E-posta', 'Şehir', 'Temsilci Telefonu'],
    ['MUS001', 'Örnek Firma A.Ş.', '05321234567', 'info@ornekfirma.com', 'İstanbul', '05551111111'],
  ])
  ws['!cols'] = [14, 30, 15, 25, 15, 15].map(wch => ({ wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Müşteriler')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

export function generateDebtTemplate(): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Müşteri Kodu*', 'Belge No', 'Tutar*', 'Belge Tarihi* (GG.AA.YYYY)', 'Vade Tarihi* (GG.AA.YYYY)', 'Açıklama'],
    ['MUS001', 'FAT-001', '15000', '01.01.2025', '01.02.2025', 'Ocak faturası'],
  ])
  ws['!cols'] = [14, 12, 12, 24, 24, 30].map(wch => ({ wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Borçlar')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

// ─── XLSX PARSER ───────────────────────────────────────────

export type ParsedCustomerRow = {
  code: string
  name: string
  phone?: string
  email?: string
  city?: string
  repPhone?: string
}

export type ParseError = {
  row: number
  field: string
  message: string
}

export function parseCustomerSheet(buffer: Buffer): {
  rows: ParsedCustomerRow[]
  errors: ParseError[]
} {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const dataRows = raw.slice(1)
  const rows: ParsedCustomerRow[] = []
  const errors: ParseError[] = []

  dataRows.forEach((row: any[], i) => {
    const rowNum = i + 2
    const code = String(row[0] ?? '').trim()
    const name = String(row[1] ?? '').trim()

    if (!code) {
      errors.push({ row: rowNum, field: 'Müşteri Kodu', message: 'Zorunlu alan boş' })
      return
    }
    if (!name) {
      errors.push({ row: rowNum, field: 'Müşteri Adı', message: 'Zorunlu alan boş' })
      return
    }

    rows.push({
      code,
      name,
      phone: String(row[2] ?? '').trim() || undefined,
      email: String(row[3] ?? '').trim() || undefined,
      city: String(row[4] ?? '').trim() || undefined,
      repPhone: String(row[5] ?? '').trim() || undefined,
    })
  })

  return { rows, errors }
}

// ─── SALES TEMPLATE + PARSER ───────────────────────────────

export function generateSalesTemplate(): Buffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ['Temsilci Telefonu*', 'Müşteri Kodu', 'Tutar*', 'Adet', 'Tarih* (GG.AA.YYYY)', 'Açıklama'],
    ['05551111111', 'MUS001', 5000, 10, '25.05.2026', 'Mayıs satışı'],
  ])
  // Telefon ve Tarih sütunlarını metin olarak işaretle — Excel'in 0 silmesi / otomatik dönüşümü engellemek için
  const textCells = ['A1', 'A2', 'E1', 'E2']
  textCells.forEach(addr => { if (ws[addr]) ws[addr].z = '@' })
  ws['!cols'] = [20, 14, 12, 8, 22, 30].map(wch => ({ wch }))
  XLSX.utils.book_append_sheet(wb, ws, 'Satışlar')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

export type ParsedSalesRow = {
  repPhone: string
  customerCode?: string
  amount: number
  salesCount: number
  date: Date
  description?: string
}

function parseTurkishDate(raw: unknown): Date | null {
  // Excel cellDates:true → Date object
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw

  const s = String(raw ?? '').trim()

  // GG.AA.YYYY
  const m1 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m1) return new Date(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1]))

  // YYYY-MM-DD
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m2) return new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]))

  // Excel serial number (days since 1899-12-30)
  const n = Number(s)
  if (!isNaN(n) && n > 40000 && n < 110000) {
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000)
    return isNaN(d.getTime()) ? null : d
  }

  return null
}

export function parseSalesSheet(buffer: Buffer): {
  rows: ParsedSalesRow[]
  errors: ParseError[]
} {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const dataRows = raw.slice(1)
  const rows: ParsedSalesRow[] = []
  const errors: ParseError[] = []

  dataRows.forEach((row: any[], i) => {
    const rowNum = i + 2

    // Boş satır kontrolü
    if (!row[0] && !row[2]) return

    // Telefon: Excel baştaki 0'ı sayıya dönüştürüp silebilir, düzelt
    let repPhone = String(row[0] ?? '').replace(/[\s\-\(\)]/g, '').trim()
    if (/^\d{10}$/.test(repPhone) && !repPhone.startsWith('0')) {
      repPhone = '0' + repPhone  // 10 hane ise başına 0 ekle (Excel'in sildiği 0)
    }

    const amount = Number(String(row[2] ?? '').replace(',', '.').replace(/[^\d.]/g, ''))
    const rawDate = row[4]

    if (!repPhone) { errors.push({ row: rowNum, field: 'Temsilci Telefonu', message: 'Zorunlu alan boş' }); return }
    if (isNaN(amount) || amount <= 0) { errors.push({ row: rowNum, field: 'Tutar', message: 'Geçersiz tutar' }); return }

    const date = parseTurkishDate(rawDate)
    if (!date) { errors.push({ row: rowNum, field: 'Tarih', message: 'GG.AA.YYYY formatında girin (örn: 25.05.2026)' }); return }

    rows.push({
      repPhone,
      customerCode: String(row[1] ?? '').trim() || undefined,
      amount,
      salesCount: parseInt(String(row[3] ?? '1')) || 1,
      date,
      description: String(row[5] ?? '').trim() || undefined,
    })
  })

  return { rows, errors }
}

// ─── REPORT EXPORT ─────────────────────────────────────────

export function exportSalesReport(data: {
  title: string
  period: string
  entries: { date: string; repName: string; customerName?: string; amount: number; salesCount: number }[]
}): Buffer {
  const rows = [
    [`${data.title} — ${data.period}`],
    [],
    ['Tarih', 'Temsilci', 'Müşteri', 'Tutar (₺)', 'Adet'],
    ...data.entries.map(e => [
      e.date,
      e.repName,
      e.customerName ?? '-',
      e.amount,
      e.salesCount,
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [12, 20, 25, 14, 8].map(wch => ({ wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Rapor')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}
