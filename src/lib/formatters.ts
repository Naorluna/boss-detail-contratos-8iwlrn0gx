export function formatDateBR(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    // PocketBase dates can be ISO or 'YYYY-MM-DD HH:mm:ss'
    const clean = dateString.replace(' ', 'T')
    const date = new Date(clean)
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
