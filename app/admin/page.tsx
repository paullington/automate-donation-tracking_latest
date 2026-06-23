import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { donations } from '@/lib/db/schema'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { AdminLogin } from '@/components/admin/admin-login'
import {
  AdminDashboard,
  type AdminDonation,
} from '@/components/admin/admin-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const authed = await isAdminAuthenticated()

  if (!authed) {
    return <AdminLogin />
  }

  let rows: AdminDonation[] = []
  try {
    const result = await db
      .select({
        id: donations.id,
        donorName: donations.donorName,
        donorEmail: donations.donorEmail,
        receiptFileName: donations.receiptFileName,
        receiptPathname: donations.receiptPathname,
        amount: donations.amount,
        notes: donations.notes,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .orderBy(desc(donations.createdAt))

    rows = result.map((d) => ({
      ...d,
      createdAt:
        d.createdAt instanceof Date
          ? d.createdAt.toISOString()
          : String(d.createdAt),
    }))
  } catch (error) {
    console.error('[v0] Admin donations query failed:', error)
  }

  return <AdminDashboard donations={rows} />
}
