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
