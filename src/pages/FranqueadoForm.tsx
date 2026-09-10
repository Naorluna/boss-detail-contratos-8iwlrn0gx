import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Building2, Save, X, Loader2, ArrowLeft } from 'lucide-react'
import { franqueadosService } from '@/services/dataService'
import type { Franqueado } from '@/types'
import { formatDateInput } from '@/lib/formatters'
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
import { useToast } from '@/hooks/use-toast'

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
        toast({
          title: 'Franqueado atualizado',
          description: `Os dados da unidade "${nome}" foram atualizados com sucesso.`,
        })
        navigate(`/franqueados/${id}`)
      } else {
        const created = await franqueadosService.create(payload)
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
              <p className="text-[11px] text-slate-400">
                Outros sócios podem ser adicionados diretamente na página de detalhe da unidade.
              </p>
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
    </div>
  )
}
