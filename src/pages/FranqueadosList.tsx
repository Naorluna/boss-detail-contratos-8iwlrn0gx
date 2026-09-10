import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  PlusCircle,
  Search,
  Building2,
  MapPin,
  User,
  Calendar,
  Pencil,
  Trash2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { franqueadosService, contratosService } from '@/services/dataService'
import type { Franqueado, Contrato } from '@/types'
import { getContratoExpiryInfo, getVigenciaFimDate } from '@/types'
import { formatDateBR, formatCNPJ } from '@/lib/formatters'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export default function FranqueadosList() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [franqueados, setFranqueados] = useState<Franqueado[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedFranqueado, setSelectedFranqueado] = useState<Franqueado | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    try {
      const [fData, cData] = await Promise.all([
        franqueadosService.getAll(),
        contratosService.getAll(),
      ])
      setFranqueados(fData)
      setContratos(cData)
    } catch (err) {
      console.error('Erro ao buscar franqueados:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useRealtime<Franqueado>('franqueados', () => {
    fetchData()
  })

  useRealtime<Contrato>('contratos', () => {
    fetchData()
  })

  // Group contracts by franchisee
  const contractsMap = useMemo(() => {
    const map = new Map<string, Contrato[]>()
    contratos.forEach((c) => {
      const list = map.get(c.franqueado) || []
      list.push(c)
      map.set(c.franqueado, list)
    })
    return map
  }, [contratos])

  const filteredFranqueados = useMemo(() => {
    const s = searchTerm.toLowerCase().trim()
    if (!s) return franqueados
    return franqueados.filter(
      (f) =>
        f.nome.toLowerCase().includes(s) ||
        (f.cidade && f.cidade.toLowerCase().includes(s)) ||
        (f.responsavel && f.responsavel.toLowerCase().includes(s)) ||
        (f.cnpj && f.cnpj.includes(s)),
    )
  }, [franqueados, searchTerm])

  const handleDelete = async () => {
    if (!selectedFranqueado) return
    setDeleting(true)
    try {
      await franqueadosService.delete(selectedFranqueado.id)
      toast({
        title: 'Franqueado excluído',
        description: `A unidade "${selectedFranqueado.nome}" foi removida com sucesso.`,
      })
      setDeleteModalOpen(false)
      setSelectedFranqueado(null)
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Não foi possível excluir o franqueado.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Rede de Franqueados</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie todas as unidades da Boss Detail e seus respectivos contratos
          </p>
        </div>

        <Button
          onClick={() => navigate('/franqueados/novo')}
          className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          Novo Franqueado
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <Input
          type="text"
          placeholder="Filtrar por nome, cidade ou sócio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="border-slate-200 p-5 space-y-4 animate-pulse">
              <div className="h-5 bg-slate-200 rounded-sm w-3/4" />
              <div className="h-4 bg-slate-100 rounded-sm w-1/2" />
              <div className="h-12 bg-slate-50 rounded-md" />
            </Card>
          ))}
        </div>
      ) : filteredFranqueados.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhum franqueado encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Nenhum resultado corresponde à sua pesquisa.'
              : 'Não há unidades franqueadas cadastradas no momento.'}
          </p>
          <Button
            onClick={() => navigate('/franqueados/novo')}
            className="bg-[#0f172a] text-white text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-amber-400" />
            Cadastrar Franqueado
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFranqueados.map((f) => {
            const fContracts = contractsMap.get(f.id) || []

            // Status counts
            const assinadosCount = fContracts.filter((c) => c.status === 'Assinado').length
            const enviadosCount = fContracts.filter((c) => c.status === 'Enviado').length
            const pendentesCount = fContracts.filter(
              (c) => c.status === 'Pendente' || c.status === 'Em Elaboração',
            ).length

            // Find next expiring contract based on data_assinatura + 5 anos
            let closestExpiry: {
              contrato: Contrato
              expiry: ReturnType<typeof getContratoExpiryInfo>
              dataFimCalculada: Date | null
            } | null = null

            fContracts.forEach((c) => {
              if (c.data_assinatura) {
                const exp = getContratoExpiryInfo(c)
                const dataFimCalculada = getVigenciaFimDate(c.data_assinatura)
                if (!closestExpiry || exp.daysRemaining < closestExpiry.expiry.daysRemaining) {
                  closestExpiry = { contrato: c, expiry: exp, dataFimCalculada }
                }
              }
            })

            return (
              <Card
                key={f.id}
                className="border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between rounded-xl overflow-hidden group"
              >
                <CardHeader className="p-5 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/franqueados/${f.id}`}
                      className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1"
                    >
                      {f.nome}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/franqueados/${f.id}/editar`)}
                        className="h-7 w-7 text-slate-400 hover:text-slate-800"
                        title="Editar franqueado"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFranqueado(f)
                          setDeleteModalOpen(true)
                        }}
                        className="h-7 w-7 text-slate-400 hover:text-red-600"
                        title="Excluir franqueado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Info badges */}
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {f.cidade ? `${f.cidade}/${f.estado || 'BR'}` : 'Cidade não informada'}
                      </span>
                    </div>

                    {f.cnpj && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        CNPJ: {formatCNPJ(f.cnpj)}
                      </div>
                    )}

                    {f.responsavel && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span title="Sócio">{f.responsavel}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-5 py-3 space-y-3">
                  {/* Contract counts mini chip */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Contratos:</span>
                    <span className="font-semibold text-slate-800">
                      {assinadosCount} assinado{assinadosCount !== 1 && 's'} · {enviadosCount}{' '}
                      enviado
                      {enviadosCount !== 1 && 's'} · {pendentesCount} pendente
                      {pendentesCount !== 1 && 's'}
                    </span>
                  </div>

                  {/* Expiring Contract highlight */}
                  {closestExpiry ? (
                    <div
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        closestExpiry.expiry.isExpired
                          ? 'bg-red-50/80 border-red-300 text-red-900'
                          : closestExpiry.expiry.isAlert
                            ? 'bg-red-50/40 border-red-300 text-red-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Próximo a Vencer ({closestExpiry.contrato.tipo})
                        </p>
                        <p className="font-semibold tabular-nums">
                          {closestExpiry.dataFimCalculada
                            ? formatDateBR(closestExpiry.dataFimCalculada)
                            : '—'}
                        </p>
                      </div>

                      {closestExpiry.expiry.isExpired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full shadow-xs">
                          <Clock className="w-3 h-3" />
                          Vencido
                        </span>
                      ) : closestExpiry.expiry.isAlert ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          {closestExpiry.expiry.monthsRemaining}m restantes
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      Nenhuma data de vigência configurada.
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-5 pt-3 border-t border-slate-100 flex justify-end">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold text-slate-700 hover:text-amber-600 gap-1"
                  >
                    <Link to={`/franqueados/${f.id}`}>
                      Ver detalhes
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal: Delete Franqueado */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Excluir franqueado?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Tem certeza que deseja excluir a unidade{' '}
              <strong className="text-slate-800">{selectedFranqueado?.nome}</strong>? Esta ação
              removerá permanentemente todos os contratos e documentos vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-semibold"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Excluir Unidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
