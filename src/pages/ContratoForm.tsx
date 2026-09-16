import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Save, X, Loader2, ArrowLeft, CheckSquare } from 'lucide-react'
import { franqueadosService, contratosService } from '@/services/dataService'
import type { Franqueado, ContractType, ContractStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

export default function ContratoForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  const defaultFranqueadoId = searchParams.get('franqueado') || ''
  const defaultTipo = (searchParams.get('tipo') as ContractType) || 'Contrato'

  const [franqueados, setFranqueados] = useState<Franqueado[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [franqueadoId, setFranqueadoId] = useState<string>(defaultFranqueadoId)
  const [tipo, setTipo] = useState<ContractType>(defaultTipo)
  const [status, setStatus] = useState<ContractStatus>('Pendente')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [createDocWithTemplate, setCreateDocWithTemplate] = useState(true)

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    franqueadosService
      .getAll()
      .then((list) => {
        setFranqueados(list)
        if (!franqueadoId && list.length > 0) {
          setFranqueadoId(list[0].id)
        }
      })
      .catch((err) => {
        console.error('Erro ao listar franqueados:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const validate = () => {
    const errors: { [key: string]: string } = {}
    if (!franqueadoId) {
      errors.franqueado = 'Selecione uma unidade franqueada'
    }
    if (!tipo) {
      errors.tipo = 'Selecione o tipo de contrato'
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
      const created = await contratosService.create({
        franqueado: franqueadoId,
        tipo,
        status,
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : null,
        data_fim: dataFim ? new Date(dataFim).toISOString() : null,
        createDocWithTemplate,
      })

      toast({
        title: 'Contrato criado com sucesso!',
        description: `Contrato de "${tipo}" vinculado à franquia.`,
      })

      if (createDocWithTemplate) {
        navigate(`/documento/${created.id}`)
      } else {
        navigate(`/franqueados/${franqueadoId}`)
      }
    } catch (err: any) {
      console.error('Erro ao criar contrato:', err)
      toast({
        title: 'Erro ao criar contrato',
        description: err?.message || 'Verifique os campos e tente novamente.',
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Novo Contrato</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Cadastre um novo contrato e configure os prazos de vigência
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            {/* Franqueado Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Franqueado <span className="text-red-500">*</span>
              </Label>
              <Select value={franqueadoId} onValueChange={setFranqueadoId}>
                <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-amber-400 text-sm">
                  <SelectValue placeholder="Selecione o franqueado" />
                </SelectTrigger>
                <SelectContent>
                  {franqueados.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome} ({f.cidade || 'Sem cidade'}/{f.estado || 'BR'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.franqueado && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.franqueado}</p>
              )}
            </div>

            {/* Tipo de Contrato & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Tipo de Contrato <span className="text-red-500">*</span>
                </Label>
                <Select value={tipo} onValueChange={(val: ContractType) => setTipo(val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-amber-400 text-sm">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Recebimento da COF">Recebimento da COF</SelectItem>
                    <SelectItem value="Pré-Contrato">Pré-Contrato</SelectItem>
                    <SelectItem value="Pagamento da Taxa de Franquia">
                      Pagamento da Taxa de Franquia
                    </SelectItem>
                    <SelectItem value="Busca do Ponto">Busca do Ponto</SelectItem>
                    <SelectItem value="Abertura do CNPJ">Abertura do CNPJ</SelectItem>
                    <SelectItem value="Contrato">Contrato</SelectItem>
                    <SelectItem value="Inauguração">Inauguração</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Status Inicial</Label>
                <Select value={status} onValueChange={(val: ContractStatus) => setStatus(val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-amber-400 text-sm">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Elaboração">Em Elaboração</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Assinado">Assinado</SelectItem>
                    <SelectItem value="Vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data Início & Data Fim (Validade) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Data de Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Data de Fim (Validade)
                </Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-amber-400 rounded-lg text-sm"
                />
                <p className="text-[10px] text-slate-400">
                  Contratos com validade ≤ 6 meses recebem alerta vermelho no painel.
                </p>
              </div>
            </div>

            {/* Checkbox Template Padrão */}
            <div className="pt-2 border-t border-slate-100 flex items-start space-x-2.5">
              <Checkbox
                id="templateCheckbox"
                checked={createDocWithTemplate}
                onCheckedChange={(c) => setCreateDocWithTemplate(Boolean(c))}
                className="mt-0.5 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor="templateCheckbox"
                  className="text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  Criar documento com modelo padrão
                </Label>
                <p className="text-[11px] text-slate-500">
                  Cria o registro do documento contendo os placeholders e campos de variáveis
                  prontos para preenchimento.
                </p>
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
              Salvar Contrato
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
