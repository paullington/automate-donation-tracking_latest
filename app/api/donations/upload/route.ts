import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { validateAndProcessDocument, updateDonationStatus } from '@/lib/document-processor'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('[v0] DATABASE_URL is not set')
      return NextResponse.json(
        { error: 'Server is not configured for storage. Please contact support.' },
        { status: 500 }
      )
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[v0] BLOB_READ_WRITE_TOKEN is not set')
      return NextResponse.json(
        { error: 'Server is not configured for file storage. Please contact support.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const donorName = formData.get('donorName') as string | null
    const donorEmail = formData.get('donorEmail') as string | null
    const amount = formData.get('amount') as string | null
    const notes = formData.get('notes') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (PDF, JPG, PNG only)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF, JPG, and PNG files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate filename with timestamp
    const timestamp = Date.now()
    const safeFileName = file.name
      .replace(/[^a-z0-9.-]/gi, '_')
      .toLowerCase()
      .slice(0, 50)
    const fileName = `receipts/${timestamp}-${safeFileName}`

    // Upload to Vercel Blob (private)
    const blob = await put(fileName, file, {
      access: 'private',
    })

    // Store metadata in database using raw SQL
    console.log('[v0] About to insert donation with:', {
      donorName,
      donorEmail,
      receiptFileName: file.name,
      receiptPathname: blob.pathname,
      amount,
      notes,
    })

    const client = await pool.connect()
    try {
      // Get file buffer for validation
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      // Validate and process document
      console.log('[v0] Validating document:', file.name)
      const validation = await validateAndProcessDocument(
        donorEmail && donorEmail.trim() ? donorEmail.trim() : undefined,
        donorName && donorName.trim() ? donorName.trim() : undefined,
        file.name,
        fileBuffer,
        amount && amount.trim() ? amount.trim() : undefined
      )

      const result = await client.query(
        `INSERT INTO public.donations 
          (donor_name, donor_email, receipt_file_name, receipt_pathname, amount, notes, 
           is_processed, is_duplicate, is_anonymous, duplicate_of_id, transaction_type, processing_notes) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *;`,
        [
          donorName && donorName.trim() ? donorName.trim() : null,
          donorEmail && donorEmail.trim() ? donorEmail.trim() : null,
          file.name,
          blob.pathname,
          amount && amount.trim() ? amount.trim() : null,
          notes && notes.trim() ? notes.trim() : null,
          false, // is_processed - will be set by admin
          validation.isDuplicate,
          validation.isAnonymous, // is_anonymous - true if no name provided
          validation.duplicateOfId || null,
          validation.isTransaction ? 'transaction' : 'not_transaction',
          validation.notes,
        ]
      )

      const donationRecord = result.rows[0]
      console.log('[v0] Donation inserted successfully:', {
        id: donationRecord.id,
        validation: {
          isTransaction: validation.isTransaction,
          isDuplicate: validation.isDuplicate,
          confidence: validation.confidence,
        },
      })

      return NextResponse.json({
        success: true,
        donation: donationRecord,
        validation,
        message: validation.isDuplicate
          ? `Receipt uploaded successfully. Duplicate of donation #${validation.duplicateOfId} detected.`
          : validation.isTransaction
            ? 'Receipt uploaded successfully and validated as transaction.'
            : 'Receipt uploaded. Note: This may not be a transaction document.',
      })
    } finally {
      client.release()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Upload error:', message, error)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.', detail: message },
      { status: 500 }
    )
  }
}
