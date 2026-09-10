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

export interface ContractExpiryInfo {
  isExpired: boolean
  isAlert: boolean
  daysRemaining: number
  monthsRemaining: number
}

/**
 * Computes validity and red alert (<= 180 days or expired)
 */
export function computeContractExpiry(
  dataFim?: string,
  status?: ContractStatus,
): ContractExpiryInfo {
  if (!dataFim) {
    return {
      isExpired: status === 'Vencido',
      isAlert: false,
      daysRemaining: 9999,
      monthsRemaining: 999,
    }
  }

  const now = new Date()
  // Reset time to start of day for clean day diffs
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetDate = new Date(dataFim)
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
