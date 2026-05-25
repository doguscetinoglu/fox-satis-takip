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
  const ws = XLSX.utils.aoa_to_sheet([
    ['Temsilci Telefonu*', 'Müşteri Kodu', 'Tutar*', 'Adet', 'Tarih* (GG.AA.YYYY)', 'Açıklama'],
    ['05551111111', 'MUS001', '5000', '10', '01.05.2025', 'Mayıs satışı'],
  ])
  ws['!cols'] = [18, 14, 12, 8, 22, 30].map(wch => ({ wch }))
  const wb = XLSX.utils.book_new()
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

function parseTurkishDate(raw: string): Date | null {
  const s = String(raw ?? '').trim()
  // GG.AA.YYYY
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
  // Also accept Excel serial numbers
  const n = Number(s)
  if (!isNaN(n) && n > 40000) return XLSX.SSF.parse_date_code(n) ? new Date(XLSX.SSF.format('yyyy-mm-dd', n)) : null
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
    const repPhone = String(row[0] ?? '').trim()
    const amount = Number(String(row[2] ?? '').replace(',', '.'))
    const rawDate = row[4]

    if (!repPhone) { errors.push({ row: rowNum, field: 'Temsilci Telefonu', message: 'Zorunlu alan boş' }); return }
    if (isNaN(amount) || amount <= 0) { errors.push({ row: rowNum, field: 'Tutar', message: 'Geçersiz tutar' }); return }

    let date: Date
    if (rawDate instanceof Date) {
      date = rawDate
    } else {
      const parsed = parseTurkishDate(String(rawDate))
      if (!parsed) { errors.push({ row: rowNum, field: 'Tarih', message: 'GG.AA.YYYY formatında girin' }); return }
      date = parsed
    }

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
