import {NextResponse} from 'next/server'
import {readFile} from 'node:fs/promises'
import {join, normalize} from 'node:path'
import {deflateSync, inflateSync} from 'node:zlib'
import {getHrHseFileRows} from '@/dal/hrHseFile'
import type {HrHseFileRow} from '@/types/hrHseFile'

interface RouteContext {
  params: Promise<{employeeId: string}>
}

const pageWidth = 595
const pageHeight = 842
const margin = 48
const lineHeight = 14
const maxChars = 88
const photoWidth = 92
const photoHeight = 112
const logoWidth = 140
const logoHeight = 52
const headerGap = 64
const footerHeight = 62

const hseIntroduction =
  'The Becra Safety Pass FH_HSE003 is a document in which all the important information are registrated, relating to occupational health and safety of the employee. This form is used on a Becra jobsite to give an overview of personal qualifications and preventive health care and fitness of the employee. It gives an overview of all stated documents in the Becra HSE file. \n' +
  'This logbook remains the inalienable property of the employee and is part of the Becra HSE binder on the jobsite for each Becra employee available for necessary review onsite. Upon request of a customer supervisor or customer HSE manager, the related safety pass can be looked into per employee. The data in this file contains all necessary information of the employee and is subject of the GDPR legislation, therefore the information in this file may only be distributed after a written permission of Becra and the employee itself. \n' +
  'Customer supervisors can check important information at a glance, so that hazards are recognized in time and appropriate countermeasures can be taken.\n' +
  '\nENTRIES\n' +
  'Operational learning instructions, trainings, educations, toolboxes, etc. shall be entered in this document. \n' +
  'Entries for courses made by the training institute with certificates are listed up as annex for this document.\n' +
  'Entries for job related instructions, LRMA, safety toolboxes, etc… are not always part of this document and can be found in the Becra job related HSE binder on the job-site.\n' +
  'The employer, together with the Becra HSE department, are responsible for the correctness of the entries in this personal safety logbook.\n'

const trainingAbbreviationDefinitions = [
  {
    abbreviation: 'AREI',
    meaning:
      '[Algemeen Regelement Elektrische Installaties] General regulations on electrical installations = Belgian electrical legislation',
  },
  {
    abbreviation: 'BA4',
    meaning: 'Education electrical safety according AREI - Warned Person',
  },
  {
    abbreviation: 'BA5',
    meaning: 'Education electrical safety according AREI - Authorized Person',
  },
  {
    abbreviation: 'LMRA',
    meaning: 'Last Minute Risk Analysis',
  },
  {
    abbreviation: 'ICE',
    meaning: 'In Case of Emergency',
  },
]

interface PdfImage {
  data: Buffer
  width: number
  height: number
  colorSpace: '/DeviceRGB' | '/DeviceGray'
  bitsPerComponent: 8
  filter: '/DCTDecode' | '/FlateDecode'
  smask?: {
    data: Buffer
    width: number
    height: number
  }
}

interface PdfImageResource {
  name: string
  image: PdfImage
  objectNumber: number
  smaskObjectNumber: number | null
}

function sanitizePdfText(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function fileSafeName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'employee'
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).format(new Date(value))
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

function addSection(lines: string[], title: string, content: string[]) {
  lines.push('')
  lines.push(title.toUpperCase())
  lines.push(...content)
}

function wrapLines(lines: string[]) {
  return lines.flatMap(line => (line ? wrapLine(line) : ['']))
}

function getTrainingAbbreviations(row: HrHseFileRow) {
  if (!row.includeTrainingData) return []

  const trainingText = row.trainings
    .map(training =>
      [training.documentNumber, training.name, training.type, training.providerName].filter(Boolean).join(' '),
    )
    .join(' ')

  return trainingAbbreviationDefinitions.filter(({abbreviation}) =>
    new RegExp(`\\b${abbreviation}\\b`, 'i').test(trainingText),
  )
}

function readUInt32(buffer: Buffer, offset: number) {
  return buffer.readUInt32BE(offset)
}

function parseJpegImage(buffer: Buffer): PdfImage | null {
  let offset = 2

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null

    const marker = buffer[offset + 1]
    if (marker === 0xff) {
      offset += 1
      continue
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }

    const length = buffer.readUInt16BE(offset + 2)

    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        data: buffer,
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
        colorSpace: '/DeviceRGB',
        bitsPerComponent: 8,
        filter: '/DCTDecode',
      }
    }

    offset += 2 + length
  }

  return null
}

function paethPredictor(left: number, above: number, upperLeft: number) {
  const estimate = left + above - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const aboveDistance = Math.abs(estimate - above)
  const upperLeftDistance = Math.abs(estimate - upperLeft)

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left
  if (aboveDistance <= upperLeftDistance) return above
  return upperLeft
}

