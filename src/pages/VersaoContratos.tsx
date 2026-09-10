import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  FileText,
  Edit3,
  Sparkles,
  Save,
  Download,
  Share2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Info,
  RefreshCw,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { modelosContratoService, franqueadosService } from '@/services/dataService'
import type { ModeloContrato, ModeloTipo, Franqueado } from '@/types'
import { formatDateBR, formatCPFOrCNPJ, formatPhone } from '@/lib/formatters'
import { generateContractPDF } from '@/lib/pdfGenerator'

interface SubAbaConfig {
  tipo: ModeloTipo
  label: string
  subtitulo: string
  badge: string
}

const SUB_ABAS: SubAbaConfig[] = [
  {
    tipo: 'COF',
    label: 'COF',
    subtitulo: 'Circular de Oferta de Franquia (Documento Oficial Completo)',
    badge: 'Obrigatório (Lei 13.966/19)',
  },
  {
    tipo: 'Pre-Contrato',
    label: 'Pré-Contrato',
    subtitulo: 'Instrumento preliminar de reserva de praça e compromissos',
    badge: 'Preliminar',
  },
  {
    tipo: 'Contrato',
    label: 'Contrato',
    subtitulo: 'Contrato definitivo de franquia empresarial Boss Detail',
    badge: 'Definitivo (5 anos)',
  },
]

// Textos padrão / seed dos anexos editáveis da COF
const DEFAULT_ANEXO_III = `Mais Car Clube
Bandeirantes (material de limpeza)
Across By Madico (PPF)
Bluetech Window films (película)
Oitoporum (contabilidade)
Carmob (sistema de gestão)`

const DEFAULT_ANEXO_V = `Brasília – DF

Boss Detail 305 Norte CNPJ: 40.351.607/0001-30 – Endereço: Q SHCN SQN 305 BLOCO B PLL, ASA NORTE – BRASÍLIA/DF

Boss Detail 712 Norte CNPJ: 21.976.538/0001-06 – Endereço: QUADRA SHCGN CLR 712 BLOCO G LOJA 05

Boss Detail Águas Claras CNPJ: 60.475.140/0001-48 – Endereço: Rua Jerivá lote 20 Águas Claras, Brasília – DF

Boss Detail Disbrave 503 Norte CNPJ: 57.524.683/0001-01 – Endereço: SEP/Norte quadra 503, conjunto A, bloco C, Asa Norte, Brasíli – DF

Boss Detail Noroeste CNPJ: 48.951.749/0001-40 – Endereço: Quadra CRNW Bloco B, lote 1, Setor Noroeste, Brasília-DF

Boss Detail 303 Sul CNPJ: 21.895.332/0001-51 – Endereço: Quadra SEPN 707/907, Brasília-DF

Boss Detail Sudoeste CNPJ: 54.029.174/0001-06 – Endereço: Quadra Mista Sudoeste 2 Bloco A, Lote 15, Parte A - Sudoeste, Brasília - DF, 70655-775`

const DEFAULT_ANEXO_VI = `Boss Detail 716 Sul CNPJ: 46.708.680/0001-01 – Endereço: Setor SHLS 716 conjunto A Bloca A, Brasília-DF`

const DEFAULT_ANEXO_VII = `A Franqueadora esclarece que não há, atualmente, qualquer pendência judicial ou qualquer questionamento que paire sobre ela, sobre a Marca e o/ou sobre o Sistema de sua propriedade.`

