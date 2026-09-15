import type { RecordModel } from 'pocketbase'

export type ContractType = 'Recebimento da COF' | 'Pré-Contrato' | 'Contrato' | 'Inauguração'

export type ContractStatus = 'Pendente' | 'Em Elaboração' | 'Enviado' | 'Assinado' | 'Vencido'

export interface Franqueado extends RecordModel {
  nome: string
  cnpj?: string
  cidade?: string
  estado?: string
  responsavel?: string
  email?: string
  telefone?: string
  data_inauguracao?: string
}

export interface Socio extends RecordModel {
  franqueado: string
  nome: string
  cpf_cnpj?: string
  email?: string
  telefone?: string
  percentual?: number
  cargo?: string
  expand?: {
    franqueado?: Franqueado
  }
}

export interface Contrato extends RecordModel {
  franqueado: string
  tipo: ContractType
  status: ContractStatus
  data_inicio?: string
  data_fim?: string
  data_assinatura?: string
  data_envio?: string
  data_inauguracao?: string
  documento_assinado?: string
  expand?: {
    franqueado?: Franqueado
  }
}

export interface Documento extends RecordModel {
  contrato: string
  conteudo?: string
  variaveis?: Record<string, string>
  data_envio?: string
  expand?: {
    contrato?: Contrato
  }
}

export type ModeloTipo = 'COF' | 'Pre-Contrato' | 'Contrato'

export interface ModeloContrato extends RecordModel {
  tipo: ModeloTipo
  titulo?: string
  texto?: string
  versao?: number
  ano_versao?: number
}

/**
 * Retorna o nome amigável do tipo de modelo conforme padrão exigido:
 * COF -> 'COF', Pre-Contrato -> 'Pré-Contrato', Contrato -> 'Contrato'
 */
export function getModeloTipoDisplay(tipo: ModeloTipo): string {
  switch (tipo) {
    case 'COF':
      return 'COF'
    case 'Pre-Contrato':
      return 'Pré-Contrato'
    case 'Contrato':
      return 'Contrato'
    default:
      return tipo
  }
}

/**
 * Retorna o rótulo da versão do modelo no formato exato solicitado:
 * Ex: "Modelo COF Versão 2.2026", "Modelo Pré-Contrato Versão 1.2026"
 */
export function formatModeloVersaoRotulo(modelo?: Partial<ModeloContrato> | null): string {
  const tipo = modelo?.tipo ? getModeloTipoDisplay(modelo.tipo) : 'Contrato'
  const versao = modelo?.versao ?? 1
  const ano = modelo?.ano_versao ?? 2026
  return `Modelo ${tipo} Versão ${versao}.${ano}`
}

/**
 * Calcula a próxima versão e ano para quando o usuário salvar uma edição de modelo.
 * Se o ano corrente for igual a ano_versao, incrementa versao (ex: 1.2026 -> 2.2026).
 * Se o ano corrente for maior/diferente de ano_versao, reseta a versão para 1 no novo ano (ex: 2.2026 -> 1.2027).
 */
export function computeNextModeloVersao(
  currentVersao?: number | null,
  currentAno?: number | null,
  targetYear: number = new Date().getFullYear(),
): { versao: number; ano_versao: number } {
  const anoAtual = targetYear
  const versaoBase = currentVersao && currentVersao > 0 ? currentVersao : 1
  const anoBase = currentAno && currentAno > 0 ? currentAno : 2026

  if (anoBase === anoAtual) {
    return {
      versao: versaoBase + 1,
      ano_versao: anoAtual,
    }
  }

  // Novo ano: primeira versão elaborada naquele ano
  return {
    versao: 1,
    ano_versao: anoAtual,
  }
}

export interface ContractExpiryInfo {
  isExpired: boolean
  isAlert: boolean
  daysRemaining: number
  monthsRemaining: number
}

/**
 * Calcula a data final de vigência (5 anos a contar da data de assinatura).
 * Se dataAssinatura for informada e válida, retorna um Date ou string ISO correspondente.
 */
