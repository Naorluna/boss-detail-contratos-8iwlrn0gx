import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  PlusCircle,
  MoreVertical,
  ExternalLink,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Layers,
} from 'lucide-react'
import { franqueadosService, contratosService } from '@/services/dataService'
import type { Franqueado, Contrato, ContractType, ContractStatus } from '@/types'
import { computeContractExpiry } from '@/types'
import { formatDateBR } from '@/lib/formatters'
import { ContractCell } from '@/components/ContractCell'
import { StatusBadge } from '@/components/StatusBadge'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Index() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [franqueados, setFranqueados] = useState<Franqueado[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & View Mode
  const viewMode = searchParams.get('view') === 'contratos' ? 'contratos' : 'franqueados'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const fetchData = async () => {
    try {
      const [fData, cData] = await Promise.all([
        franqueadosService.getAll(),
        contratosService.getAll(),
      ])
      setFranqueados(fData)
      setContratos(cData)
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Real-time subscriptions for real-time updates
  useRealtime<Franqueado>('franqueados', () => {
    fetchData()
  })

  useRealtime<Contrato>('contratos', () => {
    fetchData()
  })

  // Map contracts by franchisee ID
  const contractsByFranqueado = useMemo(() => {
    const map = new Map<string, { [key in ContractType]?: Contrato }>()
    contratos.forEach((c) => {
      if (!map.has(c.franqueado)) {
        map.set(c.franqueado, {})
      }
      const existing = map.get(c.franqueado)!
      existing[c.tipo] = c
    })
    return map
  }, [contratos])

  // Stat metrics computation
  const stats = useMemo(() => {
    const totalFranqueados = franqueados.length
    const assinados = contratos.filter((c) => c.status === 'Assinado').length

    let aVencerCount = 0
    let vencidosCount = 0

    contratos.forEach((c) => {
      const expiry = computeContractExpiry(c.data_fim, c.status)
      if (expiry.isExpired) {
        vencidosCount++
      } else if (expiry.isAlert) {
        aVencerCount++
      }
    })

    return {
      totalFranqueados,
      assinados,
      aVencerCount,
      vencidosCount,
    }
  }, [franqueados, contratos])

  // Filtered rows for Franqueados View
  const filteredFranqueados = useMemo(() => {
    return franqueados.filter((f) => {
      // Search
      const search = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !search ||
        f.nome.toLowerCase().includes(search) ||
        (f.cidade && f.cidade.toLowerCase().includes(search)) ||
        (f.responsavel && f.responsavel.toLowerCase().includes(search)) ||
        (f.cnpj && f.cnpj.includes(search))

      if (!matchesSearch) return false

      // Status Filter across contracts of this franchisee
      const fContracts = contratos.filter((c) => c.franqueado === f.id)

      if (statusFilter !== 'todos') {
        const hasStatus = fContracts.some((c) => {
          if (statusFilter === 'Vencido') {
            const expiry = computeContractExpiry(c.data_fim, c.status)
            return expiry.isExpired
          }
          return c.status === statusFilter
        })
        if (!hasStatus) return false
      }

      // Tipo Filter
      if (tipoFilter !== 'todos') {
        const hasTipo = fContracts.some((c) => c.tipo === tipoFilter)
        if (!hasTipo) return false
      }

      return true
    })
  }, [franqueados, contratos, searchTerm, statusFilter, tipoFilter])

  // Filtered rows for Contratos View
  const filteredContratos = useMemo(() => {
    return contratos.filter((c) => {
      const franqueado = franqueados.find((f) => f.id === c.franqueado)
      const search = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !search ||
        (franqueado && franqueado.nome.toLowerCase().includes(search)) ||
        (franqueado?.cidade && franqueado.cidade.toLowerCase().includes(search)) ||
        c.tipo.toLowerCase().includes(search)

      if (!matchesSearch) return false

      if (statusFilter !== 'todos') {
        if (statusFilter === 'Vencido') {
          const expiry = computeContractExpiry(c.data_fim, c.status)
          if (!expiry.isExpired) return false
        } else if (c.status !== statusFilter) {
          return false
        }
      }

      if (tipoFilter !== 'todos' && c.tipo !== tipoFilter) {
        return false
      }

      return true
    })
  }, [contratos, franqueados, searchTerm, statusFilter, tipoFilter])

  // Pagination slice
  const paginatedFranqueados = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredFranqueados.slice(start, start + pageSize)
  }, [filteredFranqueados, currentPage])

  const paginatedContratos = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredContratos.slice(start, start + pageSize)
  }, [filteredContratos, currentPage])

  const totalPages =
    viewMode === 'franqueados'
      ? Math.max(1, Math.ceil(filteredFranqueados.length / pageSize))
      : Math.max(1, Math.ceil(filteredContratos.length / pageSize))

  const toggleViewMode = (mode: 'franqueados' | 'contratos') => {
    setCurrentPage(1)
    if (mode === 'contratos') {
      setSearchParams({ view: 'contratos' })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Franqueados */}
        <Card className="border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Franqueados Ativos
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.totalFranqueados}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Unidades cadastradas</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Contratos Assinados */}
        <Card className="border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Contratos Assinados
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1 tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.assinados}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Vigentes e regularizados</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* A Vencer <= 6 meses (Amber Alert) */}
        <Card className="border-amber-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 bg-amber-50/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                A Vencer ≤ 6 meses
              </p>
              <p className="text-3xl font-extrabold text-amber-700 mt-1 tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.aVencerCount}
              </p>
              <p className="text-[11px] text-amber-700/80 mt-0.5 font-medium">
                Requer renovação urgente
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Contratos Vencidos (Red Card) */}
        <Card className="border-red-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 bg-red-50/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                Contratos Vencidos
              </p>
              <p className="text-3xl font-extrabold text-red-600 mt-1 tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : stats.vencidosCount}
              </p>
              <p className="text-[11px] text-red-700/80 mt-0.5 font-medium">Vigência expirada</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Buscar por franqueado, cidade ou responsável..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
            />
          </div>

          {/* Filters and View mode switch */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="w-40">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Assinado">Assinado</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Em Elaboração">Em Elaboração</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo Filter */}
            <div className="w-44">
              <Select
                value={tipoFilter}
                onValueChange={(val) => {
                  setTipoFilter(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 text-xs h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Recebimento da COF">Recebimento da COF</SelectItem>
                  <SelectItem value="Pré-Contrato">Pré-Contrato</SelectItem>
                  <SelectItem value="Contrato">Contrato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => toggleViewMode('franqueados')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'franqueados'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Por Franqueado
              </button>
              <button
                type="button"
                onClick={() => toggleViewMode('contratos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'contratos'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Por Contrato
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW: VISÃO POR FRANQUEADO (DEFAULT) */}
      {viewMode === 'franqueados' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredFranqueados.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos'
                  ? 'Nenhum resultado para os filtros aplicados'
                  : 'Nenhum franqueado cadastrado'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos'
                  ? 'Tente ajustar sua busca ou limpar os filtros para visualizar outras unidades.'
                  : 'Comece adicionando a primeira unidade franqueada da Boss Detail.'}
              </p>
              <Button
                onClick={() => navigate('/franqueados/novo')}
                className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold"
              >
                <PlusCircle className="w-4 h-4 mr-1.5 text-amber-400" />
                Cadastrar primeiro franqueado
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table (>= 1024px) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 w-1/4">Franqueado</th>
                      <th className="py-3.5 px-4 w-1/4">1. Recebimento da COF</th>
                      <th className="py-3.5 px-4 w-1/4">2. Pré-Contrato</th>
                      <th className="py-3.5 px-4 w-1/4">3. Contrato Principal</th>
                      <th className="py-3.5 px-4 text-right w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedFranqueados.map((f) => {
                      const fContracts = contractsByFranqueado.get(f.id) || {}
                      const cofContract = fContracts['Recebimento da COF']
                      const preContract = fContracts['Pré-Contrato']
                      const mainContract = fContracts['Contrato']

                      return (
                        <tr key={f.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Franqueado Info */}
                          <td className="py-3.5 px-4 align-top">
                            <Link
                              to={`/franqueados/${f.id}`}
                              className="font-bold text-slate-900 text-sm hover:text-amber-600 transition-colors block"
                            >
                              {f.nome}
                            </Link>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {f.cidade ? `${f.cidade}/${f.estado || 'BR'}` : 'Local não informado'}
                            </p>
                            {f.responsavel && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Resp: <span className="text-slate-600">{f.responsavel}</span>
                              </p>
                            )}
                          </td>

                          {/* 1. Recebimento da COF */}
                          <td className="py-3.5 px-4 align-top">
                            <ContractCell
                              franqueadoId={f.id}
                              tipo="Recebimento da COF"
                              contrato={cofContract}
                            />
                          </td>

                          {/* 2. Pré-Contrato */}
                          <td className="py-3.5 px-4 align-top">
                            <ContractCell
                              franqueadoId={f.id}
                              tipo="Pré-Contrato"
                              contrato={preContract}
                            />
                          </td>

                          {/* 3. Contrato Principal */}
                          <td className="py-3.5 px-4 align-top">
                            <ContractCell
                              franqueadoId={f.id}
                              tipo="Contrato"
                              contrato={mainContract}
                            />
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right align-top">
                            <div className="flex items-center justify-end gap-1">
                              {mainContract && (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-semibold text-slate-700 hover:text-slate-900"
                                >
                                  <Link to={`/documento/${mainContract.id}`}>Gerenciar</Link>
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs">
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/franqueados/${f.id}`)}
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-2" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/contratos/novo?franqueado=${f.id}`)}
                                  >
                                    <PlusCircle className="w-3.5 h-3.5 mr-2" />
                                    Novo contrato
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/franqueados/${f.id}/editar`)}
                                  >
                                    Editar franqueado
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Stacked Cards (< 1024px) */}
              <div className="lg:hidden divide-y divide-slate-200">
                {paginatedFranqueados.map((f) => {
                  const fContracts = contractsByFranqueado.get(f.id) || {}
                  const cofContract = fContracts['Recebimento da COF']
                  const preContract = fContracts['Pré-Contrato']
                  const mainContract = fContracts['Contrato']

                  return (
                    <div key={f.id} className="p-4 space-y-3 bg-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            to={`/franqueados/${f.id}`}
                            className="font-bold text-slate-900 text-base hover:text-amber-600 block"
                          >
                            {f.nome}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {f.cidade ? `${f.cidade}/${f.estado || 'BR'}` : 'Local não informado'} •
                            Resp: {f.responsavel || '—'}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/franqueados/${f.id}`)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/contratos/novo?franqueado=${f.id}`)}
                            >
                              Novo contrato
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2 pt-1">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                            Recebimento da COF
                          </p>
                          <ContractCell
                            franqueadoId={f.id}
                            tipo="Recebimento da COF"
                            contrato={cofContract}
                          />
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                            Pré-Contrato
                          </p>
                          <ContractCell
                            franqueadoId={f.id}
                            tipo="Pré-Contrato"
                            contrato={preContract}
                          />
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                            Contrato Principal
                          </p>
                          <ContractCell
                            franqueadoId={f.id}
                            tipo="Contrato"
                            contrato={mainContract}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW: VISÃO POR CONTRATO */}
      {viewMode === 'contratos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : filteredContratos.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Nenhum contrato encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Não existem contratos correspondentes aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Franqueado</th>
                    <th className="py-3.5 px-4">Tipo de Contrato</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Vigência</th>
                    <th className="py-3.5 px-4">Alerta de Renovação</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedContratos.map((c) => {
                    const franqueado = franqueados.find((f) => f.id === c.franqueado)
                    const expiry = computeContractExpiry(c.data_fim, c.status)

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          expiry.isExpired ? 'bg-red-50/40' : expiry.isAlert ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {franqueado ? (
                            <Link
                              to={`/franqueados/${franqueado.id}`}
                              className="hover:text-amber-600 transition-colors"
                            >
                              {franqueado.nome}
                            </Link>
                          ) : (
                            '—'
                          )}
                          <p className="text-[11px] text-slate-400 font-normal">
                            {franqueado?.cidade ? `${franqueado.cidade}/${franqueado.estado}` : ''}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{c.tipo}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4 tabular-nums text-slate-700">
                          {c.data_inicio ? formatDateBR(c.data_inicio) : '—'} a{' '}
                          {c.data_fim ? formatDateBR(c.data_fim) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          {expiry.isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                              <Clock className="w-3 h-3" />
                              Contrato Vencido
                            </span>
                          ) : expiry.isAlert ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              Faltam {expiry.monthsRemaining} meses
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Regular</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold"
                          >
                            <Link to={`/documento/${c.id}`}>
                              Gerenciar
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500">
          <p>
            Página <span className="font-semibold text-slate-900">{currentPage}</span> de{' '}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs"
            >
              Próxima
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
