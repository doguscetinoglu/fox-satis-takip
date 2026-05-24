import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seed başlıyor...')

  // Demo tenant
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const tenant = await prisma.tenant.upsert({
    where: { phone: '05551234567' },
    update: {},
    create: {
      companyName: 'Demo Şirketi A.Ş.',
      ownerName: 'Ahmet Yılmaz',
      phone: '05551234567',
      passwordHash: await bcrypt.hash('demo1234', 12),
      planStatus: 'TRIAL',
      trialEndsAt,
    },
  })
  console.log('Tenant oluşturuldu:', tenant.companyName)

  // Demo sales reps
  const rep1 = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '05551111111' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: '05551111111',
      passwordHash: await bcrypt.hash('rep1234', 12),
      name: 'Mehmet Kaya',
      role: 'SALES_REP',
    },
  })

  const rep2 = await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '05552222222' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: '05552222222',
      passwordHash: await bcrypt.hash('rep1234', 12),
      name: 'Fatma Demir',
      role: 'SALES_REP',
    },
  })
  console.log('Temsilciler oluşturuldu')

  // Demo customers
  const customers = [
    { code: 'MUS001', name: 'Ege Tekstil Ltd.', phone: '02321234567', city: 'İzmir', repId: rep1.id },
    { code: 'MUS002', name: 'Anadolu Market', phone: '03121234567', city: 'Ankara', repId: rep1.id },
    { code: 'MUS003', name: 'İstanbul Gıda A.Ş.', phone: '02121234567', city: 'İstanbul', repId: rep2.id },
    { code: 'MUS004', name: 'Marmara Yapı', phone: '02161234567', city: 'İstanbul', repId: rep2.id },
    { code: 'MUS005', name: 'Akdeniz Tarım', phone: '02421234567', city: 'Antalya', repId: rep1.id },
  ]

  const createdCustomers = []
  for (const c of customers) {
    const customer = await prisma.customer.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: c.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: c.code,
        name: c.name,
        phone: c.phone,
        city: c.city,
        assignedRepId: c.repId,
      },
    })
    createdCustomers.push(customer)
  }
  console.log('Müşteriler oluşturuldu')

  // Demo debts
  const now = new Date()
  const debts = [
    { customerId: createdCustomers[0].id, amount: 15000, daysOverdue: 45, status: 'OVERDUE' as const },
    { customerId: createdCustomers[0].id, amount: 8500, daysOverdue: 10, status: 'PENDING' as const },
    { customerId: createdCustomers[1].id, amount: 22000, daysOverdue: 95, status: 'OVERDUE' as const },
    { customerId: createdCustomers[2].id, amount: 5000, daysOverdue: 5, status: 'PENDING' as const },
    { customerId: createdCustomers[3].id, amount: 12000, daysOverdue: 65, status: 'OVERDUE' as const },
    { customerId: createdCustomers[4].id, amount: 3500, daysOverdue: 0, status: 'PENDING' as const },
  ]

  for (const d of debts) {
    const dueDate = new Date(now.getTime() - d.daysOverdue * 24 * 60 * 60 * 1000)
    const docDate = new Date(dueDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    await prisma.debt.create({
      data: {
        tenantId: tenant.id,
        customerId: d.customerId,
        amount: d.amount,
        dueDate,
        documentDate: docDate,
        status: d.status,
        documentNo: `FAT-${Math.floor(Math.random() * 9000) + 1000}`,
      },
    })
  }
  console.log('Borçlar oluşturuldu')

  // Demo sales entries (last 30 days)
  const reps = [rep1, rep2]
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    date.setHours(0, 0, 0, 0)
    for (const rep of reps) {
      if (Math.random() > 0.3) {
        await prisma.salesEntry.create({
          data: {
            tenantId: tenant.id,
            userId: rep.id,
            date,
            amount: Math.floor(Math.random() * 8000) + 2000,
            salesCount: Math.floor(Math.random() * 5) + 1,
          },
        })
      }
    }
  }
  console.log('Satış girişleri oluşturuldu')

  // Demo sales targets (current month)
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  await prisma.salesTarget.upsert({
    where: { tenantId_userId_monthKey: { tenantId: tenant.id, userId: rep1.id, monthKey } },
    update: {},
    create: { tenantId: tenant.id, userId: rep1.id, monthKey, revenueTarget: 150000, salesCountTarget: 50 },
  })
  await prisma.salesTarget.upsert({
    where: { tenantId_userId_monthKey: { tenantId: tenant.id, userId: rep2.id, monthKey } },
    update: {},
    create: { tenantId: tenant.id, userId: rep2.id, monthKey, revenueTarget: 120000, salesCountTarget: 40 },
  })
  console.log('Hedefler oluşturuldu')

  console.log('\n=== Demo Hesapları ===')
  console.log('Admin : 05551234567 / demo1234')
  console.log('Rep 1 : 05551111111 / rep1234')
  console.log('Rep 2 : 05552222222 / rep1234')
  console.log('Seed tamamlandı.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