export default function VersaoContratos() {
  const [activeTab, setActiveTab] = useState<ModeloTipo>('COF')
  const [modelos, setModelos] = useState<Record<ModeloTipo, ModeloContrato | null>>({
    COF: null,
    'Pre-Contrato': null,
    Contrato: null,
  })
  const [loading, setLoading] = useState(true)
  const [franqueados, setFranqueados] = useState<Franqueado[]>([])

  // Estado do Modal de Edição de Modelo
  const [editingModelo, setEditingModelo] = useState<ModeloContrato | null>(null)
  const [editTexto, setEditTexto] = useState('')
  const [editTitulo, setEditTitulo] = useState('')
  const [savingModelo, setSavingModelo] = useState(false)

  // Estado do Quadro "Gerar Novo Contrato"
  const [isGeradorOpen, setIsGeradorOpen] = useState(false)
  const [selectedFranqueadoId, setSelectedFranqueadoId] = useState<string>('')
  const [dataAssinaturaInput, setDataAssinaturaInput] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [observacoesInput, setObservacoesInput] = useState<string>('')

  // Campos específicos editáveis da COF
  const [cofDataDeclaracao, setCofDataDeclaracao] = useState<string>('')
  const [cofNomeCandidato, setCofNomeCandidato] = useState<string>('')
  const [cofRg, setCofRg] = useState<string>('')
  const [cofCpf, setCofCpf] = useState<string>('')
  const [cofEndereco, setCofEndereco] = useState<string>('')
  const [cofAnexoIiImagem, setCofAnexoIiImagem] = useState<string | null>(null)
  const [cofAnexoIiiTexto, setCofAnexoIiiTexto] = useState<string>(DEFAULT_ANEXO_III)
  const [cofAnexoVTexto, setCofAnexoVTexto] = useState<string>(DEFAULT_ANEXO_V)
  const [cofAnexoViTexto, setCofAnexoViTexto] = useState<string>(DEFAULT_ANEXO_VI)
  const [cofAnexoViiTexto, setCofAnexoViiTexto] = useState<string>(DEFAULT_ANEXO_VII)

  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<{
    filename: string
    timestamp: Date
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar dados iniciais
  const loadData = async () => {
    try {
      setLoading(true)
      const [modelosList, franqueadosList] = await Promise.all([
        modelosContratoService.getAll(),
        franqueadosService.getAll(),
      ])

      const map: Record<ModeloTipo, ModeloContrato | null> = {
        COF: null,
        'Pre-Contrato': null,
        Contrato: null,
      }

      modelosList.forEach((m) => {
        if (m.tipo === 'COF' || m.tipo === 'Pre-Contrato' || m.tipo === 'Contrato') {
          map[m.tipo] = m
        }
      })

      setModelos(map)
      setFranqueados(franqueadosList)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: err?.message || 'Não foi possível carregar os modelos de contrato.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Franqueado selecionado no gerador
  const selectedFranqueado = useMemo(() => {
    return franqueados.find((f) => f.id === selectedFranqueadoId) || null
  }, [franqueados, selectedFranqueadoId])

  // Formatação por extenso de data para a Declaração de Recebimento
  const formatDataDeclaracaoExtenso = (dateStr?: string): string => {
    const d = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date()
    const dia = String(d.getDate()).padStart(2, '0')
    const meses = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ]
    const mes = meses[d.getMonth()]
    const ano = d.getFullYear()
    return `${dia} de ${mes} de ${ano}`
  }

  // Ao selecionar um franqueado, autopreencher os campos da COF caso ainda não editados
  useEffect(() => {
    if (selectedFranqueado) {
      setCofNomeCandidato(
        (prev) => prev || selectedFranqueado.responsavel || selectedFranqueado.nome,
      )
      setCofCpf(
        (prev) => prev || (selectedFranqueado.cnpj ? formatCPFOrCNPJ(selectedFranqueado.cnpj) : ''),
      )
      setCofEndereco(
        (prev) =>
          prev ||
          (selectedFranqueado.cidade
            ? `${selectedFranqueado.cidade} - ${selectedFranqueado.estado || 'DF'}`
            : ''),
      )
      setCofDataDeclaracao((prev) => prev || formatDataDeclaracaoExtenso(dataAssinaturaInput))
    }
  }, [selectedFranqueado, dataAssinaturaInput])

  // Lidar com upload de imagem para o Anexo II
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem PNG, JPG ou JPEG.',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCofAnexoIiImagem(reader.result as string)
      toast({
        title: 'Imagem anexada!',
        description: 'A imagem dos Balanços (Anexo II) foi carregada com sucesso.',
      })
    }
    reader.readAsDataURL(file)
  }

  // Substituição de variáveis no texto do modelo
  const replacePlaceholders = (templateText: string): string => {
    const hoje = new Date()
    const dataHojeFormatada = formatDateBR(hoje)
    const dataAssinaturaFormatada = dataAssinaturaInput
      ? formatDateBR(dataAssinaturaInput)
      : dataHojeFormatada

    const dataDeclaracaoResolvida =
      cofDataDeclaracao.trim() || formatDataDeclaracaoExtenso(dataAssinaturaInput)

    const nomeCandidatoResolvido =
      cofNomeCandidato.trim() ||
      selectedFranqueado?.responsavel ||
      selectedFranqueado?.nome ||
      '______________________________'

    const rgResolvido = cofRg.trim() || '____________________'
    const cpfResolvido =
      cofCpf.trim() ||
      (selectedFranqueado?.cnpj ? formatCPFOrCNPJ(selectedFranqueado.cnpj) : '____________________')

    const enderecoResolvido =
      cofEndereco.trim() ||
      (selectedFranqueado?.cidade
        ? `${selectedFranqueado.cidade} - ${selectedFranqueado.estado || 'DF'}`
        : '__________________________________________________')

    const replacements: Record<string, string> = {
      // Campos comuns existentes
      '{{nome_franqueado}}': selectedFranqueado?.nome || '[NOME DO FRANQUEADO]',
      '{{cnpj}}': selectedFranqueado?.cnpj
        ? formatCPFOrCNPJ(selectedFranqueado.cnpj)
        : '[CNPJ/CPF DO FRANQUEADO]',
      '{{cidade}}': selectedFranqueado?.cidade || '[CIDADE]',
      '{{estado}}': selectedFranqueado?.estado || '[ESTADO]',
      '{{responsavel}}': selectedFranqueado?.responsavel || '[NOME DO RESPONSÁVEL]',
      '{{telefone}}': selectedFranqueado?.telefone
        ? formatPhone(selectedFranqueado.telefone)
        : '[TELEFONE]',
      '{{email}}': selectedFranqueado?.email || '[E-MAIL]',
      '{{data_assinatura}}': dataAssinaturaFormatada,
      '{{data_hoje}}': dataHojeFormatada,
      '{{observacoes}}': observacoesInput.trim()
        ? observacoesInput.trim()
        : 'Nenhuma observação ou condição complementar registrada.',

      // Campos específicos da COF
      '{{data_declaracao}}': dataDeclaracaoResolvida,
      '{{nome_candidato}}': nomeCandidatoResolvido,
      '{{rg}}': rgResolvido,
      '{{cpf}}': cpfResolvido,
      '{{endereco}}': enderecoResolvido,
      '{{anexo_iii_texto}}': cofAnexoIiiTexto.trim() || DEFAULT_ANEXO_III,
      '{{anexo_v_texto}}': cofAnexoVTexto.trim() || DEFAULT_ANEXO_V,
      '{{anexo_vi_texto}}': cofAnexoViTexto.trim() || DEFAULT_ANEXO_VI,
      '{{anexo_vii_texto}}': cofAnexoViiTexto.trim() || DEFAULT_ANEXO_VII,
    }

    let result = templateText
    Object.entries(replacements).forEach(([token, val]) => {
      result = result.split(token).join(val)
    })

    return result
  }

  // Texto atual com placeholders substituídos
  const modeloAtual = modelos[activeTab]
  const textoPrevisualizado = useMemo(() => {
    if (!modeloAtual?.texto) return ''
    return replacePlaceholders(modeloAtual.texto)
  }, [
    modeloAtual?.texto,
    selectedFranqueado,
    dataAssinaturaInput,
    observacoesInput,
    cofDataDeclaracao,
    cofNomeCandidato,
    cofRg,
    cofCpf,
    cofEndereco,
    cofAnexoIiiTexto,
    cofAnexoVTexto,
    cofAnexoViTexto,
    cofAnexoViiTexto,
  ])

  // Abrir modal de edição do modelo da aba atual
  const handleOpenEditModelo = () => {
    if (!modeloAtual) return
    setEditingModelo(modeloAtual)
    setEditTexto(modeloAtual.texto || '')
    setEditTitulo(modeloAtual.titulo || '')
  }

  // Salvar modelo editado
  const handleSaveModelo = async () => {
    if (!editingModelo) return
    try {
      setSavingModelo(true)
      const updated = await modelosContratoService.update(editingModelo.id, {
        titulo: editTitulo,
        texto: editTexto,
      })

      setModelos((prev) => ({
        ...prev,
        [updated.tipo]: updated,
      }))

      toast({
        title: 'Modelo atualizado!',
        description: `O modelo de ${updated.tipo} foi salvo no banco de dados com sucesso.`,
      })
      setEditingModelo(null)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar modelo',
        description: err?.message || 'Não foi possível persistir as alterações.',
      })
    } finally {
      setSavingModelo(false)
    }
  }

  // Abrir gerador de contrato
  const handleOpenGerador = () => {
    setIsGeradorOpen(true)
    setLastGeneratedPdf(null)
  }

  // Gerar PDF
  const handleGeneratePdf = () => {
    if (!modeloAtual) {
      toast({
        variant: 'destructive',
        title: 'Modelo não disponível',
        description: 'Não há texto cadastrado para este modelo.',
      })
      return
    }

    if (!selectedFranqueadoId) {
      toast({
        variant: 'destructive',
        title: 'Selecione um franqueado',
        description:
          'Por favor, selecione a unidade franqueada para preencher os dados do contrato.',
      })
      return
    }

    try {
      setGeneratingPdf(true)
      const subConfig = SUB_ABAS.find((s) => s.tipo === activeTab)
      const tipoLabel = subConfig?.label || activeTab
      const titulo = modeloAtual.titulo || `Contrato - ${tipoLabel}`

      const { doc, filename } = generateContractPDF({
        tipoLabel,
        titulo,
        texto: textoPrevisualizado,
        franqueadoNome: selectedFranqueado?.nome,
        anexoIiImagemDataUrl: cofAnexoIiImagem,
      })

      doc.save(filename)

      setLastGeneratedPdf({
        filename,
        timestamp: new Date(),
      })

      toast({
        title: 'PDF gerado com sucesso!',
        description: `Arquivo ${filename} baixado no seu dispositivo.`,
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Falha na renderização do PDF com jsPDF.',
      })
    } finally {
      setGeneratingPdf(false)
    }
  }

  // Enviar por WhatsApp
  const handleSendWhatsApp = () => {
    if (!selectedFranqueadoId) {
      toast({
        variant: 'destructive',
        title: 'Selecione um franqueado',
        description: 'Selecione o franqueado antes de abrir a conversa no WhatsApp.',
      })
      return
    }

    const subConfig = SUB_ABAS.find((s) => s.tipo === activeTab)
    const tipoLabel = subConfig?.label || activeTab
    const franqueadoNome = selectedFranqueado?.nome || 'sua unidade'

    const mensagem = `Olá, ${selectedFranqueado?.responsavel || franqueadoNome}! Segue o documento ${tipoLabel} da unidade ${franqueadoNome} — Boss Detail. O PDF foi gerado e baixado; por gentileza verifique e anexe-o nesta conversa para darmos seguimento.`

    let cleanPhone = (selectedFranqueado?.telefone || '').replace(/\D/g, '')
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`
    }

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`

    window.open(url, '_blank', 'noopener,noreferrer')

    toast({
      title: 'WhatsApp aberto!',
      description: 'Lembre-se de anexar o arquivo PDF gerado na conversa do WhatsApp.',
    })
  }

  const activeSubConfig = SUB_ABAS.find((s) => s.tipo === activeTab) || SUB_ABAS[0]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white">Versão dos Contratos</h1>
            <Badge
              variant="outline"
              className="border-amber-400/40 bg-amber-500/10 text-amber-300 text-xs font-semibold uppercase tracking-wider ml-1"
            >
              Modelos Oficiais
            </Badge>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Gerencie e personalize os modelos contratuais da Boss Detail. A COF (Circular de Oferta
            de Franquia) conta com texto oficial integral em conformidade com a Lei nº 13.966/2019,
            com seções e anexos editáveis na geração.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={handleOpenGerador}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4 mr-2 text-slate-950" />
            Gerar Novo Contrato
          </Button>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as ModeloTipo)}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <TabsList className="bg-slate-200/80 p-1 rounded-xl h-auto flex flex-wrap">
            {SUB_ABAS.map((tab) => (
              <TabsTrigger
                key={tab.tipo}
                value={tab.tipo}
                className="px-4 py-2 font-semibold text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                <span>{tab.label}</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-normal text-slate-500 data-[state=active]:text-amber-600">
                  • {tab.badge}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditModelo}
              disabled={loading || !modeloAtual}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Edit3 className="w-4 h-4 mr-1.5 text-amber-600" />
              Editar Modelo
            </Button>
            <Button
              size="sm"
              onClick={handleOpenGerador}
              className="bg-[#0f172a] hover:bg-slate-800 text-white font-medium"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />
              Gerar {activeSubConfig.label}
            </Button>
          </div>
        </div>

        {SUB_ABAS.map((tab) => {
          const m = modelos[tab.tipo]
          return (
            <TabsContent
              key={tab.tipo}
              value={tab.tipo}
              className="space-y-4 m-0 focus-visible:outline-none"
            >
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-slate-900">
                          {m?.titulo || tab.subtitulo}
                        </CardTitle>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-semibold text-xs border border-amber-200">
                          {tab.badge}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Sub-aba: <strong className="text-slate-700">{tab.label}</strong> •
                        Persistido na collection <code>modelos_contrato</code> • Suporta variáveis
                        no formato <code>{`{{campo}}`}</code>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenEditModelo}
                        className="text-xs h-8 border-slate-300"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Editar Texto
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleOpenGerador}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs h-8"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        Gerar Novo Contrato
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Variáveis disponíveis badge pill list */}
                  <div className="mb-4 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-amber-900">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-950">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Variáveis dinâmicas da sub-aba {tab.label}:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2 font-mono">
                      {tab.tipo === 'COF' ? (
                        <>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{data_declaracao}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{nome_candidato}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{rg}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{cpf}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{endereco}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{anexo_ii_imagem}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{anexo_iii_texto}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{anexo_v_texto}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{anexo_vi_texto}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{anexo_vii_texto}}`}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{nome_franqueado}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{cnpj}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{cidade}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{estado}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{responsavel}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{telefone}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{email}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{data_assinatura}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{data_hoje}}`}
                          </span>
                          <span className="bg-white border border-amber-300 px-2 py-0.5 rounded text-amber-800 font-medium">
                            {`{{observacoes}}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Visualizador do texto atual do modelo */}
                  <div className="relative border border-slate-200 rounded-lg bg-slate-50/50 p-5 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-12 text-slate-400 font-sans">
                        Carregando modelo...
                      </div>
                    ) : m?.texto ? (
                      m.texto
                    ) : (
                      <div className="text-center py-12 text-slate-400 font-sans">
                        Nenhum texto cadastrado para este modelo. Clique em "Editar Modelo" para
                        adicionar o conteúdo oficial.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* MODAL 1: EDITAR MODELO NO BANCO */}
      <Dialog
        open={!!editingModelo}
        onOpenChange={(open) => {
          if (!open) setEditingModelo(null)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              Editar Modelo de Contrato — {editingModelo?.tipo}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Cole ou edite o texto oficial deste contrato. Todas as alterações serão persistidas no
              banco e utilizadas ao gerar novos contratos para os franqueados.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="titulo-modelo" className="text-xs font-semibold text-slate-700">
                Título do Documento
              </Label>
              <Input
                id="titulo-modelo"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                placeholder="Ex.: Circular de Oferta de Franquia (COF)"
                className="text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="texto-modelo" className="text-xs font-semibold text-slate-700">
                  Texto do Modelo Contratual
                </Label>
                <span className="text-[11px] text-slate-500 font-normal">
                  Suporta placeholders como <code>{`{{nome_candidato}}`}</code>,{' '}
                  <code>{`{{data_declaracao}}`}</code>
                </span>
              </div>
              <Textarea
                id="texto-modelo"
                value={editTexto}
                onChange={(e) => setEditTexto(e.target.value)}
                rows={16}
                className="font-mono text-xs sm:text-sm leading-relaxed p-4 resize-y bg-slate-50"
                placeholder="Cole aqui o texto oficial do contrato..."
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingModelo(null)}
              disabled={savingModelo}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveModelo}
              disabled={savingModelo}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold gap-1.5"
            >
              <Save className="w-4 h-4" />
              {savingModelo ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: QUADRO GERAR NOVO CONTRATO COM PREENCHIMENTO AUTOMÁTICO E SEÇÕES DA COF */}
      <Dialog open={isGeradorOpen} onOpenChange={setIsGeradorOpen}>
        <DialogContent className="max-w-6xl max-h-[94vh] flex flex-col p-6">
          <DialogHeader className="border-b pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Gerar Novo Contrato — {activeSubConfig.label}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {activeTab === 'COF'
                      ? 'Preencha os dados da Declaração de Recebimento e os Anexos variáveis para gerar o documento oficial da COF.'
                      : 'Selecione o franqueado para autopreencher os dados, revise a pré-visualização ao vivo e gere o PDF com envio por WhatsApp.'}
                  </DialogDescription>
                </div>
              </div>

              <Badge className="bg-slate-900 text-amber-400 font-mono text-xs self-start sm:self-auto">
                Modelo: {activeTab}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
            {/* Coluna Esquerda: Formulário de Seleção e Informações Necessárias (5 colunas) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Card Seleção do Franqueado */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="select-franqueado"
                    className="text-xs font-bold text-slate-900 flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4 text-amber-600" />
                    Selecione o Franqueado / Candidato <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedFranqueadoId}
                    onValueChange={(val) => setSelectedFranqueadoId(val)}
                  >
                    <SelectTrigger id="select-franqueado" className="w-full text-sm">
                      <SelectValue placeholder="Escolha uma unidade franqueada..." />
                    </SelectTrigger>
                    <SelectContent>
                      {franqueados.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome} {f.cidade ? `(${f.cidade}/${f.estado || ''})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dados Autopreenchidos do Franqueado */}
                {selectedFranqueado ? (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700 font-semibold border-b border-slate-200/80 pb-1">
                      <span>Dados da Unidade Selecionada:</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-white text-emerald-700 border-emerald-300"
                      >
                        Autopreenchido
                      </Badge>
                    </div>

                    <div className="space-y-1 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">Responsável:</span>
                        <span className="truncate">
                          {selectedFranqueado.responsavel || 'Não cadastrado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">CNPJ:</span>
                        <span>{formatCPFOrCNPJ(selectedFranqueado.cnpj) || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">Praça:</span>
                        <span>
                          {selectedFranqueado.cidade || '—'} / {selectedFranqueado.estado || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">Telefone:</span>
                        <span>{formatPhone(selectedFranqueado.telefone) || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">E-mail:</span>
                        <span className="truncate">
                          {selectedFranqueado.email || 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Selecione um franqueado acima para que seus dados comerciais e cadastrais
                      sejam preenchidos automaticamente.
                    </span>
                  </div>
                )}
              </div>

              {/* Se for a aba COF, mostrar campos específicos editáveis */}
              {activeTab === 'COF' ? (
                <>
                  {/* Seção 1: Declaração de Recebimento */}
                  <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                      <Label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" />
                        Declaração de Recebimento da COF
                      </Label>
                      <Badge className="text-[10px] bg-amber-200/80 text-amber-900 font-medium">
                        Editável
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <Label
                          htmlFor="cof-data-declaracao"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Data da Declaração (Extenso)
                        </Label>
                        <Input
                          id="cof-data-declaracao"
                          value={cofDataDeclaracao}
                          onChange={(e) => setCofDataDeclaracao(e.target.value)}
                          placeholder="Ex.: 10 de setembro de 2026"
                          className="text-xs bg-white"
                        />
                        <p className="text-[10px] text-slate-500">
                          Preenche "Brasília, {`{{data_declaracao}}`}."
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="cof-nome-candidato"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Nome do Candidato
                        </Label>
                        <Input
                          id="cof-nome-candidato"
                          value={cofNomeCandidato}
                          onChange={(e) => setCofNomeCandidato(e.target.value)}
                          placeholder="Nome completo do candidato"
                          className="text-xs bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="cof-rg" className="text-xs font-semibold text-slate-700">
                            RG
                          </Label>
                          <Input
                            id="cof-rg"
                            value={cofRg}
                            onChange={(e) => setCofRg(e.target.value)}
                            placeholder="Ex.: 00.000.000-0"
                            className="text-xs bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="cof-cpf" className="text-xs font-semibold text-slate-700">
                            CPF / CNPJ
                          </Label>
                          <Input
                            id="cof-cpf"
                            value={cofCpf}
                            onChange={(e) => setCofCpf(e.target.value)}
                            placeholder="000.000.000-00"
                            className="text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="cof-endereco"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Endereço Completo
                        </Label>
                        <Input
                          id="cof-endereco"
                          value={cofEndereco}
                          onChange={(e) => setCofEndereco(e.target.value)}
                          placeholder="Rua, número, bairro, cidade - UF"
                          className="text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Anexo II (Upload da Imagem do Balanço) */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        Anexo II — Balanços (Imagem Editável)
                      </Label>
                      <Badge variant="outline" className="text-[10px]">
                        {cofAnexoIiImagem ? 'Imagem carregada' : 'Opcional'}
                      </Badge>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                    />

                    {cofAnexoIiImagem ? (
                      <div className="space-y-2">
                        <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-center max-h-36 overflow-hidden">
                          <img
                            src={cofAnexoIiImagem}
                            alt="Demonstrativo Financeiro Anexo II"
                            className="max-h-32 object-contain rounded"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs flex-1 h-7 border-slate-300"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Trocar Imagem
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setCofAnexoIiImagem(null)}
                            className="text-xs h-7 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-lg p-4 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-amber-50/40"
                      >
                        <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                        <p className="text-xs font-medium text-slate-700">
                          Clique para fazer upload da imagem do Balanço
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Formatos PNG ou JPG. Se omitido, constará espaço reservado.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Seção 3: Anexos Textuais Editáveis (III, V, VI, VII) */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
                      <Edit3 className="w-4 h-4 text-amber-600" />
                      Anexos Variáveis (III, V, VI e VII)
                    </Label>

                    {/* Anexo III */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="cof-anexo-iii"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Anexo III — Fornecedores Homologados
                      </Label>
                      <Textarea
                        id="cof-anexo-iii"
                        value={cofAnexoIiiTexto}
                        onChange={(e) => setCofAnexoIiiTexto(e.target.value)}
                        rows={3}
                        className="text-xs font-mono resize-y"
                        placeholder="Lista de fornecedores..."
                      />
                    </div>

                    {/* Anexo V */}
                    <div className="space-y-1">
                      <Label htmlFor="cof-anexo-v" className="text-xs font-semibold text-slate-700">
                        Anexo V — Relação de Unidades da Rede
                      </Label>
                      <Textarea
                        id="cof-anexo-v"
                        value={cofAnexoVTexto}
                        onChange={(e) => setCofAnexoVTexto(e.target.value)}
                        rows={4}
                        className="text-xs font-mono resize-y"
                        placeholder="Relação de unidades em operação..."
                      />
                    </div>

                    {/* Anexo VI */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="cof-anexo-vi"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Anexo VI — Unidades que Deixaram a Rede (24 meses)
                      </Label>
                      <Textarea
                        id="cof-anexo-vi"
                        value={cofAnexoViTexto}
                        onChange={(e) => setCofAnexoViTexto(e.target.value)}
                        rows={2}
                        className="text-xs font-mono resize-y"
                        placeholder="Unidades desligadas..."
                      />
                    </div>

                    {/* Anexo VII */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="cof-anexo-vii"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Anexo VII — Pendências Judiciais
                      </Label>
                      <Textarea
                        id="cof-anexo-vii"
                        value={cofAnexoViiTexto}
                        onChange={(e) => setCofAnexoViiTexto(e.target.value)}
                        rows={2}
                        className="text-xs font-mono resize-y"
                        placeholder="Declaração de pendências judiciais..."
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Pré-Contrato e Contrato Definitivo (campos padrão existentes) */
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="data-assinatura-input"
                      className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4 text-slate-500" />
                      Data da Assinatura (Opcional)
                    </Label>
                    <Input
                      id="data-assinatura-input"
                      type="date"
                      value={dataAssinaturaInput}
                      onChange={(e) => setDataAssinaturaInput(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-[11px] text-slate-500">
                      Substitui o placeholder <code>{`{{data_assinatura}}`}</code> no documento.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="observacoes-input"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Observações / Dados Complementares
                    </Label>
                    <Textarea
                      id="observacoes-input"
                      value={observacoesInput}
                      onChange={(e) => setObservacoesInput(e.target.value)}
                      rows={4}
                      placeholder="Ex.: Dados da última franquia, cláusulas especiais, condições de parcelamento ou observações da praça..."
                      className="text-xs resize-y"
                    />
                    <p className="text-[11px] text-slate-500">
                      Substitui o placeholder <code>{`{{observacoes}}`}</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* Status do PDF Gerado e Orientação WhatsApp */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-xs text-blue-900 space-y-2">
                <div className="flex items-start gap-2 font-medium">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Aviso sobre o WhatsApp:</span> O link wa.me não
                    permite anexar arquivos automaticamente por limitações da própria API do
                    WhatsApp. Ao clicar em <strong>"Gerar PDF"</strong>, o arquivo é baixado no seu
                    computador e, ao clicar em <strong>"Enviar por WhatsApp"</strong>, a conversa é
                    aberta com a mensagem preenchida para você anexar o PDF.
                  </div>
                </div>

                {lastGeneratedPdf && (
                  <div className="pt-2 border-t border-blue-200/80 flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Último PDF baixado: <strong>{lastGeneratedPdf.filename}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita: Pré-Visualização ao Vivo (7 colunas) */}
            <div className="lg:col-span-7 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Pré-Visualização ao Vivo do Documento
                </Label>
                <div className="flex items-center gap-2">
                  {cofAnexoIiImagem && activeTab === 'COF' && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-amber-700 border-amber-300 bg-amber-50"
                    >
                      + Imagem Balanços (Anexo II)
                    </Badge>
                  )}
                  <span className="text-[11px] text-slate-500 font-mono">
                    {textoPrevisualizado.length} caracteres
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-[460px] max-h-[640px] overflow-y-auto border border-slate-300 rounded-xl bg-white p-5 font-mono text-xs text-slate-800 leading-relaxed shadow-inner whitespace-pre-wrap">
                {textoPrevisualizado || (
                  <span className="text-slate-400 font-sans">
                    Nenhum conteúdo para pré-visualização.
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGeradorOpen(false)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                onClick={handleGeneratePdf}
                disabled={generatingPdf || !selectedFranqueadoId}
                className="w-full sm:w-auto bg-[#0f172a] hover:bg-slate-800 text-white font-medium gap-2"
              >
                <Download className="w-4 h-4 text-amber-400" />
                {generatingPdf ? 'Gerando PDF...' : 'Gerar PDF'}
              </Button>

              <Button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!selectedFranqueadoId}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                Enviar por WhatsApp
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
