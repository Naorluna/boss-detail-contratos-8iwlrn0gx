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
  Users,
  ArrowLeft,
  FileText,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle,
  Percent,
  Briefcase,
  UserPlus,
} from 'lucide-react'
import {
  franqueadosService,
  sociosService,
  contratosService,
  documentosService,
} from '@/services/dataService'
import type { Franqueado, Socio, Contrato, ContractType, Documento } from '@/types'
import { getContratoExpiryInfo } from '@/types'
import {
  formatDateBR,
  formatCNPJ,
  formatPhone,
  formatCPFOrCNPJ,
  formatVigencia5Anos,
} from '@/lib/formatters'
import { StatusBadge, getStatusExibido } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [socios, setSocios] = useState<Socio[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [docsMap, setDocsMap] = useState<Map<string, Documento>>(new Map())
  const [loading, setLoading] = useState(true)

  // Contract deletion modal
  const [deleteContractModalOpen, setDeleteContractModalOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<Contrato | null>(null)
  const [deletingContract, setDeletingContract] = useState(false)

  // Socio Modal (Add / Edit)
  const [socioModalOpen, setSocioModalOpen] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null)
  const [savingSocio, setSavingSocio] = useState(false)
  const [socioForm, setSocioForm] = useState({
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    percentual: '',
    cargo: '',
  })
  const [socioFormErrors, setSocioFormErrors] = useState<{ [key: string]: string }>({})

  // Socio Deletion Modal
  const [deleteSocioModalOpen, setDeleteSocioModalOpen] = useState(false)
  const [socioToDelete, setSocioToDelete] = useState<Socio | null>(null)
  const [deletingSocio, setDeletingSocio] = useState(false)

  const fetchData = async () => {
    if (!id) return
    try {
      const [f, sList, cList] = await Promise.all([
        franqueadosService.getById(id),
        sociosService.getByFranqueado(id),
        contratosService.getByFranqueado(id),
      ])
      setFranqueado(f)
      setSocios(sList)
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

  // Socio Actions
  const handleOpenAddSocio = () => {
    setEditingSocio(null)
    setSocioForm({
      nome: '',
      cpf_cnpj: '',
      email: '',
      telefone: '',
      percentual: '',
      cargo: 'Sócio',
    })
    setSocioFormErrors({})
    setSocioModalOpen(true)
  }

  const handleOpenEditSocio = (socio: Socio) => {
    setEditingSocio(socio)
    setSocioForm({
      nome: socio.nome || '',
      cpf_cnpj: socio.cpf_cnpj || '',
      email: socio.email || '',
      telefone: socio.telefone || '',
      percentual:
        socio.percentual !== undefined && socio.percentual !== null ? String(socio.percentual) : '',
      cargo: socio.cargo || '',
    })
    setSocioFormErrors({})
    setSocioModalOpen(true)
  }

  const handleSaveSocio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    const errors: { [key: string]: string } = {}
    if (!socioForm.nome.trim()) {
      errors.nome = 'Nome do sócio é obrigatório'
    }
    if (socioForm.percentual) {
      const num = Number(socioForm.percentual)
      if (isNaN(num) || num < 0 || num > 100) {
        errors.percentual = 'O percentual deve estar entre 0 e 100%'
      }
    }

    if (Object.keys(errors).length > 0) {
      setSocioFormErrors(errors)
      return
    }

    setSavingSocio(true)
    try {
      const payload: Partial<Socio> = {
        franqueado: id,
        nome: socioForm.nome.trim(),
        cpf_cnpj: socioForm.cpf_cnpj.trim(),
        email: socioForm.email.trim(),
        telefone: socioForm.telefone.trim(),
        cargo: socioForm.cargo.trim(),
        percentual: socioForm.percentual ? Number(socioForm.percentual) : 0,
      }

      if (editingSocio) {
        await sociosService.update(editingSocio.id, payload)
        toast({
          title: 'Sócio atualizado',
          description: `Os dados de "${payload.nome}" foram salvos com sucesso.`,
        })
      } else {
        await sociosService.create(payload)
        toast({
          title: 'Sócio adicionado',
          description: `"${payload.nome}" foi incluído à lista de sócios do franqueado.`,
        })
      }

      // If franqueado has no responsavel set, or we're editing the first one, keep sync
      if (!franqueado?.responsavel && payload.nome) {
        await franqueadosService.update(id, { responsavel: payload.nome })
      }

      setSocioModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar sócio',
        description: err?.message || 'Falha ao salvar os dados do sócio.',
        variant: 'destructive',
      })
    } finally {
      setSavingSocio(false)
    }
  }

  const handleDeleteSocio = async () => {
    if (!socioToDelete) return
    setDeletingSocio(true)
    try {
      await sociosService.delete(socioToDelete.id)
      toast({
        title: 'Sócio removido',
        description: `O sócio "${socioToDelete.nome}" foi removido com sucesso.`,
      })
      setDeleteSocioModalOpen(false)
      setSocioToDelete(null)
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Erro ao remover sócio',
        description: err?.message || 'Falha ao remover o sócio.',
        variant: 'destructive',
      })
    } finally {
      setDeletingSocio(false)
    }
  }

  const allTypes: ContractType[] = ['Recebimento da COF', 'Pré-Contrato', 'Contrato', 'Inauguração']

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!franqueado) return null

  // Sócio display name for summary
  const primarySocio = socios.length > 0 ? socios[0].nome : franqueado.responsavel || '—'

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
              Editar Franqueado
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

            {/* Sócio Principal */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Sócio Principal
              </span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block truncate">
                {primarySocio}
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

      {/* SÓCIOS SECTION */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Quadro Societário ({socios.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Sócios e representantes vinculados a esta unidade franqueada
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={handleOpenAddSocio}
            className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            Adicionar Sócio
          </Button>
        </CardHeader>

        <CardContent className="p-5">
          {socios.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">Nenhum sócio cadastrado</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Adicione os sócios ou sócios administradores para manter o quadro societário da
                  unidade atualizado.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenAddSocio}
                className="text-xs font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Cadastrar primeiro sócio
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socios.map((socio) => (
                <div
                  key={socio.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header: Name + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">
                            {socio.nome}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500">{socio.cargo || 'Sócio'}</p>
                      </div>

                      {socio.percentual !== undefined &&
                        socio.percentual !== null &&
                        socio.percentual > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            <Percent className="w-2.5 h-2.5" />
                            {socio.percentual}%
                          </span>
                        )}
                    </div>

                    {/* Socio details */}
                    <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      {socio.cpf_cnpj && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">CPF/CNPJ:</span>
                          <span className="font-mono text-slate-800 font-medium">
                            {formatCPFOrCNPJ(socio.cpf_cnpj)}
                          </span>
                        </div>
                      )}

                      {socio.email && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">E-mail:</span>
                          <span
                            className="text-slate-800 font-medium truncate max-w-[170px]"
                            title={socio.email}
                          >
                            {socio.email}
                          </span>
                        </div>
                      )}

                      {socio.telefone && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Telefone:</span>
                          <span className="text-slate-800 font-medium">
                            {formatPhone(socio.telefone)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditSocio(socio)}
                      className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 gap-1"
                    >
                      <Pencil className="w-3 h-3 text-amber-500" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSocioToDelete(socio)
                        setDeleteSocioModalOpen(true)
                      }}
                      className="h-7 px-2 text-xs text-slate-400 hover:text-red-600 gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            const expiry = contrato ? getContratoExpiryInfo(contrato) : null
            const vigenciaFormatada = contrato ? formatVigencia5Anos(contrato.data_assinatura) : '—'

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
                      <StatusBadge status={getStatusExibido(contrato)} />

                      {/* Expiry Pill (apenas para contratos não-inauguração com vencimento) */}
                      {contrato.tipo !== 'Inauguração' && (
                        <>
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
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      {contrato.tipo === 'Inauguração' ? (
                        <div>
                          <span className="text-slate-400">Data de Inauguração: </span>
                          <span className="font-semibold tabular-nums text-slate-800">
                            {contrato.data_inauguracao || contrato.data_inicio
                              ? formatDateBR(contrato.data_inauguracao || contrato.data_inicio)
                              : 'Não informada'}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="text-slate-400">Vigência: </span>
                            <span
                              className={`font-semibold tabular-nums ${
                                expiry?.isExpired || expiry?.isAlert
                                  ? 'text-red-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {vigenciaFormatada}
                            </span>
                          </div>

                          {contrato.data_assinatura && (
                            <div className="text-emerald-700 flex items-center gap-1 font-medium">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Assinado em {formatDateBR(contrato.data_assinatura)}
                            </div>
                          )}

                          {doc?.data_envio && (
                            <div className="text-slate-500 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                              Enviado em {formatDateBR(doc.data_envio)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {contrato.tipo === 'Inauguração' ? (
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs gap-1.5"
                      >
                        <Link to={`/documento/${contrato.id}`}>
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {contrato.data_inauguracao || contrato.data_inicio
                            ? 'Editar Data'
                            : 'Lançar Data'}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs gap-1.5"
                      >
                        <Link to={`/documento/${contrato.id}`}>
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          {contrato.documento_assinado
                            ? 'Ver / Alterar Documento'
                            : 'Anexar Documento Assinado'}
                        </Link>
                      </Button>
                    )}

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

      {/* MODAL: Adicionar / Editar Sócio */}
      <Dialog open={socioModalOpen} onOpenChange={setSocioModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
              {editingSocio ? 'Editar Sócio' : 'Adicionar Novo Sócio'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Informe os dados do sócio vinculado à franquia{' '}
              <strong className="text-slate-800">{franqueado.nome}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSocio} className="space-y-3.5 py-2">
            {/* Nome */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Ex: Carlos Andrade"
                value={socioForm.nome}
                onChange={(e) => setSocioForm({ ...socioForm, nome: e.target.value })}
                className="text-xs h-9"
              />
              {socioFormErrors.nome && (
                <p className="text-[11px] text-red-500 font-medium">{socioFormErrors.nome}</p>
              )}
            </div>

            {/* Cargo & Percentual */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Cargo / Função</Label>
                <Input
                  type="text"
                  placeholder="Ex: Sócio Administrador"
                  value={socioForm.cargo}
                  onChange={(e) => setSocioForm({ ...socioForm, cargo: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Participação (%)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 50"
                  min={0}
                  max={100}
                  step="any"
                  value={socioForm.percentual}
                  onChange={(e) => setSocioForm({ ...socioForm, percentual: e.target.value })}
                  className="text-xs h-9"
                />
                {socioFormErrors.percentual && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {socioFormErrors.percentual}
                  </p>
                )}
              </div>
            </div>

            {/* CPF / CNPJ */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">CPF ou CNPJ</Label>
              <Input
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={socioForm.cpf_cnpj}
                onChange={(e) => setSocioForm({ ...socioForm, cpf_cnpj: e.target.value })}
                className="text-xs h-9 font-mono"
              />
            </div>

            {/* E-mail & Telefone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
                <Input
                  type="email"
                  placeholder="socio@email.com"
                  value={socioForm.email}
                  onChange={(e) => setSocioForm({ ...socioForm, email: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Telefone</Label>
                <Input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={socioForm.telefone}
                  onChange={(e) => setSocioForm({ ...socioForm, telefone: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSocioModalOpen(false)}
                disabled={savingSocio}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingSocio}
                className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
              >
                {savingSocio ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                {editingSocio ? 'Salvar Alterações' : 'Adicionar Sócio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Excluir Sócio */}
      <Dialog open={deleteSocioModalOpen} onOpenChange={setDeleteSocioModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Excluir sócio?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Tem certeza que deseja remover o sócio{' '}
              <strong className="text-slate-800">{socioToDelete?.nome}</strong> do quadro societário
              desta unidade?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteSocioModalOpen(false)}
              disabled={deletingSocio}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSocio}
              disabled={deletingSocio}
              className="text-xs font-semibold"
            >
              {deletingSocio ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Excluir Sócio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
