const COMPANY_PREFIX = '[company]'

export function encodeQuoteBecraDescription(description: string | null | undefined, company: string | null | undefined): string | null {
  const companyValue = (company ?? '').trim()
  const descriptionValue = (description ?? '').trim()

  if (!companyValue && !descriptionValue) return null
  if (!companyValue) return descriptionValue || null

  return `${COMPANY_PREFIX}${companyValue}\n${descriptionValue}`.trimEnd()
}

export function decodeQuoteBecraDescription(rawDescription: string | null | undefined): {
  company: string | null
  description: string | null
} {
  const value = rawDescription ?? ''
  if (!value.startsWith(COMPANY_PREFIX)) {
    return {company: null, description: value || null}
  }

  const firstLineBreak = value.indexOf('\n')
  const firstLine = firstLineBreak === -1 ? value : value.slice(0, firstLineBreak)
  const company = firstLine.slice(COMPANY_PREFIX.length).trim() || null
  const descriptionPart = firstLineBreak === -1 ? '' : value.slice(firstLineBreak + 1)

  return {company, description: descriptionPart.trim() || null}
}