export function getVigenciaFimDate(dataAssinatura?: string | null): Date | null {
  if (!dataAssinatura) return null
  const clean = dataAssinatura.replace(' ', 'T')
  const date = new Date(clean)
  if (isNaN(date.getTime())) return null

  // Adiciona 5 anos preservando dia e mês UTC
  const endDate = new Date(date.getTime())
  endDate.setUTCFullYear(endDate.getUTCFullYear() + 5)
  return endDate
}

/**
 * Retorna as informações de vigência formatadas para exibição:
 * Vigência de data_assinatura até data_assinatura + 5 anos.
 * Se data_assinatura não estiver preenchida, retorna inicio=null, fim=null, label="—".
 */
export function getContractVigencia(contrato?: Contrato | null): {
  dataInicio: string | null
  dataFim: string | null
  hasVigencia: boolean
} {
  if (!contrato || !contrato.data_assinatura) {
    return { dataInicio: null, dataFim: null, hasVigencia: false }
  }

  const endDate = getVigenciaFimDate(contrato.data_assinatura)
  if (!endDate) {
    return { dataInicio: null, dataFim: null, hasVigencia: false }
  }

  return {
    dataInicio: contrato.data_assinatura,
    dataFim: endDate.toISOString(),
    hasVigencia: true,
  }
}

/**
 * Computes validity and red alert (< 6 months / <= 180 days or expired)
 * Baseado na data_assinatura + 5 anos da regra de negócio de franquia.
 * Se não houver data_assinatura, não há alerta (a menos que status manual seja 'Vencido').
 */
export function computeContractExpiry(
  dataFimOrAssinatura?: string | null,
  status?: ContractStatus,
  options?: { isDirectEndDate?: boolean },
): ContractExpiryInfo {
  // Por padrão, se options?.isDirectEndDate não for true, dataFimOrAssinatura é interpretada
  // como data de fim já calculada SE options?.isDirectEndDate for true, senão verifica se foi passada data_assinatura.
  let targetDate: Date | null = null

  if (dataFimOrAssinatura) {
    if (options?.isDirectEndDate) {
      const clean = dataFimOrAssinatura.replace(' ', 'T')
      const d = new Date(clean)
      if (!isNaN(d.getTime())) {
        targetDate = d
      }
    } else {
      targetDate = getVigenciaFimDate(dataFimOrAssinatura)
    }
  }

  if (!targetDate) {
    return {
      isExpired: status === 'Vencido',
      isAlert: false,
      daysRemaining: 9999,
      monthsRemaining: 999,
    }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetTime = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  ).getTime()

  const diffMs = targetTime - today
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const isExpired = daysRemaining < 0 || status === 'Vencido'
  const isAlert = !isExpired && daysRemaining <= 180

  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30))

  return {
    isExpired,
    isAlert,
    daysRemaining,
    monthsRemaining,
  }
}

/**
 * Helper para calcular expiração e alertas direto de uma entidade Contrato.
 * Regra do usuário: Vigência será sempre de 5 anos a contar da data de assinatura.
 * Quando não há data de assinatura, não há alerta.
 */
export function getContratoExpiryInfo(contrato?: Contrato | null): ContractExpiryInfo {
  if (!contrato || !contrato.data_assinatura) {
    return {
      isExpired: contrato?.status === 'Vencido',
      isAlert: false,
      daysRemaining: 9999,
      monthsRemaining: 999,
    }
  }

  return computeContractExpiry(contrato.data_assinatura, contrato.status)
}

export const STANDARD_DOCUMENT_TEMPLATE = `CONTRATO DE FRANQUIA — BOSS DETAIL

Contratada: Boss Detail Ltda.

Franqueado: {{franqueado_nome}}
CNPJ: {{franqueado_cnpj}}
Endereço: {{franqueado_cidade}}/{{franqueado_estado}}
Sócio / Responsável: {{franqueado_socio}}

Vigência do contrato: {{contrato_inicio}} a {{contrato_fim}}

Dados da última franquia:
Nome: {{ultima_franquia_nome}}
CNPJ: {{ultima_franquia_cnpj}}
Cidade: {{ultima_franquia_cidade}}/{{ultima_franquia_estado}}
Período: {{ultima_franquia_periodo}}

Data de emissão: {{data_hoje}}

Assinaturas:
______________________  ______________________
Contratante             Contratada`