function unfilterPngScanlines(data: Buffer, width: number, height: number, bytesPerPixel: number) {
  const stride = width * bytesPerPixel
  const output = Buffer.alloc(stride * height)
  let inputOffset = 0

  for (let row = 0; row < height; row += 1) {
    const filter = data[inputOffset]
    inputOffset += 1
    const rowOffset = row * stride
    const previousRowOffset = rowOffset - stride

    for (let column = 0; column < stride; column += 1) {
      const raw = data[inputOffset + column]
      const left = column >= bytesPerPixel ? output[rowOffset + column - bytesPerPixel] : 0
      const above = row > 0 ? output[previousRowOffset + column] : 0
      const upperLeft = row > 0 && column >= bytesPerPixel ? output[previousRowOffset + column - bytesPerPixel] : 0

      const value =
        filter === 0
          ? raw
          : filter === 1
            ? raw + left
            : filter === 2
              ? raw + above
              : filter === 3
                ? raw + Math.floor((left + above) / 2)
                : raw + paethPredictor(left, above, upperLeft)

      output[rowOffset + column] = value & 0xff
    }

    inputOffset += stride
  }

  return output
}

function addUnfilteredRows(data: Buffer, rowSize: number, height: number) {
  const output = Buffer.alloc((rowSize + 1) * height)

  for (let row = 0; row < height; row += 1) {
    data.copy(output, row * (rowSize + 1) + 1, row * rowSize, row * rowSize + rowSize)
  }

  return output
}

function parsePngImage(buffer: Buffer): PdfImage | null {
  if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return null

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  const idatChunks: Buffer[] = []

  while (offset < buffer.length) {
    const length = readUInt32(buffer, offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const chunk = buffer.subarray(offset + 8, offset + 8 + length)

    if (type === 'IHDR') {
      width = readUInt32(chunk, 0)
      height = readUInt32(chunk, 4)
      bitDepth = chunk[8]
      colorType = chunk[9]
      interlace = chunk[12]
    }

    if (type === 'IDAT') idatChunks.push(chunk)
    if (type === 'IEND') break
    offset += length + 12
  }

  if (!width || !height || bitDepth !== 8 || interlace !== 0) return null

  const compressed = Buffer.concat(idatChunks)

  if (colorType === 2 || colorType === 0) {
    return {
      data: compressed,
      width,
      height,
      colorSpace: colorType === 0 ? '/DeviceGray' : '/DeviceRGB',
      bitsPerComponent: 8,
      filter: '/FlateDecode',
    }
  }

  if (colorType !== 6) return null

  const rgba = unfilterPngScanlines(inflateSync(compressed), width, height, 4)
  const rgb = Buffer.alloc(width * height * 3)
  const alpha = Buffer.alloc(width * height)

  for (let index = 0; index < width * height; index += 1) {
    rgb[index * 3] = rgba[index * 4]
    rgb[index * 3 + 1] = rgba[index * 4 + 1]
    rgb[index * 3 + 2] = rgba[index * 4 + 2]
    alpha[index] = rgba[index * 4 + 3]
  }

  return {
    data: deflateSync(addUnfilteredRows(rgb, width * 3, height)),
    width,
    height,
    colorSpace: '/DeviceRGB',
    bitsPerComponent: 8,
    filter: '/FlateDecode',
    smask: {
      data: deflateSync(addUnfilteredRows(alpha, width, height)),
      width,
      height,
    },
  }
}

async function getEmployeePhoto(row: HrHseFileRow) {
  if (!row.includeEmployeeData || !row.photoFileId?.startsWith('/uploads/employee-photos/')) return null

  const publicDir = join(process.cwd(), 'public')
  const photoPath = normalize(join(publicDir, row.photoFileId))

  if (!photoPath.startsWith(publicDir)) return null

  try {
    const photo = await readFile(photoPath)
    if (photo.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))) return parseJpegImage(photo)
    return parsePngImage(photo)
  } catch {
    return null
  }
}

async function readPublicImage(relativePath: string) {
  const publicDir = join(process.cwd(), 'public')
  const imagePath = normalize(join(publicDir, relativePath))

  if (!imagePath.startsWith(publicDir)) return null

  try {
    const image = await readFile(imagePath)
    if (image.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))) return parseJpegImage(image)
    return parsePngImage(image)
  } catch {
    return null
  }
}

async function getCompanyLogo() {
  const logoPaths = [
    'company-logo.png',
    'company-logo.jpg',
    'company-logo.jpeg',
    'becra-logo.png',
    'becra-logo.jpg',
    'becra_logo.png',
    'becra_logo.jpg',
    'becra_logo.jpeg',
    'logo.png',
    'logo.jpg',
    'logo.jpeg',
  ]

  for (const logoPath of logoPaths) {
    const logo = await readPublicImage(logoPath)
    if (logo) return logo
  }

  return null
}

