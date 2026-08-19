import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Save,
  Send,
  CheckCircle2,
  Trash2,
  Eye,
  Edit3,
  Sparkles,
  Info,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { contratosService, documentosService } from '@/services/dataService'
import type { Contrato, Documento, Franqueado } from '@/types'
import { STANDARD_DOCUMENT_TEMPLATE, computeContractExpiry } from '@/types'
import { formatDateBR, formatCNPJ, formatPhone } from '@/lib/formatters'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

export default function DocumentoEditor() {
  const { contratoId } = useParams<{ contratoId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [signing, setSigning] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [franqueado, setFranqueado] = useState<Franqueado | null>(null)
  const [documento, setDocumento] = useState<Documento | null>(null)

  // Editor states
  const [templateContent, setTemplateContent] = useState(STANDARD_DOCUMENT_TEMPLATE)
  const [manualVariables, setManualVariables] = useState<{ [key: string]: string }>({
    ultima_franquia_nome: '',
    ultima_franquia_cnpj: '',
    ultima_franquia_cidade: '',
    ultima_franquia_estado: '',
    ultima_franquia_periodo: '',
  })
  const [previewMode, setPreviewMode] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchData = async () => {
    if (!contratoId) return
    try {
      const c = await contratosService.getById(contratoId)
      setContrato(c)
      setFranqueado(c.expand?.franqueado || null)

      let doc = await documentosService.getByContrato(contratoId)
      if (!doc) {
        // Auto-create doc if none exists
        doc = await documentosService.create(contratoId, STANDARD_DOCUMENT_TEMPLATE, {})
      }

      setDocumento(doc)
      setTemplateContent(doc.conteudo || STANDARD_DOCUMENT_TEMPLATE)
      if (doc.variaveis) {
        setManualVariables((prev) => ({
          ...prev,
          ...doc?.variaveis,
        }))
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar documento',
        description: err?.message || 'Contrato não encontrado.',
        variant: 'destructive',
      })
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [contratoId])

  // Today formatted
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date())
  }, [])

  // Combined variables map for replacement & display
  const allVariables = useMemo(() => {
    return {
      franqueado_nome: franqueado?.nome || '',
      franqueado_cnpj: franqueado?.cnpj ? formatCNPJ(franqueado.cnpj) : '',
      franqueado_cidade: franqueado?.cidade || '',
      franqueado_estado: franqueado?.estado || '',
      franqueado_responsavel: franqueado?.responsavel || '',
      franqueado_email: franqueado?.email || '',
      franqueado_telefone: franqueado?.telefone ? formatPhone(franqueado.telefone) : '',

      contrato_tipo: contrato?.tipo || '',
      contrato_inicio: contrato?.data_inicio ? formatDateBR(contrato.data_inicio) : 'A definir',
      contrato_fim: contrato?.data_fim ? formatDateBR(contrato.data_fim) : 'A definir',
      data_hoje: todayFormatted,

      ultima_franquia_nome: manualVariables.ultima_franquia_nome || '',
      ultima_franquia_cnpj: manualVariables.ultima_franquia_cnpj || '',
      ultima_franquia_cidade: manualVariables.ultima_franquia_cidade || '',
      ultima_franquia_estado: manualVariables.ultima_franquia_estado || '',
      ultima_franquia_periodo: manualVariables.ultima_franquia_periodo || '',
    }
  }, [franqueado, contrato, manualVariables, todayFormatted])

  // Chips available for insertion
  const availableChips = [
    { label: 'Nome Franqueado', tag: '{{franqueado_nome}}' },
    { label: 'CNPJ Franqueado', tag: '{{franqueado_cnpj}}' },
    { label: 'Cidade Franqueado', tag: '{{franqueado_cidade}}' },
    { label: 'Estado Franqueado', tag: '{{franqueado_estado}}' },
    { label: 'Responsável', tag: '{{franqueado_responsavel}}' },
    { label: 'Início Contrato', tag: '{{contrato_inicio}}' },
    { label: 'Fim Contrato', tag: '{{contrato_fim}}' },
    { label: 'Última Franquia Nome', tag: '{{ultima_franquia_nome}}' },
    { label: 'Última Franquia CNPJ', tag: '{{ultima_franquia_cnpj}}' },
    { label: 'Última Franquia Cidade', tag: '{{ultima_franquia_cidade}}' },
    { label: 'Última Franquia Estado', tag: '{{ultima_franquia_estado}}' },
    { label: 'Última Franquia Período', tag: '{{ultima_franquia_periodo}}' },
    { label: 'Data Hoje', tag: '{{data_hoje}}' },
  ]

  const insertTagAtCursor = (tag: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = templateContent
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const updated = before + tag + after
    setTemplateContent(updated)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }

  // Render preview replacing {{tag}} with real values
  const renderedPreviewParts = useMemo(() => {
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g
    const parts: { text: string; isMissing?: boolean; isReplaced?: boolean; key?: string }[] = []
    let lastIndex = 0
    let match

    while ((match = regex.exec(templateContent)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push({ text: templateContent.substring(lastIndex, match.index) })
      }

      const key = match[1]
      const val = (allVariables as any)[key]

      if (val && val.trim() !== '') {
        parts.push({ text: val, isReplaced: true, key })
      } else {
        parts.push({ text: `{{${key}}}`, isMissing: true, key })
      }

      lastIndex = regex.lastIndex
    }

    if (lastIndex < templateContent.length) {
      parts.push({ text: templateContent.substring(lastIndex) })
    }

    return parts
  }, [templateContent, allVariables])

  // Save Draft action
  const handleSaveDraft = async () => {
    if (!documento) return
    setSaving(true)
    try {
      await documentosService.update(documento.id, {
        conteudo: templateContent,
        variaveis: manualVariables,
      })
      toast({
        title: 'Rascunho salvo',
        description: 'Conteúdo e dados manuais foram atualizados com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Falha ao salvar rascunho.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Mark as Sent
  const handleMarkAsSent = async () => {
    if (!documento || !contrato) return
    setSending(true)
    try {
      const todayISO = new Date().toISOString()
      await documentosService.update(documento.id, {
        conteudo: templateContent,
        variaveis: manualVariables,
        data_envio: todayISO,
      })

      const updatedContract = await contratosService.update(contrato.id, {
        status: 'Enviado',
      })
      setContrato(updatedContract)

      toast({
        title: 'Documento enviado com sucesso',
        description: 'O status do contrato foi atualizado para "Enviado".',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar',
        description: err?.message || 'Falha ao atualizar status.',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  // Mark as Signed
  const handleMarkAsSigned = async () => {
    if (!documento || !contrato) return
    setSigning(true)
    try {
      await documentosService.update(documento.id, {
        conteudo: templateContent,
        variaveis: manualVariables,
      })

      const updatedContract = await contratosService.update(contrato.id, {
        status: 'Assinado',
        data_inicio: contrato.data_inicio || new Date().toISOString(),
      })
      setContrato(updatedContract)

      toast({
        title: 'Contrato assinado!',
        description: 'O contrato foi marcado como "Assinado" com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao assinar',
        description: err?.message || 'Falha ao atualizar status.',
        variant: 'destructive',
      })
    } finally {
      setSigning(false)
    }
  }

  // Delete document (keeps contract)
  const handleDeleteDocument = async () => {
    if (!documento) return
    setDeleting(true)
    try {
      await documentosService.delete(documento.id)
      toast({
        title: 'Documento excluído',
        description: 'O documento foi removido. O contrato continua registrado.',
      })
      setDeleteModalOpen(false)
      navigate(`/franqueados/${contrato?.franqueado}`)
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir documento',
        description: err?.message || 'Falha ao remover o documento.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleClearManual = () => {
    setManualVariables({
      ultima_franquia_nome: '',
      ultima_franquia_cnpj: '',
      ultima_franquia_cidade: '',
      ultima_franquia_estado: '',
      ultima_franquia_periodo: '',
    })
    toast({
      title: 'Dados manuais limpos',
      description: 'Campos de última franquia foram redefinidos.',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!contrato || !franqueado) return null

  const expiry = computeContractExpiry(contrato.data_fim, contrato.status)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <button
              onClick={() => navigate('/')}
              className="hover:text-slate-900 transition-colors"
            >
              Dashboard
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(`/franqueados/${franqueado.id}`)}
              className="hover:text-slate-900 transition-colors"
            >
              {franqueado.nome}
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{contrato.tipo}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {contrato.tipo} — {franqueado.nome}
            </h2>
            <StatusBadge status={contrato.status} />

            {expiry.isExpired ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-red-600 px-2.5 py-0.5 rounded-full shadow-xs">
                <Clock className="w-3.5 h-3.5" />
                Vencido
              </span>
            ) : expiry.isAlert ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Faltam {expiry.monthsRemaining} meses para o vencimento
              </span>
            ) : null}
          </div>

          <p className="text-xs text-slate-500">
            Vigência:{' '}
            <span className="font-semibold text-slate-700">
              {contrato.data_inicio ? formatDateBR(contrato.data_inicio) : '—'} a{' '}
              {contrato.data_fim ? formatDateBR(contrato.data_fim) : '—'}
            </span>
          </p>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-xs text-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Voltar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={saving || sending || signing}
            className="text-xs font-semibold gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar Rascunho
          </Button>

          <Button
            size="sm"
            onClick={handleMarkAsSent}
            disabled={saving || sending || signing || contrato.status === 'Assinado'}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Marcar como Enviado
          </Button>

          <Button
            size="sm"
            onClick={handleMarkAsSigned}
            disabled={saving || sending || signing || contrato.status === 'Assinado'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            {signing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Marcar como Assinado
          </Button>

          {documento && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteModalOpen(true)}
              className="text-slate-400 hover:text-red-600 h-9 w-9"
              title="Excluir documento"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* TWO COLUMNS LAYOUT: Editor Left / Variables Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Editor & Variable Chips (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Conteúdo do Documento
                </CardTitle>
              </div>

              {/* Toggle Preview Button */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    !previewMode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar Template
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    previewMode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Pré-visualizar
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {!previewMode ? (
                <>
                  {/* Chips for insertion */}
                  <div>
                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                      Inserir Variáveis no Cursor:
                    </Label>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      {availableChips.map((chip) => (
                        <button
                          key={chip.tag}
                          type="button"
                          onClick={() => insertTagAtCursor(chip.tag)}
                          className="px-2 py-1 rounded-md bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 text-[11px] font-semibold text-slate-700 hover:text-amber-800 transition-colors shadow-xs"
                        >
                          + {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea Editor */}
                  <div className="space-y-1">
                    <Textarea
                      ref={textareaRef}
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      rows={18}
                      className="font-mono text-xs bg-slate-900 text-slate-100 border-slate-800 rounded-lg focus-visible:ring-amber-400 leading-relaxed resize-y p-3.5"
                      placeholder="Escreva o template do contrato..."
                    />
                    <p className="text-[11px] text-slate-400">
                      Use{' '}
                      <span className="font-mono text-amber-600 font-bold">{`{{nome_da_variavel}}`}</span>{' '}
                      para definir os campos que serão mesclados dinamicamente.
                    </p>
                  </div>
                </>
              ) : (
                /* Rendered Preview */
                <div className="space-y-3">
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Modo de Pré-visualização:</strong> Placeholders preenchidos aparecem
                      em destaque. Placeholders em{' '}
                      <span className="text-red-600 font-bold">vermelho</span> indicam que o campo
                      ainda está vazio na coluna lateral.
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-200 rounded-lg font-serif text-sm leading-relaxed text-slate-800 whitespace-pre-wrap shadow-inner min-h-[400px]">
                    {renderedPreviewParts.map((part, index) => {
                      if (part.isMissing) {
                        return (
                          <span
                            key={index}
                            className="bg-red-100 text-red-700 px-1 py-0.5 rounded font-mono font-bold text-xs border border-red-300"
                            title="Campo não preenchido"
                          >
                            {part.text}
                          </span>
                        )
                      }
                      if (part.isReplaced) {
                        return (
                          <span
                            key={index}
                            className="bg-amber-100/70 text-slate-950 font-semibold px-1 rounded underline decoration-amber-400"
                          >
                            {part.text}
                          </span>
                        )
                      }
                      return <span key={index}>{part.text}</span>
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Variables to Fill (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 bg-white shadow-xs rounded-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Dados para Preenchimento</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Os dados preenchidos aqui substituem os placeholders no texto do contrato.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-5">
              {/* Grupo 1: Dados da Última Franquia (EDITÁVEL & SALVO EM VARIAVEIS) */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Dados da Última Franquia (Manual)
                  </span>
                  <button
                    type="button"
                    onClick={handleClearManual}
                    className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpar
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">
                      Nome da Franquia Anterior
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ex: AutoClean Jardins"
                      value={manualVariables.ultima_franquia_nome || ''}
                      onChange={(e) =>
                        setManualVariables((v) => ({ ...v, ultima_franquia_nome: e.target.value }))
                      }
                      className="bg-white border-amber-200 text-xs h-8 focus-visible:ring-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">
                      CNPJ da Franquia Anterior
                    </Label>
                    <Input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={manualVariables.ultima_franquia_cnpj || ''}
                      onChange={(e) =>
                        setManualVariables((v) => ({ ...v, ultima_franquia_cnpj: e.target.value }))
                      }
                      className="bg-white border-amber-200 text-xs h-8 font-mono focus-visible:ring-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">Cidade</Label>
                      <Input
                        type="text"
                        placeholder="Ex: São Paulo"
                        value={manualVariables.ultima_franquia_cidade || ''}
                        onChange={(e) =>
                          setManualVariables((v) => ({
                            ...v,
                            ultima_franquia_cidade: e.target.value,
                          }))
                        }
                        className="bg-white border-amber-200 text-xs h-8 focus-visible:ring-amber-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700">UF</Label>
                      <Input
                        type="text"
                        placeholder="SP"
                        maxLength={2}
                        value={manualVariables.ultima_franquia_estado || ''}
                        onChange={(e) =>
                          setManualVariables((v) => ({
                            ...v,
                            ultima_franquia_estado: e.target.value.toUpperCase(),
                          }))
                        }
                        className="bg-white border-amber-200 text-xs h-8 uppercase focus-visible:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">
                      Período de Atuação
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ex: 2021 a 2023"
                      value={manualVariables.ultima_franquia_periodo || ''}
                      onChange={(e) =>
                        setManualVariables((v) => ({
                          ...v,
                          ultima_franquia_periodo: e.target.value,
                        }))
                      }
                      className="bg-white border-amber-200 text-xs h-8 focus-visible:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Grupo 2: Dados do Franqueado (READ-ONLY) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Dados do Franqueado (Sincronizado)
                </span>

                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-400">Nome:</span>
                    <span className="font-semibold text-slate-900">{franqueado.nome}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-400">CNPJ:</span>
                    <span className="font-mono text-slate-800">
                      {franqueado.cnpj ? formatCNPJ(franqueado.cnpj) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-400">Localização:</span>
                    <span className="text-slate-800">
                      {franqueado.cidade ? `${franqueado.cidade}/${franqueado.estado}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-400">Responsável:</span>
                    <span className="text-slate-800">{franqueado.responsavel || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">E-mail:</span>
                    <span className="text-slate-800 truncate max-w-[180px]">
                      {franqueado.email || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grupo 3: Dados do Contrato (READ-ONLY) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Dados do Contrato
                </span>

                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-400">Tipo:</span>
                    <span className="font-semibold text-slate-900">{contrato.tipo}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-400">Início:</span>
                    <span className="tabular-nums">
                      {contrato.data_inicio ? formatDateBR(contrato.data_inicio) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="text-slate-400">Fim (Validade):</span>
                    <span className="tabular-nums font-semibold text-slate-900">
                      {contrato.data_fim ? formatDateBR(contrato.data_fim) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data de Emissão:</span>
                    <span className="tabular-nums text-slate-800">{todayFormatted}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Document Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Excluir modelo de documento?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Esta ação removerá o texto do template e as variáveis preenchidas para este contrato.
              O registro do contrato não será excluído.
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
              onClick={handleDeleteDocument}
              disabled={deleting}
              className="text-xs font-semibold"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Excluir Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
