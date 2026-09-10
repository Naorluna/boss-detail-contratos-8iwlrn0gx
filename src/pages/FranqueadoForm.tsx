import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  Save,
  X,
  Loader2,
  ArrowLeft,
  UserPlus,
  Trash2,
  User,
  Percent,
} from 'lucide-react'
import { franqueadosService, sociosService } from '@/services/dataService'
import type { Franqueado, Socio } from '@/types'
import { formatDateInput, formatPhone, formatCPFOrCNPJ } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export interface SocioDraft {
  tempId: string
  nome: string
  cpf_cnpj: string
  email: string
  telefone: string
  percentual: string
  cargo: string
}

export default function FranqueadoForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('SP')
  const [responsavel, setResponsavel] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataInauguracao, setDataInauguracao] = useState('')

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  // Sócios adicionais (armazenados localmente antes de salvar)
  const [novosSocios, setNovosSocios] = useState<SocioDraft[]>([])
  // Sócios já existentes (quando no modo edição)
  const [sociosExistentes, setSociosExistentes] = useState<Socio[]>([])
  // Modal de Adicionar Sócio
  const [socioModalOpen, setSocioModalOpen] = useState(false)
  const [socioForm, setSocioForm] = useState({
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    percentual: '',
    cargo: 'Sócio',
  })
  const [socioFormErrors, setSocioFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (isEditing && id) {
      franqueadosService
        .getById(id)
        .then((f) => {
          setNome(f.nome || '')
          setCnpj(f.cnpj || '')
          setCidade(f.cidade || '')
          setEstado(f.estado || 'SP')
          setResponsavel(f.responsavel || '')
          setEmail(f.email || '')
          setTelefone(f.telefone || '')
          setDataInauguracao(formatDateInput(f.data_inauguracao))
          // Carregar sócios já cadastrados da unidade
          return sociosService.getByFranqueado(id)
        })
        .then((sList) => {
          if (sList) {
            setSociosExistentes(sList)
          }
        })
        .catch((err) => {
          toast({
            title: 'Erro ao carregar',
            description: err?.message || 'Franqueado não encontrado.',
            variant: 'destructive',
          })
          navigate('/franqueados')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [id, isEditing])

  const validate = () => {
    const errors: { [key: string]: string } = {}
    if (!nome.trim()) {
      errors.nome = 'Nome da franquia é obrigatório'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenAddSocio = () => {
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

  const handleConfirmAddSocio = (e: React.FormEvent) => {
    e.preventDefault()
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

    const novoItem: SocioDraft = {
      tempId: Math.random().toString(36).substring(2, 9),
      nome: socioForm.nome.trim(),
      cpf_cnpj: socioForm.cpf_cnpj.trim(),
      email: socioForm.email.trim(),
      telefone: socioForm.telefone.trim(),
      cargo: socioForm.cargo.trim() || 'Sócio',
      percentual: socioForm.percentual.trim(),
    }

    setNovosSocios((prev) => [...prev, novoItem])
    setSocioModalOpen(false)
  }

  const handleRemoveNovoSocio = (tempId: string) => {
    setNovosSocios((prev) => prev.filter((s) => s.tempId !== tempId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setFieldErrors({})

    try {
      const payload: Partial<Franqueado> = {
        nome: nome.trim(),
        cnpj: cnpj.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        responsavel: responsavel.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        data_inauguracao: dataInauguracao ? new Date(dataInauguracao).toISOString() : '',
      }

      if (isEditing && id) {
        await franqueadosService.update(id, payload)

        // Criar sócios adicionais na collection socios vinculados a este franqueado
        if (novosSocios.length > 0) {
          for (const s of novosSocios) {
            await sociosService.create({
              franqueado: id,
              nome: s.nome,
              cpf_cnpj: s.cpf_cnpj,
              email: s.email,
              telefone: s.telefone,
              cargo: s.cargo,
              percentual: s.percentual ? Number(s.percentual) : 0,
            })
          }
        }

        toast({
          title: 'Franqueado atualizado',
          description: `Os dados da unidade "${nome}" foram atualizados com sucesso.`,
        })
        navigate(`/franqueados/${id}`)
      } else {
        const created = await franqueadosService.create(payload)

        // Criar sócios adicionais na collection socios vinculados ao novo franqueado
        if (novosSocios.length > 0) {
          for (const s of novosSocios) {
            await sociosService.create({
              franqueado: created.id,
              nome: s.nome,
              cpf_cnpj: s.cpf_cnpj,
              email: s.email,
              telefone: s.telefone,
              cargo: s.cargo,
              percentual: s.percentual ? Number(s.percentual) : 0,
            })
          }
        }

        toast({
          title: 'Franqueado cadastrado com sucesso!',
          description: `A unidade "${nome}" foi criada com os 3 contratos padrão configurados.`,
        })
        navigate(`/franqueados/${created.id}`)
      }
    } catch (err: any) {
      console.error('Erro ao salvar franqueado:', err)
      const data = err?.data?.data
      if (data) {
        const errs: { [key: string]: string } = {}
        Object.keys(data).forEach((key) => {
          errs[key] = data[key]?.message || 'Campo inválido'
        })
        setFieldErrors(errs)
      }
      toast({
        title: 'Erro ao salvar franqueado',
        description: err?.message || 'Por favor, revise os dados informados.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-slate-600 hover:text-slate-900 text-xs gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar
      </Button>

      <Card className="border-slate-200 bg-white shadow-xs rounded-xl">
        <CardHeader className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                {isEditing ? 'Editar Franqueado' : 'Cadastrar Novo Franqueado'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {isEditing
                  ? 'Atualize os dados cadastrais da unidade franqueada'
                  : 'Preencha os dados da unidade. Os 3 contratos serão criados automaticamente.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            {/* Nome da Franquia */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Nome da Unidade <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Ex: Boss Detail — Unidade Jardins"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
              />
              {fieldErrors.nome && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.nome}</p>
              )}
            </div>

            {/* CNPJ & Inauguração */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">CNPJ</Label>
                <Input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm font-mono"
                />
                {fieldErrors.cnpj && (
                  <p className="text-[11px] text-red-500 font-medium">{fieldErrors.cnpj}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Data de Inauguração</Label>
                <Input
                  type="date"
                  value={dataInauguracao}
                  onChange={(e) => setDataInauguracao(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Cidade & Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Cidade</Label>
                <Input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Estado (UF)</Label>
                <Input
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm uppercase"
                />
              </div>
            </div>

            {/* Sócio / Responsável Principal */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Nome do Sócio Principal
                </Label>
                <Input
                  type="text"
                  placeholder="Ex: Carlos Andrade"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
                />
              </div>

              {/* Botão para acrescentar novo sócio */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-slate-500">
                  Cadastre outros sócios diretamente aqui ou na página de detalhe da unidade.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddSocio}
                  className="border-amber-400/60 bg-amber-50/50 hover:bg-amber-100 text-amber-900 text-xs font-semibold gap-1.5 self-start sm:self-auto h-8 shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                  Adicionar Sócio
                </Button>
              </div>

              {/* Lista de sócios já existentes (no modo edição) */}
              {isEditing && sociosExistentes.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Sócios já vinculados ({sociosExistentes.length})
                  </span>
                  <div className="space-y-1.5">
                    {sociosExistentes.map((socio) => (
                      <div
                        key={socio.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-800">{socio.nome}</span>
                            <span className="text-slate-500 ml-2">({socio.cargo || 'Sócio'})</span>
                            {socio.telefone && (
                              <span className="text-slate-400 ml-2 font-mono text-[11px]">
                                {formatPhone(socio.telefone)}
                              </span>
                            )}
                            {socio.email && (
                              <span className="text-slate-400 ml-2 text-[11px]">
                                • {socio.email}
                              </span>
                            )}
                          </div>
                        </div>
                        {socio.percentual !== undefined &&
                          socio.percentual !== null &&
                          socio.percentual > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 ml-2">
                              <Percent className="w-2.5 h-2.5" />
                              {socio.percentual}%
                            </span>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de novos sócios a serem incluídos */}
              {novosSocios.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                    Novos sócios a adicionar ({novosSocios.length})
                  </span>
                  <div className="space-y-2">
                    {novosSocios.map((s) => (
                      <div
                        key={s.tempId}
                        className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">{s.nome}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                              {s.cargo}
                            </span>
                            {s.percentual && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                <Percent className="w-2.5 h-2.5" />
                                {s.percentual}%
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            {s.telefone && <span>Tel: {formatPhone(s.telefone)}</span>}
                            {s.email && <span>E-mail: {s.email}</span>}
                            {s.cpf_cnpj && <span>Doc: {formatCPFOrCNPJ(s.cpf_cnpj)}</span>}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveNovoSocio(s.tempId)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 shrink-0"
                          title="Remover sócio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* E-mail & Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">E-mail de Contato</Label>
                <Input
                  type="email"
                  placeholder="franquia@bossdetail.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Telefone / WhatsApp</Label>
                <Input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="text-xs"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-amber-400" />
              )}
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Franqueado'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Modal: Adicionar Sócio no Formulário */}
      <Dialog open={socioModalOpen} onOpenChange={setSocioModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
              Adicionar Novo Sócio
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Informe os dados do sócio e seus respectivos contatos para inclusão na unidade.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmAddSocio} className="space-y-3.5 py-2">
            {/* Nome */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Ex: Maria Clara Silva"
                value={socioForm.nome}
                onChange={(e) => setSocioForm({ ...socioForm, nome: e.target.value })}
                className="text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-amber-400"
                autoFocus
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
                  placeholder="Ex: Sócio Operador"
                  value={socioForm.cargo}
                  onChange={(e) => setSocioForm({ ...socioForm, cargo: e.target.value })}
                  className="text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-amber-400"
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
                  className="text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-amber-400"
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
                className="text-xs h-9 font-mono bg-slate-50 border-slate-200 focus-visible:ring-amber-400"
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
                  className="text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Telefone / WhatsApp</Label>
                <Input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={socioForm.telefone}
                  onChange={(e) => setSocioForm({ ...socioForm, telefone: e.target.value })}
                  className="text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-amber-400"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSocioModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold shadow-xs gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                Adicionar Sócio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