function hseSections(row: HrHseFileRow) {
  const introductionLines = wrapLines([
    'FH_HSE003 - Employee Personal Safety Logbook',
    `Employee: ${row.employeeName}`,
    `Generated: ${formatDate(new Date().toISOString())}`,
    '',
    'INTRODUCTION',
    ...hseIntroduction
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean),
  ])

  const dataLines = [`FH_HSE003 - Employee Personal Safety Logbook`, `Employee: ${row.employeeName}`]

  if (row.includeEmployeeData) {
    addSection(dataLines, 'Employee data', [
      `Email / phone: ${[row.mail, row.phoneNumber].filter(Boolean).join(' / ') || '-'}`,
      `Birth date: ${formatDate(row.birthDate)}`,
      `Address: ${row.address ?? '-'}`,
      `Employment status: ${row.employmentStatus ?? '-'}`,
      `Contract type: ${row.contractType ?? '-'}`,
    ])
  }

  if (row.includePartnerData) {
    addSection(dataLines, 'Partner data', [
      `Name: ${row.partnerName ?? '-'}`,
      `Phone: ${row.partnerPhone ?? '-'}`,
      `Email: ${row.partnerEmail ?? '-'}`,
    ])
  }

  if (row.includeEmergencyContact) {
    addSection(
      dataLines,
      'Emergency contact',
      row.emergencyContacts.length
        ? row.emergencyContacts.flatMap(contact => [
            `Name: ${contact.name}`,
            `Relationship: ${contact.relationship}`,
            `Phone: ${contact.phoneNumber}`,
            `Email: ${contact.mail}`,
            '',
          ])
        : ['No emergency contacts registered.'],
    )
  }

  if (row.includeEmployerData) {
    addSection(dataLines, 'Employer data', [
      `Employer: ${row.employerName ?? 'Becra'}`,
      `Contact: ${row.employerContactName ?? '-'}`,
      `Phone: ${row.employerPhone ?? '-'}`,
      `Email: ${row.employerEmail ?? '-'}`,
    ])
  }

  if (row.includeMedicalExamination) {
    addSection(dataLines, 'Last medical examination', [
      `Date: ${formatDate(row.lastMedicalExaminationDate)}`,
      `Valid until: ${formatDate(row.lastMedicalExaminationValidUntil)}`,
      `Provider: ${row.lastMedicalExaminationProvider ?? '-'}`,
    ])
  }

  if (row.includeTrainingData) {
    addSection(
      dataLines,
      'Training',
      row.trainings.length
        ? row.trainings.flatMap(training => [
            `Document number: ${training.documentNumber ?? '-'}`,
            `Training: ${training.name}`,
            `Type: ${training.type}`,
            `Valid until: ${formatDate(training.validUntil)}`,
            `Provider: ${training.providerName}`,
            '',
          ])
        : ['No HSE training selected.'],
    )

    const trainingAbbreviations = getTrainingAbbreviations(row)

    if (trainingAbbreviations.length) {
      addSection(
        dataLines,
        'Training abbreviations',
        trainingAbbreviations.map(({abbreviation, meaning}) => `${abbreviation}: ${meaning}`),
      )
    }
  }

  return [introductionLines, wrapLines(dataLines)]
}

function drawImageCommand(name: string, image: PdfImage, x: number, y: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height)
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)

  return ['q', `${width} 0 0 ${height} ${x} ${y + maxHeight - height} cm`, `/${name} Do`, 'Q']
}

function footerCommands(pageNumber: number) {
  return ['BT', '/F1 9 Tf', `1 0 0 1 ${pageWidth - margin - 42} 28 Tm`, `(Page ${pageNumber}) Tj`, 'ET']
}

function paginateSections(sections: string[][]) {
  const pages: string[][] = []

  for (const section of sections) {
    pages.push([])
    let y = pageHeight - margin - headerGap

    for (const line of section) {
      if (y < margin + footerHeight) {
        pages.push([])
        y = pageHeight - margin - headerGap
      }

      pages[pages.length - 1].push(line)
      y -= lineHeight
    }
  }

  return pages.length ? pages : [[]]
}

