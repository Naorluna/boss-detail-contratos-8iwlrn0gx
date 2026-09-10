export function formatDateBR(dateString?: string | Date | null): string {
  if (!dateString) return '—'
  try {
    const date =
      dateString instanceof Date ? dateString : new Date(String(dateString).replace(' ', 'T'))
    if (isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } catch (_) {
    return '—'
  }
}

/**
 * Formata o intervalo de vigência calculado de 5 anos a partir da data de assinatura.
 * Exemplo: "10/05/2024 a 10/05/2029"
 * Se dataAssinatura for nula ou não preenchida, retorna "—".
 */
export function formatVigencia5Anos(dataAssinatura?: string | null): string {
  if (!dataAssinatura) return '—'
  const clean = dataAssinatura.replace(' ', 'T')
  const startDate = new Date(clean)
  if (isNaN(startDate.getTime())) return '—'

  const endDate = new Date(startDate.getTime())
  endDate.setUTCFullYear(endDate.getUTCFullYear() + 5)

  const startFormatted = formatDateBR(startDate)
  const endFormatted = formatDateBR(endDate)
  if (startFormatted === '—' || endFormatted === '—') return '—'

  return `${startFormatted} a ${endFormatted}`
}

export function formatDateInput(dateString?: string | null): string {
  if (!dateString) return ''
  try {
    const clean = dateString.replace(' ', 'T')
    const date = new Date(clean)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch (_) {
    return ''
  }
}

export function formatCNPJ(value?: string | null): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 14) {
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return value
}

export function formatCPFOrCNPJ(value?: string | null): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }
  return formatCNPJ(value)
}

export function formatPhone(value?: string | null): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{4})$/, '$1-$2')
      .replace(/(\d{4})(\d{4})$/, '$1-$2')
  }
  return value
}
