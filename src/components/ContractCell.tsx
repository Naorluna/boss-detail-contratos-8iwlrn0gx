import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  Plus,
  FileCheck2,
  Paperclip,
  Calendar,
  Pencil,
  Ban,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import {
  StatusBadge,
  getStatusExibido,
  isEtapaSomenteData,
  etapaPermiteNaoAplicavel,
} from './StatusBadge'
import { getContratoExpiryInfo, type Contrato, type ContractType } from '@/types'
import { formatDateBR, formatVigencia5Anos } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { contratosService } from '@/services/dataService'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ContractCellProps {
  franqueadoId: string
  tipo: ContractType
  contrato?: Contrato
  onContratoUpdated?: (updated: Contrato) => void
}

export const ContractCell: React.FC<ContractCellProps> = ({
  franqueadoId,
  tipo,
  contrato,
  onContratoUpdated,
}) => {
  const { toast } = useToast()
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [savingNaoAplicavel, setSavingNaoAplicavel] = useState(false)
  if (!contrato) {
    return (
      <div className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors">
        <span className="text-xs text-slate-400 font-medium mb-1">Sem etapa</span>
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

  const allowsNaoAplicavel = etapaPermiteNaoAplicavel(tipo)
  const isNaoAplicavel = Boolean(allowsNaoAplicavel && contrato?.nao_aplicavel)

  const handleToggleNaoAplicavel = async (novoValor: boolean) => {
    if (!contrato) return
    setSavingNaoAplicavel(true)
    try {
      const updated = await contratosService.update(contrato.id, {
        nao_aplicavel: novoValor,
      })
      setConfirmModalOpen(false)
      onContratoUpdated?.(updated)
      toast({
        title: novoValor ? 'Marcada como Não aplicável' : 'Etapa desmarcada',
        description: novoValor
          ? `A etapa "${tipo}" foi marcada como Não aplicável.`
          : `A etapa "${tipo}" voltou para o status padrão.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar etapa',
        description: err?.message || 'Falha ao salvar alteração.',
        variant: 'destructive',
      })
    } finally {
      setSavingNaoAplicavel(false)
    }
  }

  // Se for uma das etapas que são puramente controle de data (sem documento):
  if (isEtapaSomenteData(tipo)) {
    const rawDate =
      tipo === 'Inauguração'
        ? contrato.data_inauguracao ||
          contrato.data_inicio ||
          contrato.expand?.franqueado?.data_inauguracao
        : contrato.data_inicio

    const hasDate = Boolean(rawDate)

    const labelPorTipo: Record<string, string> = {
      'Pagamento da Taxa de Franquia': 'Pagamento:',
      'Busca do Ponto': 'Definição:',
      'Abertura do CNPJ': 'Abertura:',
      Inauguração: 'Inauguração:',
    }

    const labelEtapa = labelPorTipo[tipo] || 'Data:'

    return (
      <>
        <div
          className={cn(
            'p-2.5 rounded-lg border transition-all shadow-xs',
            isNaoAplicavel
              ? 'border-slate-200 bg-slate-50/80 hover:border-slate-300'
              : 'border-slate-200 bg-white hover:border-slate-300',
          )}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <StatusBadge status={getStatusExibido(contrato)} />

            {/* Botão de Não aplicável / Desmarcar exclusivo para Taxa de Franquia e Busca do Ponto */}
            {allowsNaoAplicavel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmModalOpen(true)}
                disabled={savingNaoAplicavel}
                className={cn(
                  'h-5 px-1.5 text-[10px] font-semibold gap-1 rounded',
                  isNaoAplicavel
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
                )}
                title={
                  isNaoAplicavel
                    ? 'Desmarcar não aplicável'
                    : 'Marcar esta etapa como Não aplicável'
                }
              >
                {isNaoAplicavel ? (
                  <>
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Desmarcar</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-2.5 h-2.5" />
                    <span>Não aplicável</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] font-medium leading-tight text-slate-600">
              <span>{labelEtapa} </span>
              {hasDate ? (
                <span className="tabular-nums font-semibold text-slate-900">
                  {formatDateBR(rawDate)}
                </span>
              ) : (
                <span className="text-slate-400 italic">
                  {isNaoAplicavel ? 'Dispensada' : 'Não informada'}
                </span>
              )}
            </div>
          </div>

          {/* Action link específico para etapas de data (sem Anexado / Sem anexo) */}
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
              <Calendar className="w-3 h-3 text-amber-500" />
              {hasDate ? 'Data gravada' : isNaoAplicavel ? 'Não aplicável' : 'Sem data'}
            </span>

            <Link
              to={`/documento/${contrato.id}`}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-amber-600 transition-colors group"
            >
              {hasDate ? (
                <>
                  <Pencil className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  <span>Editar data</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 text-amber-500 group-hover:text-amber-600 transition-colors" />
                  <span className="text-amber-700 group-hover:text-amber-800">Lançar data</span>
                </>
              )}
            </Link>
          </div>
        </div>

        {/* Modal de confirmação para marcar ou desmarcar Não aplicável */}
        {allowsNaoAplicavel && (
          <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-slate-600" />
                  {isNaoAplicavel ? 'Desmarcar "Não aplicável"?' : 'Marcar como "Não aplicável"?'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600 pt-1">
                  {isNaoAplicavel
                    ? `Deseja retornar a etapa "${tipo}" para o fluxo normal? O status voltará a ser derivado do lançamento da data.`
                    : `Deseja marcar a etapa "${tipo}" como Não aplicável para esta unidade? A data continuará podendo ser preenchida caso necessário.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={savingNaoAplicavel}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleToggleNaoAplicavel(!isNaoAplicavel)}
                  disabled={savingNaoAplicavel}
                  className="text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white"
                >
                  {savingNaoAplicavel ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : null}
                  {isNaoAplicavel ? 'Confirmar e Desmarcar' : 'Confirmar "Não aplicável"'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    )
  }

  const expiry = getContratoExpiryInfo(contrato)
  const vigenciaFormatada = formatVigencia5Anos(contrato.data_assinatura)

  // Style variations based on Expiry & Red Alert rule
  // 1. Expired (calculado a partir de data_assinatura + 5 anos ou status Vencido) -> Dark red background, red badge
  // 2. Alert (data_assinatura + 5 anos <= 180 dias) -> Red border, red text, pulsing warning pill
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
        <StatusBadge status={getStatusExibido(contrato)} />

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
          <span className="tabular-nums">{vigenciaFormatada}</span>
        </div>

        {contrato.data_assinatura ? (
          <p className="text-[10px] text-emerald-700 font-medium">
            Assinado em {formatDateBR(contrato.data_assinatura)}
          </p>
        ) : (
          <p className="text-[10px] text-slate-400 italic">Não informada</p>
        )}
      </div>
      {/* Action link */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {contrato.documento_assinado ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
            <FileCheck2 className="w-3 h-3 text-emerald-600" />
            Anexado
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Sem anexo</span>
        )}

        <Link
          to={`/documento/${contrato.id}`}
          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-amber-600 transition-colors group"
        >
          <Paperclip className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
          <span>{contrato.documento_assinado ? 'Ver/Alterar' : 'Anexar'}</span>
        </Link>
      </div>{' '}
    </div>
  )
}