function buildContentStreams(sections: string[][], employeePhoto?: PdfImage | null, companyLogo?: PdfImage | null) {
  const pages = paginateSections(sections)

  return pages.map((pageLines, pageIndex) => {
    let cursorY = pageHeight - margin - headerGap
    const commands: string[] = []

    if (companyLogo) {
      commands.push(
        ...drawImageCommand('Logo', companyLogo, margin, pageHeight - margin - logoHeight, logoWidth, logoHeight),
      )
    } else if (pageIndex === 0) {
      commands.push(
        'BT',
        '/F1 18 Tf',
        `1 0 0 1 ${margin} ${pageHeight - margin - 18} Tm`,
        '(Becra) Tj',
        '/F1 9 Tf',
        `1 0 0 1 ${margin} ${pageHeight - margin - 34} Tm`,
        '(HSE File) Tj',
        'ET',
      )
    }

    if (employeePhoto && pageIndex === 1) {
      commands.push(
        ...drawImageCommand(
          'EmployeePhoto',
          employeePhoto,
          pageWidth - margin - photoWidth,
          pageHeight - margin - headerGap - photoHeight,
          photoWidth,
          photoHeight,
        ),
      )
    }

    commands.push('BT', '/F1 11 Tf', '14 TL')

    for (const [index, line] of pageLines.entries()) {
      const fontSize = index === 0 ? 16 : line === line.toUpperCase() && line.trim() ? 12 : 11
      commands.push(`/F1 ${fontSize} Tf`)
      commands.push(`1 0 0 1 ${margin} ${cursorY} Tm`)
      commands.push(`(${sanitizePdfText(line)}) Tj`)
      cursorY -= lineHeight
    }

    commands.push('ET')
    commands.push(...footerCommands(pageIndex + 1))
    return commands.join('\n')
  })
}

function imageObject(resource: PdfImageResource) {
  const {image} = resource
  const decodeParms =
    image.filter === '/FlateDecode'
      ? ` /DecodeParms << /Predictor 15 /Colors ${image.colorSpace === '/DeviceRGB' ? 3 : 1} /BitsPerComponent 8 /Columns ${image.width} >>`
      : ''
  const smask = resource.smaskObjectNumber ? ` /SMask ${resource.smaskObjectNumber} 0 R` : ''

  return `${resource.objectNumber} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace ${image.colorSpace} /BitsPerComponent 8 /Filter ${image.filter}${decodeParms}${smask} /Length ${image.data.length} >>\nstream\n${image.data.toString('binary')}\nendstream\nendobj\n`
}

function smaskObject(resource: PdfImageResource) {
  if (!resource.image.smask || !resource.smaskObjectNumber) return null

  return `${resource.smaskObjectNumber} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${resource.image.smask.width} /Height ${resource.image.smask.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 1 /BitsPerComponent 8 /Columns ${resource.image.smask.width} >> /Length ${resource.image.smask.data.length} >>\nstream\n${resource.image.smask.data.toString('binary')}\nendstream\nendobj\n`
}

function buildPdf(sections: string[][], employeePhoto?: PdfImage | null, companyLogo?: PdfImage | null) {
  const streams = buildContentStreams(sections, employeePhoto, companyLogo)
  const objects: string[] = []
  const pageObjectNumbers: number[] = []

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  objects.push('__PAGES__')
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')

  let nextObjectNumber = 4
  const imageResources: PdfImageResource[] = []

  if (companyLogo) {
    imageResources.push({
      name: 'Logo',
      image: companyLogo,
      objectNumber: nextObjectNumber++,
      smaskObjectNumber: companyLogo.smask ? nextObjectNumber++ : null,
    })
  }

  if (employeePhoto) {
    imageResources.push({
      name: 'EmployeePhoto',
      image: employeePhoto,
      objectNumber: nextObjectNumber++,
      smaskObjectNumber: employeePhoto.smask ? nextObjectNumber++ : null,
    })
  }

  for (const resource of imageResources) {
    objects.push(imageObject(resource))
    const smask = smaskObject(resource)
    if (smask) objects.push(smask)
  }

  for (const stream of streams) {
    const pageObjectNumber = nextObjectNumber++
    const contentObjectNumber = nextObjectNumber++
    pageObjectNumbers.push(pageObjectNumber)
    const imageResource = imageResources.length
      ? ` /XObject << ${imageResources.map(resource => `/${resource.name} ${resource.objectNumber} 0 R`).join(' ')} >>`
      : ''
    objects.push(
      `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >>${imageResource} >> /Contents ${contentObjectNumber} 0 R >>\nendobj\n`,
    )
    objects.push(
      `${contentObjectNumber} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'binary')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    )
  }

  objects[1] = `2 0 obj\n<< /Type /Pages /Count ${pageObjectNumbers.length} /Kids [${pageObjectNumbers
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

export async function GET(_request: Request, {params}: RouteContext) {
  const {employeeId} = await params
  const row = (await getHrHseFileRows()).find(item => item.employeeId === employeeId)

  if (!row) {
    return NextResponse.json({error: 'Employee HSE file not found.'}, {status: 404})
  }

  const pdf = buildPdf(hseSections(row), await getEmployeePhoto(row), await getCompanyLogo())
  const filename = `HSE_File_${fileSafeName(row.employeeName)}.pdf`

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
