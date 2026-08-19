import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Plus, ExternalLink } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { computeContractExpiry, type Contrato, type ContractType } from '@/types'
import { formatDateBR } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ContractCellProps {
  franqueadoId: string
  tipo: ContractType
  contrato?: Contrato
}

export const ContractCell: React.FC<ContractCellProps> = ({ franqueadoId, tipo, contrato }) => {
  if (!contrato) {
    return (
      <div className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors">
        <span className="text-xs text-slate-400 font-medium mb-1">Sem contrato</span>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] text-amber-700 hover:text-amber-800 hover:bg-amber-100/60 font-semibold gap-1"
        >
          <Link to={`/contratos/novo?franqueado=${franqueadoId}&tipo=${encodeURIComponent(tipo)}`}>
            <Plus className="w-3 h-3" />
            Criar
          </Link>
        </Button>
      </div>
    )
  }

  const expiry = computeContractExpiry(contrato.data_fim, contrato.status)

  // Style variations based on Expiry & Red Alert rule
  // 1. Expired (data_fim past or status Vencido) -> Dark red background, red badge
  // 2. Alert (data_fim <= 180 days) -> Red border, red text, pulsing warning pill
  // 3. Normal
  let containerStyles = 'p-2.5 rounded-lg border transition-all bg-white shadow-xs'

  if (expiry.isExpired) {
    containerStyles = 'p-2.5 rounded-lg border-2 border-red-500 bg-red-50/90 text-red-950 shadow-xs'
  } else if (expiry.isAlert) {
    containerStyles = 'p-2.5 rounded-lg border-2 border-red-500 bg-red-50/40 text-red-900 shadow-sm'
  } else {
    containerStyles = 'p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300'
  }

  return (
    <div className={containerStyles}>
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <StatusBadge status={contrato.status} />

        {/* Expiry / Red alert Pill */}
        {expiry.isExpired ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-xs">
            <Clock className="w-3 h-3" />
            Vencido
          </span>
        ) : expiry.isAlert ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Faltam {expiry.monthsRemaining} {expiry.monthsRemaining === 1 ? 'mês' : 'meses'}
          </span>
        ) : null}
      </div>

      {/* Validity lines */}
      <div className="space-y-0.5">
        <div
          className={cn(
            'text-[11px] font-medium leading-tight',
            expiry.isExpired || expiry.isAlert ? 'text-red-700 font-semibold' : 'text-slate-600',
          )}
        >
          <span>Vigência: </span>
          <span className="tabular-nums">
            {contrato.data_inicio ? formatDateBR(contrato.data_inicio) : '—'} a{' '}
            {contrato.data_fim ? formatDateBR(contrato.data_fim) : '—'}
          </span>
        </div>

        {contrato.status === 'Assinado' && contrato.data_inicio && (
          <p className="text-[10px] text-emerald-700 font-medium">
            Assinado em {formatDateBR(contrato.data_inicio)}
          </p>
        )}
      </div>

      {/* Action link */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-end">
        <Link
          to={`/documento/${contrato.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-amber-600 transition-colors group"
        >
          <span>Gerenciar</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
        </Link>
      </div>
    </div>
  )
}
