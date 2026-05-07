export type CsvRow = Record<string, string>

export function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  if (!/[",\r\n]/.test(text)) return text
  return `"${text.replaceAll('"', '""')}"`
}

export function buildCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvEscape).join(','), ...rows.map(row => row.map(csvEscape).join(','))].join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"'
        i++
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') cell += char
  }

  row.push(cell)
  rows.push(row)

  const [headers = [], ...body] = rows.filter(r => r.some(value => value.trim() !== ''))
  return body.map(values =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] ?? '').trim()])),
  )
}

export function isTruthyCsvValue(value: string | undefined) {
  return ['1', 'true', 'yes', 'y', 'ja', 'x'].includes((value ?? '').trim().toLowerCase())
}

export function getCsvValue(row: CsvRow, aliases: string[]) {
  const entries = Object.entries(row)
  for (const alias of aliases) {
    const found = entries.find(([key]) => key.trim().toLowerCase() === alias.toLowerCase())
    if (found) return found[1].trim()
  }
  return ''
}

export function normalizeCsvLookup(value: string) {
  return value.trim().toLowerCase()
}

export function splitCsvList(value: string) {
  return value
    .split(/[|,;]/)
    .map(item => item.trim())
    .filter(Boolean)
}
