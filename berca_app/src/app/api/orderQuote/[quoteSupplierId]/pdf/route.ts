import {NextResponse} from 'next/server'
import {getQuoteSupplierById} from '@/dal/quoteSuppliers'
import {mapQuoteSupplierDetail} from '@/extra/quoteSuppliers'

interface RouteContext {
  params: Promise<{quoteSupplierId: string}>
}

const pageWidth = 595
const pageHeight = 842
const margin = 42
const lineHeight = 14
const maxChars = 96

function sanitizePdfText(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function fileSafeName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'supplier-quote'
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value))
}

function formatEur(value: number | null) {
  if (value == null) return '-'
  return new Intl.NumberFormat('nl-BE', {style: 'currency', currency: 'EUR'}).format(value)
}

function wrapLine(line: string) {
  if (line.length <= maxChars) return [line]
  const words = line.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars) {
      if (current) lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines
}

function paginate(lines: string[]) {
  const pages: string[][] = [[]]
  let y = pageHeight - margin

  for (const line of lines.flatMap(item => (item ? wrapLine(item) : ['']))) {
    if (y < margin + 28) {
      pages.push([])
      y = pageHeight - margin
    }
    pages[pages.length - 1].push(line)
    y -= lineHeight
  }

  return pages
}

function buildPdf(lines: string[]) {
  const pages = paginate(lines)
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '',
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]
  const pageNumbers: number[] = []
  let nextObjectNumber = 4

  for (const [pageIndex, pageLines] of pages.entries()) {
    const pageObjectNumber = nextObjectNumber++
    const contentObjectNumber = nextObjectNumber++
    pageNumbers.push(pageObjectNumber)
    let y = pageHeight - margin
    const commands = ['BT']

    for (const [lineIndex, line] of pageLines.entries()) {
      const isTitle = pageIndex === 0 && lineIndex === 0
      const isSection = line.trim() && line === line.toUpperCase()
      commands.push(`/F1 ${isTitle ? 18 : isSection ? 12 : 10} Tf`)
      commands.push(`1 0 0 1 ${margin} ${y} Tm`)
      commands.push(`(${sanitizePdfText(line)}) Tj`)
      y -= lineHeight
    }

    commands.push('ET')
    commands.push('BT', '/F1 9 Tf', `1 0 0 1 ${pageWidth - margin - 48} 24 Tm`, `(Page ${pageIndex + 1}) Tj`, 'ET')
    const stream = commands.join('\n')
    objects.push(
      `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>\nendobj\n`,
    )
    objects.push(
      `${contentObjectNumber} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'binary')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    )
  }

  objects[1] = `2 0 obj\n<< /Type /Pages /Count ${pageNumbers.length} /Kids [${pageNumbers
    .map(number => `${number} 0 R`)
    .join(' ')}] >>\nendobj\n`

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'binary'))
    pdf += object
  }
  const xrefOffset = Buffer.byteLength(pdf, 'binary')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets
    .slice(1)
    .map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'binary')
}

function quoteLines(quote: ReturnType<typeof mapQuoteSupplierDetail>) {
  const deliverableLines = quote.lines.filter(line => !line.notDeliverable)
  const materialTotal = deliverableLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  const miscTotal = quote.miscLines.reduce((sum, line) => sum + line.unitPrice, 0)

  const lines = [
    `Supplier Quote ${quote.quoteNumber}`,
    `Generated: ${formatDate(new Date().toISOString())}`,
    '',
    'SUMMARY',
    `Supplier: ${quote.companyName}`,
    `Supplier reference: ${quote.quotationNumber ?? '-'}`,
    `Description: ${quote.description ?? '-'}`,
    `Valid until: ${formatDate(quote.validUntil)}`,
    `Delivery time: ${quote.deliveryTimeDays != null ? `${quote.deliveryTimeDays} days` : '-'}`,
    `Payment condition: ${quote.paymentConditionName ?? '-'}`,
    `Status: ${quote.acceptedForPOB ? 'Approved' : quote.rejected ? 'Rejected' : quote.received ? 'Received' : quote.sent ? 'Sent' : 'Pending'}`,
    '',
    'MATERIAL LINES',
  ]

  for (const line of quote.lines) {
    const material = [line.materialBeNumber, line.materialShortDescription ?? line.materialName]
      .filter(Boolean)
      .join(' | ')
    lines.push(
      [
        material || line.materialId,
        line.supplierDescription ? `Supplier desc: ${line.supplierDescription}` : '',
        line.materialDemandLabel ? `Demand: ${line.materialDemandLabel}` : '',
        line.notDeliverable ? 'Not deliverable' : '',
        `Qty ${line.quantity}`,
        line.minQuantity != null ? `Min ${line.minQuantity}` : '',
        `Unit ${formatEur(line.unitPrice)}`,
        `Total ${line.notDeliverable ? '-' : formatEur(line.quantity * line.unitPrice)}`,
        line.selected ? 'Selected' : '',
      ]
        .filter(Boolean)
        .join(' | '),
    )
  }

  if (!quote.lines.length) lines.push('No material lines.')

  lines.push('', 'MISC COSTS')
  for (const line of quote.miscLines) lines.push(`${line.description} | ${formatEur(line.unitPrice)}`)
  if (!quote.miscLines.length) lines.push('No misc costs.')

  lines.push('', 'TOTALS', `Material subtotal: ${formatEur(materialTotal)}`)
  lines.push(`Misc costs: ${formatEur(miscTotal)}`, `Grand total: ${formatEur(materialTotal + miscTotal)}`)

  if (quote.additionalInfo) lines.push('', 'ADDITIONAL INFO', quote.additionalInfo)
  return lines
}

export async function GET(_request: Request, {params}: RouteContext) {
  const {quoteSupplierId} = await params
  const raw = await getQuoteSupplierById(quoteSupplierId).catch(() => null)
  if (!raw) return NextResponse.json({error: 'Supplier quote not found.'}, {status: 404})

  const quote = mapQuoteSupplierDetail(raw)
  const pdf = buildPdf(quoteLines(quote))

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Quote_${fileSafeName(quote.quoteNumber)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
