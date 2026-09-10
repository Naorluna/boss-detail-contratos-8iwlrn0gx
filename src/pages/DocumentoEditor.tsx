import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  FileCheck2,
  FileText,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Send,
  Loader2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react'
import { contratosService } from '@/services/dataService'
import type { Contrato, Franqueado } from '@/types'
import { computeContractExpiry } from '@/types'
import { formatDateBR } from '@/lib/formatters'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
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
  const [uploading, setUploading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [removingFile, setRemovingFile] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [franqueado, setFranqueado] = useState<Franqueado | null>(null)

  // Selected file state (before save)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    if (!contratoId) return
    try {
      const c = await contratosService.getById(contratoId)
      setContrato(c)
      setFranqueado(c.expand?.franqueado || null)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar contrato',
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']

    const isPdfOrImage =
      allowedTypes.includes(file.type.toLowerCase()) || /\.(pdf|png|jpe?g|webp)$/i.test(file.name)

    if (!isPdfOrImage) {
      toast({
        title: 'Formato não suportado',
        description: 'Envie um documento em PDF ou imagem (PNG, JPG, JPEG, WEBP).',
        variant: 'destructive',
      })
      return
    }

    // 20 MB max
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 20 MB.',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  // Upload/Save document
  const handleSaveDocument = async () => {
    if (!contrato || !selectedFile) return
    setUploading(true)
    try {
      // Se contrato ainda estiver 'Pendente' ou 'Em Elaboração', marcar como Assinado ou manter se preferir
      // Geralmente ao anexar o documento assinado, o status pode ser atualizado para 'Assinado' se não estiver
      const updateData: Partial<Contrato> = {}
      if (contrato.status !== 'Assinado') {
        updateData.status = 'Assinado'
        if (!contrato.data_inicio) {
          updateData.data_inicio = new Date().toISOString()
        }
      }

      const updated = await contratosService.uploadDocumentoAssinado(
        contrato.id,
        selectedFile,
        updateData,
      )
      setContrato(updated)
      setSelectedFile(null)
      toast({
        title: 'Documento assinado anexado com sucesso!',
        description: 'O arquivo foi salvo e o contrato foi atualizado.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao anexar documento',
        description: err?.message || 'Falha no upload do arquivo.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  // Remove attached document
  const handleRemoveAttached = async () => {
    if (!contrato) return
    setRemovingFile(true)
    try {
      const updated = await contratosService.removeDocumentoAssinado(contrato.id)
      setContrato(updated)
      setConfirmRemoveOpen(false)
      toast({
        title: 'Anexo removido',
        description: 'O documento assinado foi removido do contrato.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao remover anexo',
        description: err?.message || 'Falha ao remover o documento.',
        variant: 'destructive',
      })
    } finally {
      setRemovingFile(false)
    }
  }

  // Status button actions
  const handleMarkAsSent = async () => {
    if (!contrato) return
    setUpdatingStatus(true)
    try {
      const updated = await contratosService.update(contrato.id, {
        status: 'Enviado',
      })
      setContrato(updated)
      toast({
        title: 'Contrato marcado como Enviado',
        description: 'Status atualizado com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: err?.message || 'Não foi possível alterar o status.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleMarkAsSigned = async () => {
    if (!contrato) return
    setUpdatingStatus(true)
    try {
      const updated = await contratosService.update(contrato.id, {
        status: 'Assinado',
        data_inicio: contrato.data_inicio || new Date().toISOString(),
      })
      setContrato(updated)
      toast({
        title: 'Contrato marcado como Assinado',
        description: 'Status atualizado com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: err?.message || 'Não foi possível alterar o status.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!contrato || !franqueado) return null

  const expiry = computeContractExpiry(contrato.data_fim, contrato.status)
  const existingFileUrl = contrato.documento_assinado
    ? contratosService.getFileUrl(contrato, contrato.documento_assinado)
    : ''
  const isImageFile = Boolean(
    contrato.documento_assinado && /\.(png|jpe?g|webp)$/i.test(contrato.documento_assinado),
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header / Breadcrumb & Status */}
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

        {/* Action Buttons Group (Voltar + Status Buttons) */}
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
            size="sm"
            variant="outline"
            onClick={handleMarkAsSent}
            disabled={uploading || updatingStatus || contrato.status === 'Assinado'}
            className="text-purple-700 border-purple-200 hover:bg-purple-50 text-xs font-semibold gap-1.5"
          >
            {updatingStatus ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Marcar como Enviado
          </Button>

          <Button
            size="sm"
            onClick={handleMarkAsSigned}
            disabled={uploading || updatingStatus || contrato.status === 'Assinado'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            {updatingStatus ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Marcar como Assinado
          </Button>
        </div>
      </div>

      {/* Main Upload Card */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Documento Assinado
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Faça o upload do documento assinado (PDF ou imagem) para este contrato.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Se já houver arquivo anexado no PocketBase */}
          {contrato.documento_assinado && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    {isImageFile ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-950 truncate max-w-sm">
                        {contrato.documento_assinado}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Anexado
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Arquivo disponível no servidor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-emerald-300 text-emerald-900 hover:bg-emerald-100/80 text-xs font-semibold gap-1.5 h-8"
                  >
                    <a
                      href={existingFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir arquivo em nova aba"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visualizar / Baixar
                    </a>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmRemoveOpen(true)}
                    disabled={uploading || removingFile}
                    className="text-slate-400 hover:text-red-600 h-8 w-8"
                    title="Remover anexo atual"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all flex flex-col items-center justify-center gap-3 ${
              isDragOver
                ? 'border-amber-500 bg-amber-50/50 scale-[1.005]'
                : selectedFile
                  ? 'border-amber-400 bg-amber-50/20'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                selectedFile
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
              }`}
            >
              {selectedFile ? <FileCheck2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                {selectedFile ? (
                  <span>
                    Arquivo selecionado:{' '}
                    <strong className="text-amber-700">{selectedFile.name}</strong>
                  </span>
                ) : contrato.documento_assinado ? (
                  'Clique ou arraste um novo arquivo para substituir o atual'
                ) : (
                  'Clique para selecionar ou arraste o arquivo até aqui'
                )}
              </p>
              <p className="text-xs text-slate-400">
                Suporta PDF, PNG, JPG, JPEG ou WEBP (até 20 MB)
              </p>
            </div>

            {selectedFile ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-xs text-amber-900 font-medium">
                <span>{selectedFile.name}</span>
                <span className="text-amber-700">({formatFileSize(selectedFile.size)})</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="text-xs font-semibold mt-1"
              >
                Selecionar do computador
              </Button>
            )}
          </div>

          {/* Action Footer: Anexar / Salvar arquivo */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {contrato.documento_assinado ? (
                <span>
                  O contrato possui documento assinado.{' '}
                  {selectedFile ? 'Salve para substituir pelo novo arquivo.' : ''}
                </span>
              ) : (
                <span>Nenhum documento assinado anexado ainda.</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancelar seleção
                </Button>
              )}

              <Button
                type="button"
                onClick={handleSaveDocument}
                disabled={!selectedFile || uploading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 h-9 shadow-sm gap-2 w-full sm:w-auto"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {contrato.documento_assinado
                  ? 'Salvar e Substituir Arquivo'
                  : 'Anexar Documento Assinado'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation modal to remove attached document */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Remover documento assinado?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Tem certeza que deseja remover o arquivo anexado{' '}
              <strong className="text-slate-800">{contrato.documento_assinado}</strong>? O contrato
              ficará sem o documento arquivado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRemoveOpen(false)}
              disabled={removingFile}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveAttached}
              disabled={removingFile}
              className="text-xs font-semibold"
            >
              {removingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Remover Anexo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
