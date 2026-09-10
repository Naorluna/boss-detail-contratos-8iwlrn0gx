import jsPDF from 'jspdf'

interface PDFGenerateOptions {
  tipoLabel: string
  titulo: string
  texto: string
  franqueadoNome?: string
  anexoIiImagemDataUrl?: string | null
}

export function generateContractPDF({
  tipoLabel,
  titulo,
  texto,
  franqueadoNome,
  anexoIiImagemDataUrl,
}: PDFGenerateOptions): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginLeft = 20
  const marginRight = 20
  const marginTop = 22
  const marginBottom = 20
  const contentWidth = pageWidth - marginLeft - marginRight

  // Helper para adicionar cabeçalho e rodapé elegante da Boss Detail
  const addHeaderAndFooter = (pageNumber: number, totalPages: number) => {
    // Faixa superior decorativa
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, pageWidth, 11, 'F')

    // Barra dourada Boss Detail
    doc.setFillColor(245, 158, 11) // amber-500
    doc.rect(0, 11, pageWidth, 1.2, 'F')

    // Texto topo
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('BOSS DETAIL — REDE DE FRANQUIAS DE ESTÉTICA AUTOMOTIVA', marginLeft, 7.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(203, 213, 225) // slate-300
    doc.text(tipoLabel.toUpperCase(), pageWidth - marginRight, 7.5, { align: 'right' })

    // Rodapé
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.setLineWidth(0.3)
    doc.line(marginLeft, pageHeight - 11, pageWidth - marginRight, pageHeight - 11)

    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text(
      'Boss Detail Gestão de Franquias • Documento Confidencial',
      marginLeft,
      pageHeight - 6.5,
    )
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginRight, pageHeight - 6.5, {
      align: 'right',
    })
  }

  // Título e cabeçalho na primeira página
  let cursorY = marginTop

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(titulo.toUpperCase(), marginLeft, cursorY)
  cursorY += 5.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  const dataHojeStr = new Date().toLocaleDateString('pt-BR')
  doc.text(`Documento emitido via Sistema Boss Detail em ${dataHojeStr}`, marginLeft, cursorY)
  cursorY += 3.5

  // Linha divisória
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.4)
  doc.line(marginLeft, cursorY, pageWidth - marginRight, cursorY)
  cursorY += 6

  // Processamento do texto linha a linha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(30, 41, 59) // slate-800

  const lines = texto.split('\n')
  const defaultLineHeight = 4.8

  let inTable = false
  let tableHeaderCols: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // 1. Marcações de início de tabela
    if (trimmed === '[TABELA_INVESTIMENTO]' || trimmed === '[TABELA_ROYALTIES]') {
      inTable = true
      tableHeaderCols = []
      continue
    }
    if (trimmed === '[/TABELA_INVESTIMENTO]' || trimmed === '[/TABELA_ROYALTIES]') {
      inTable = false
      cursorY += 2
      continue
    }

    // 2. Renderização de linha de tabela
    if (inTable && trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const parts = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())

      if (parts.length >= 2) {
        // Checar quebra de página antes de desenhar a linha da tabela
        if (cursorY + 7 > pageHeight - marginBottom) {
          doc.addPage()
          cursorY = marginTop
        }

        const isHeader = tableHeaderCols.length === 0
        if (isHeader) {
          tableHeaderCols = parts
          // Desenhar fundo de cabeçalho da tabela
          doc.setFillColor(241, 245, 249) // slate-100
          doc.rect(marginLeft, cursorY - 3.5, contentWidth, 6.5, 'F')
          doc.setDrawColor(203, 213, 225)
          doc.setLineWidth(0.2)
          doc.rect(marginLeft, cursorY - 3.5, contentWidth, 6.5, 'S')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(15, 23, 42)

          const col1Width = contentWidth * 0.72
          doc.text(parts[0], marginLeft + 2, cursorY + 0.8)
          doc.text(parts[1], pageWidth - marginRight - 2, cursorY + 0.8, { align: 'right' })

          cursorY += 6.5
        } else {
          // Linha de dados da tabela
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(30, 41, 59)

          const isTotal = parts[0].includes('TOTAL')
          if (isTotal) {
            doc.setFont('helvetica', 'bold')
            doc.setFillColor(254, 243, 199) // amber-100
            doc.rect(marginLeft, cursorY - 3, contentWidth, 6, 'F')
          }

          doc.setDrawColor(226, 232, 240)
          doc.setLineWidth(0.15)
          doc.line(marginLeft, cursorY + 3, pageWidth - marginRight, cursorY + 3)

          const col1Lines = doc.splitTextToSize(parts[0], contentWidth * 0.7)
          doc.text(col1Lines, marginLeft + 2, cursorY + 0.5)
          doc.text(parts[1], pageWidth - marginRight - 2, cursorY + 0.5, { align: 'right' })

          const rowHeight = Math.max(col1Lines.length * 4.2, 5.8)
          cursorY += rowHeight
        }
        continue
      }
    }

    // 3. Renderização de Imagem do Anexo II
    if (trimmed === '{{anexo_ii_imagem}}') {
      if (anexoIiImagemDataUrl) {
        // Se a imagem não cabe na página atual, vai para a próxima página
        const imageRenderWidth = contentWidth
        // Estimar proporção ou usar altura segura ~85mm
        const imageRenderHeight = Math.min(85, pageHeight - marginTop - marginBottom - 15)

        if (cursorY + imageRenderHeight > pageHeight - marginBottom) {
          doc.addPage()
          cursorY = marginTop
        }

        try {
          doc.addImage(
            anexoIiImagemDataUrl,
            'PNG',
            marginLeft,
            cursorY,
            imageRenderWidth,
            imageRenderHeight,
            undefined,
            'FAST',
          )
          cursorY += imageRenderHeight + 5
        } catch {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8.5)
          doc.setTextColor(100, 116, 139)
          doc.text('[Balanços e Demonstrações Financeiras — Imagem Anexa]', marginLeft, cursorY)
          cursorY += 6
        }
      } else {
        // Espaço reservado / placeholder sem upload
        if (cursorY + 22 > pageHeight - marginBottom) {
          doc.addPage()
          cursorY = marginTop
        }

        doc.setFillColor(248, 250, 252)
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.3)
        doc.roundedRect(marginLeft, cursorY, contentWidth, 20, 2, 2, 'FD')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(100, 116, 139)
        doc.text(
          '[Balanços e Demonstrações Financeiras — Vide demonstrações e imagem anexa da Franqueadora]',
          pageWidth / 2,
          cursorY + 11,
          { align: 'center' },
        )
        cursorY += 25
      }
      continue
    }

    // 4. Parágrafo em branco
    if (trimmed === '') {
      cursorY += 3
      if (cursorY > pageHeight - marginBottom) {
        doc.addPage()
        cursorY = marginTop
      }
      continue
    }

    // 5. Linha divisória de assinatura ("Assinatura do Candidato: _________")
    const isCandidateSig =
      trimmed.startsWith('Assinatura do Candidato:') ||
      trimmed.startsWith('Nome:') ||
      trimmed.startsWith('RG:') ||
      trimmed.startsWith('CPF/ME:') ||
      trimmed.startsWith('Endereço:')

    // 6. Títulos principais de seções
    const isHeading =
      /^[0-9]{1,2}\.\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s/()_-]+:?$/.test(trimmed) ||
      trimmed.startsWith('ANEXO') ||
      trimmed.startsWith('LEI Nº') ||
      trimmed.startsWith('DECLARAÇÃO DE RECEBIMENTO') ||
      trimmed.startsWith('CIRCULAR DE OFERTA') ||
      trimmed.startsWith('CLÁUSULA') ||
      trimmed.startsWith('TERMO DE') ||
      trimmed.startsWith('PRÉ-CONTRATO') ||
      trimmed.startsWith('CONTRATO DEFINITIVO')

    const isSubHeading =
      /^[0-9]{1,2}\.[0-9]{1,2}\.?\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s/()_-]+:?$/.test(trimmed) ||
      trimmed.startsWith('Razão Social:') ||
      trimmed.startsWith('Endereço:') ||
      trimmed.startsWith('CNPJ/ME:') ||
      trimmed.startsWith('Telefone/e-mail:') ||
      trimmed.startsWith('Capital Social:') ||
      trimmed.startsWith('Sócios:')

    if (isHeading) {
      if (cursorY + 14 > pageHeight - marginBottom) {
        doc.addPage()
        cursorY = marginTop
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(15, 23, 42)
      cursorY += 2
    } else if (isSubHeading) {
      if (cursorY + 10 > pageHeight - marginBottom) {
        doc.addPage()
        cursorY = marginTop
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 41, 59)
      cursorY += 1
    } else if (isCandidateSig) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 41, 59)
    }

    // Quebra de linha inteligente
    const wrappedLines = doc.splitTextToSize(rawLine, contentWidth)

    for (let j = 0; j < wrappedLines.length; j++) {
      if (cursorY + defaultLineHeight > pageHeight - marginBottom) {
        doc.addPage()
        cursorY = marginTop
      }
      doc.text(wrappedLines[j], marginLeft, cursorY)
      cursorY += defaultLineHeight
    }

    if (isHeading) {
      cursorY += 1.5
    }
  }

  // Segunda passada para numerar páginas corretamente (Página X de Y)
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    addHeaderAndFooter(p, totalPages)
  }

  // Nome de arquivo higienizado
  const sanitizedTipo = tipoLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const sanitizedFranqueado = (franqueadoNome || 'geral')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const anoAtual = new Date().getFullYear()
  const filename = `${sanitizedTipo}-${sanitizedFranqueado}-${anoAtual}.pdf`

  return { doc, filename }
}
