import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Contrato, ContractStatus, ContractType } from '@/types'

export type DisplayStatus = ContractStatus | 'Realizada' | 'Não aplicável'

/**
 * Tipos de etapa que são apenas de data (sem documento):
 * - Inauguração
 * - Pagamento da Taxa de Franquia
 * - Busca do Ponto
 * - Abertura do CNPJ
 */
export const ETAPAS_SOMENTE_DATA: ContractType[] = [
  'Inauguração',
  'Pagamento da Taxa de Franquia',
  'Busca do Ponto',
  'Abertura do CNPJ',
]

export function isEtapaSomenteData(tipo?: ContractType | string): boolean {
  return ETAPAS_SOMENTE_DATA.includes(tipo as ContractType)
}

/**
 * Apenas estas duas etapas suportam ser marcadas como "Não aplicável":
 * - Pagamento da Taxa de Franquia
 * - Busca do Ponto
 */
export const ETAPAS_PERMITEM_NAO_APLICAVEL: ContractType[] = [
  'Pagamento da Taxa de Franquia',
  'Busca do Ponto',
]

export function etapaPermiteNaoAplicavel(tipo?: ContractType | string): boolean {
  return ETAPAS_PERMITEM_NAO_APLICAVEL.includes(tipo as ContractType)
}

/**
 * Deriva o status exibido do contrato:
 * - Se for uma etapa que permite "Não aplicável" e estiver marcada como nao_aplicavel:
 *     - "Não aplicável" (badge cinza neutro)
 * - Para etapas apenas de data ("Inauguração", "Pagamento da Taxa de Franquia", "Busca do Ponto", "Abertura do CNPJ"):
 *     - "Realizada" se houver data informada (data_inicio, data_inauguracao ou franqueado.data_inauguracao)
 *     - "Pendente" se não houver data
 * - Para os demais tipos de contratos (com documento):
 *     - Retorna o campo contrato.status
 */
export function getStatusExibido(contrato?: Contrato | null, overrideData?: string): DisplayStatus {
  if (!contrato) return 'Pendente'

  if (etapaPermiteNaoAplicavel(contrato.tipo) && contrato.nao_aplicavel) {
    return 'Não aplicável'
  }

  if (isEtapaSomenteData(contrato.tipo)) {
    let rawDate = overrideData
    if (!rawDate) {
      if (contrato.tipo === 'Inauguração') {
        rawDate =
          contrato.data_inauguracao ||
          contrato.data_inicio ||
          contrato.expand?.franqueado?.data_inauguracao
      } else {
        rawDate = contrato.data_inicio
      }
    }
    const hasDate = Boolean(rawDate && String(rawDate).trim())
    return hasDate ? 'Realizada' : 'Pendente'
  }

  return contrato.status || 'Pendente'
}

interface StatusBadgeProps {
  status: DisplayStatus | ContractStatus | string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  switch (status) {
    case 'Não aplicável':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs',
            className,
          )}
        >
          Não aplicável
        </span>
      )
    case 'Realizada':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm',
            className,
          )}
        >
          Realizada
        </span>
      )
    case 'Pendente':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm',
            className,
          )}
        >
          Pendente
        </span>
      )
    case 'Em Elaboração':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm',
            className,
          )}
        >
          Em Elaboração
        </span>
      )
    case 'Enviado':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 shadow-sm',
            className,
          )}
        >
          Enviado
        </span>
      )
    case 'Assinado':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm',
            className,
          )}
        >
          Assinado
        </span>
      )
    case 'Vencido':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 shadow-sm',
            className,
          )}
        >
          Vencido
        </span>
      )
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      )
  }
}
