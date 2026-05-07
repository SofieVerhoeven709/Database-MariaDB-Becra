import {NextResponse} from 'next/server'
import {getBoqById} from '@/dal/billOfQuantities'
import {getMaterialPricesForBeNumbers} from '@/dal/invoices'
import {mapBoq} from '../../../../../mapper/billOfQuantities'

interface RouteContext {
  params: Promise<{billOfQuantityId: string}>
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
  return value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'bill-of-quantity'
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
    } else current = next
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

function boqLines(boq: ReturnType<typeof mapBoq>) {
  const lines = [
    `Bill of Quantity ${boq.boqNumber}`,
    `Generated: ${formatDate(new Date().toISOString())}`,
    '',
    'SUMMARY',
    `Client reference: ${boq.clientReference ?? '-'}`,
    `PO number: ${boq.poNumber ?? '-'}`,
    `BoQ date: ${formatDate(boq.boqDate)}`,
    `Due date: ${formatDate(boq.dueDate)}`,
    `Status: ${boq.boqStatusName}`,
    `Payment method: ${boq.paymentMethodName}`,
    `Price list: ${boq.priceListName ?? '-'}`,
    '',
    'BILLING LINES',
  ]

  for (const workOrder of boq.workOrders) {
    lines.push('')
    lines.push(
      `${workOrder.workOrderNumber ?? '(no number)'} - ${workOrder.description ?? '-'} | ${workOrder.projectNumber} | ${workOrder.companyName}`,
    )
    for (const line of workOrder.billingLines) {
      lines.push(
        [
          line.type,
          line.beNumber ?? '',
          line.sourceLabel,
          `Qty ${line.quantity} ${line.unit}`,
          `Unit ${formatEur(line.unitPriceFinal)}`,
          `Ex VAT ${formatEur(line.lineTotalFinal)}`,
          `VAT ${line.vatRate ?? 0}% ${formatEur(line.lineVatAmount)}`,
          `Incl ${formatEur(line.lineTotalInclVat)}`,
        ]
          .filter(Boolean)
          .join(' | '),
      )
    }
  }

  lines.push('', 'TOTALS', `Subtotal (ex VAT): ${formatEur(boq.subtotalExVat)}`)
  for (const vat of boq.vatByRate) lines.push(`VAT ${vat.rate}%: ${formatEur(vat.amount)}`)
  lines.push(`Total VAT: ${formatEur(boq.totalVat)}`, `Total (incl VAT): ${formatEur(boq.totalInclVat)}`)
  return lines
}

export async function GET(_request: Request, {params}: RouteContext) {
  const {billOfQuantityId} = await params
  const raw = await getBoqById(billOfQuantityId).catch(() => null)
  if (!raw) return NextResponse.json({error: 'Bill of quantity not found.'}, {status: 404})

  const beNumbers = [
    ...new Set(
      raw.WorkOrderBoQ.flatMap(wb =>
        (wb.WorkOrder?.WorkOrderStructure ?? [])
          .map(wos => wos.Material?.beNumber)
          .filter((beNumber): beNumber is string => Boolean(beNumber)),
      ),
    ),
  ]
  const materialPriceMap = await getMaterialPricesForBeNumbers(beNumbers)
  const boq = mapBoq(raw as any, materialPriceMap)
  const pdf = buildPdf(boqLines(boq))

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="BoQ_${fileSafeName(boq.boqNumber)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
