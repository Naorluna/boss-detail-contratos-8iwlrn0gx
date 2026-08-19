import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Building2,
  Pencil,
  PlusCircle,
  MapPin,
  Mail,
  Phone,
  Calendar,
  User,
  ArrowLeft,
  FileText,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { franqueadosService, contratosService, documentosService } from '@/services/dataService'
import type { Franqueado, Contrato, ContractType, Documento } from '@/types'
import { computeContractExpiry } from '@/types'
import { formatDateBR, formatCNPJ, formatPhone } from '@/lib/formatters'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function FranqueadoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [franqueado, setFranqueado] = useState<Franqueado | null>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [docsMap, setDocsMap] = useState<Map<string, Documento>>(new Map())
  const [loading, setLoading] = useState(true)

  // Contract deletion modal
  const [deleteContractModalOpen, setDeleteContractModalOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<Contrato | null>(null)
  const [deletingContract, setDeletingContract] = useState(false)

  const fetchData = async () => {
    if (!id) return
    try {
      const [f, cList] = await Promise.all([
        franqueadosService.getById(id),
        contratosService.getByFranqueado(id),
      ])
      setFranqueado(f)
      setContratos(cList)

      // Fetch corresponding docs
      const dMap = new Map<string, Documento>()
      await Promise.all(
        cList.map(async (c) => {
          const doc = await documentosService.getByContrato(c.id)
          if (doc) dMap.set(c.id, doc)
        }),
      )
      setDocsMap(dMap)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: err?.message || 'Franqueado não encontrado.',
        variant: 'destructive',
      })
      navigate('/franqueados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleDeleteContract = async () => {
    if (!contractToDelete) return
    setDeletingContract(true)
    try {
      await contratosService.delete(contractToDelete.id)
      toast({
        title: 'Contrato removido',
        description: `O contrato "${contractToDelete.tipo}" foi removido com sucesso.`,
      })
      setDeleteContractModalOpen(false)
      setContractToDelete(null)
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Erro ao remover contrato',
        description: err?.message || 'Falha ao remover o contrato.',
        variant: 'destructive',
      })
    } finally {
      setDeletingContract(false)
    }
  }

  const allTypes: ContractType[] = ['Recebimento da COF', 'Pré-Contrato', 'Contrato']

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!franqueado) return null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/franqueados')}
          className="text-slate-600 hover:text-slate-900 text-xs gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Franqueados
        </Button>
      </div>

      {/* Header Card: Details */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">{franqueado.nome}</h2>
            </div>
            <p className="text-xs text-slate-400">
              {franqueado.cidade
                ? `${franqueado.cidade} / ${franqueado.estado || 'BR'}`
                : 'Localidade não especificada'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/franqueados/${franqueado.id}/editar`)}
              className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-400" />
              Editar
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/contratos/novo?franqueado=${franqueado.id}`)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Novo Contrato
            </Button>
          </div>
        </div>

        {/* Info Chips Grid */}
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* CNPJ */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">CNPJ</span>
              <span className="font-semibold text-slate-800 font-mono text-sm mt-0.5 block">
                {franqueado.cnpj ? formatCNPJ(franqueado.cnpj) : '—'}
              </span>
            </div>

            {/* Localização */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Cidade / UF
              </span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {franqueado.cidade ? `${franqueado.cidade}/${franqueado.estado || 'BR'}` : '—'}
              </span>
            </div>

            {/* Responsável */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Responsável
              </span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {franqueado.responsavel || '—'}
              </span>
            </div>

            {/* E-mail */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">E-mail</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block truncate">
                {franqueado.email || '—'}
              </span>
            </div>

            {/* Telefone */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Telefone</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {franqueado.telefone ? formatPhone(franqueado.telefone) : '—'}
              </span>
            </div>

            {/* Data de Inauguração */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Inauguração
              </span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {franqueado.data_inauguracao ? formatDateBR(franqueado.data_inauguracao) : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Contratos & Documentos da Unidade
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {allTypes.map((tipo) => {
            const contrato = contratos.find((c) => c.tipo === tipo)
            const doc = contrato ? docsMap.get(contrato.id) : null
            const expiry = contrato
              ? computeContractExpiry(contrato.data_fim, contrato.status)
              : null

            if (!contrato) {
              return (
                <div
                  key={tipo}
                  className="p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">{tipo}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Nenhum contrato cadastrado para este tipo.
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold self-start sm:self-auto"
                  >
                    <Link
                      to={`/contratos/novo?franqueado=${franqueado.id}&tipo=${encodeURIComponent(
                        tipo,
                      )}`}
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      Criar contrato — {tipo}
                    </Link>
                  </Button>
                </div>
              )
            }

            return (
              <Card
                key={contrato.id}
                className={`border rounded-xl transition-all shadow-xs ${
                  expiry?.isExpired
                    ? 'border-red-400 bg-red-50/40'
                    : expiry?.isAlert
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-bold text-slate-900">{contrato.tipo}</span>
                      <StatusBadge status={contrato.status} />

                      {/* Expiry Pill */}
                      {expiry?.isExpired ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-red-600 px-2.5 py-0.5 rounded-full shadow-xs">
                          <Clock className="w-3.5 h-3.5" />
                          Vencido
                        </span>
                      ) : expiry?.isAlert ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Faltam {expiry.monthsRemaining} meses
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Vigência: </span>
                        <span
                          className={`font-semibold tabular-nums ${
                            expiry?.isExpired || expiry?.isAlert ? 'text-red-700' : 'text-slate-700'
                          }`}
                        >
                          {contrato.data_inicio ? formatDateBR(contrato.data_inicio) : '—'} a{' '}
                          {contrato.data_fim ? formatDateBR(contrato.data_fim) : '—'}
                        </span>
                      </div>

                      {doc?.data_envio && (
                        <div className="text-slate-500 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                          Enviado em {formatDateBR(doc.data_envio)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs gap-1.5"
                    >
                      <Link to={`/documento/${contrato.id}`}>
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        Gerenciar Documento
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setContractToDelete(contrato)
                        setDeleteContractModalOpen(true)
                      }}
                      className="text-slate-400 hover:text-red-600 h-8 w-8"
                      title="Excluir contrato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Delete Contract Confirmation Modal */}
      <Dialog open={deleteContractModalOpen} onOpenChange={setDeleteContractModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Excluir contrato?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Tem certeza que deseja excluir o contrato{' '}
              <strong className="text-slate-800">{contractToDelete?.tipo}</strong>? O documento e
              seus dados salvos também serão apagados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteContractModalOpen(false)}
              disabled={deletingContract}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteContract}
              disabled={deletingContract}
              className="text-xs font-semibold"
            >
              {deletingContract ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Excluir Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
