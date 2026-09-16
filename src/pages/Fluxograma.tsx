import React, { useState } from 'react'
import {
  ExternalLink,
  Download,
  Workflow,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Building2,
  Sparkles,
  Maximize2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FLUXOGRAMA_PDF_URL, FLUXOGRAMA_PDF_FILENAME } from '@/assets/fluxogramaPdf'

interface EtapaFluxo {
  numero: number
  titulo: string
  subtitulo?: string
  destaque?: string
  alerta?: string
}

const ETAPAS_COMERCIAIS: EtapaFluxo[] = [
  {
    numero: 1,
    titulo: 'Entregar a COF',
    subtitulo: 'Assinatura da Declaração de Circular de Oferta de Franquia',
    destaque: 'Prazo mínimo legal de 10 dias',
  },
  {
    numero: 2,
    titulo: 'Assinatura do Pré-Contrato de Franquia',
    subtitulo: 'Formalização preliminar de interesse e condições',
    destaque: 'Prazo de vigência de 90 dias',
  },
  {
    numero: 3,
    titulo: 'Pagamento da Taxa de Franquia',
    subtitulo: 'Compensação financeira inicial (Day 1)',
    destaque: 'Day 1 de franquia',
  },
  {
    numero: 4,
    titulo: 'Busca do Ponto Comercial',
    subtitulo: 'Prospecção, aprovação e definição do local da operação',
    destaque: 'Dentro do prazo de 90 dias do pré-contrato',
  },
  {
    numero: 5,
    titulo: 'Abertura do CNPJ',
    subtitulo: 'Constituição da empresa franqueada na praça definida',
  },
  {
    numero: 6,
    titulo: 'Assinatura do Contrato de Franquia',
    subtitulo: 'Contrato definitivo com todas as cláusulas operacionais',
    destaque: 'Assinar o contrato próximo da inauguração',
    alerta: 'Não inaugurar sem a assinatura do contrato!',
  },
  {
    numero: 7,
    titulo: 'Inauguração da Unidade',
    subtitulo: 'Início oficial das operações da franquia Boss Detail',
  },
]

export default function Fluxograma() {
  const [loadError, setLoadError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const handleOpenPdf = () => {
    window.open(FLUXOGRAMA_PDF_URL, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadPdf = () => {
    const link = document.createElement('a')
    link.href = FLUXOGRAMA_PDF_URL
    link.download = FLUXOGRAMA_PDF_FILENAME
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReload = () => {
    setLoadError(false)
    setIframeKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-slate-900 to-[#1e293b] rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Workflow className="w-3.5 h-3.5" />
            Fluxo Oficial Boss Detail
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Fluxograma Comercial
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Sequência oficial dos processos de expansão: desde a entrega da COF até a inauguração da
            nova unidade franqueada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            onClick={handleOpenPdf}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-md gap-2 transition-transform active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir PDF em nova aba
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Main Grid: Steps summary + PDF Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols on lg): Resumo das Etapas */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Etapas do Fluxo Comercial
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  7 Passos
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Guia cronológico para acompanhamento dos franqueados
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              <ol className="relative border-l border-slate-200 ml-3.5 space-y-4 py-2">
                {ETAPAS_COMERCIAIS.map((etapa) => (
                  <li key={etapa.numero} className="ml-6 group">
                    <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-amber-400 ring-4 ring-white text-xs font-bold shadow-sm transition-transform group-hover:scale-110">
                      {etapa.numero}
                    </span>
                    <div className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border border-slate-100 transition-colors">
                      <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                        {etapa.titulo}
                      </h3>
                      {etapa.subtitulo && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {etapa.subtitulo}
                        </p>
                      )}
                      {etapa.destaque && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{etapa.destaque}</span>
                        </div>
                      )}
                      {etapa.alerta && (
                        <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium bg-red-50 text-red-800 border border-red-200">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                          <span>{etapa.alerta}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Regra de Ouro:</span> A inauguração da unidade nunca
                  deve ocorrer sem a assinatura prévia do Contrato Definitivo de Franquia.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 cols on lg): PDF Viewer Card */}
        <div className="lg:col-span-7">
          <Card className="border-slate-200 shadow-sm bg-white flex flex-col h-full min-h-[620px] lg:min-h-[820px]">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                  Visualizador do Documento
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 truncate">
                  {FLUXOGRAMA_PDF_FILENAME} • Documento oficial
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReload}
                  className="h-8 w-8 text-slate-500 hover:text-slate-900"
                  title="Recarregar visualizador"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPdf}
                  className="h-8 text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tela Cheia</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col bg-slate-900/5 relative">
              {loadError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-base font-semibold text-slate-900">
                      Visualização embutida indisponível
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Alguns navegadores ou dispositivos móveis bloqueiam a pré-visualização de PDFs
                      embutidos. Você pode abrir o documento diretamente ou baixá-lo.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      onClick={handleOpenPdf}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir PDF agora
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPdf}>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar arquivo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 w-full h-full relative min-h-[580px] lg:min-h-[760px] flex flex-col">
                  {/* Fallback banner for mobile */}
                  <div className="sm:hidden bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-2">
                    <span className="leading-tight font-medium">
                      No celular, use o botão para melhor visualização:
                    </span>
                    <Button
                      size="sm"
                      onClick={handleOpenPdf}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold h-7 px-2.5 shrink-0"
                    >
                      Abrir PDF
                    </Button>
                  </div>

                  <iframe
                    key={iframeKey}
                    src={`${FLUXOGRAMA_PDF_URL}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                    title="Fluxograma Comercial Boss Detail"
                    className="w-full flex-1 border-0 min-h-[550px] lg:min-h-[740px] bg-white rounded-b-xl"
                    onError={() => setLoadError(true)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
