import jsPDF from 'jspdf'

interface PDFGenerateOptions {
  tipoLabel: string
  titulo: string
  texto: string
  franqueadoNome?: string
}

export function generateContractPDF({
  tipoLabel,
  titulo,
  texto,
  franqueadoNome,
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
  const marginTop = 25
  const marginBottom = 20
  const contentWidth = pageWidth - marginLeft - marginRight

  // Helper para adicionar cabeçalho e rodapé elegante da Boss Detail
  const addHeaderAndFooter = (pageNumber: number, totalPages: number) => {
    // Faixa superior decorativa
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, pageWidth, 12, 'F')

    // Barra dourada Boss Detail
    doc.setFillColor(245, 158, 11) // amber-500
    doc.rect(0, 12, pageWidth, 1.5, 'F')

    // Texto topo
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('BOSS DETAIL — REDE DE FRANQUIAS DE ESTÉTICA AUTOMOTIVA', marginLeft, 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(203, 213, 225) // slate-300
    doc.text(tipoLabel.toUpperCase(), pageWidth - marginRight, 8, { align: 'right' })

    // Rodapé
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.setLineWidth(0.3)
    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)

    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text('Boss Detail Gestão de Franquias • Documento Confidencial', marginLeft, pageHeight - 7)
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginRight, pageHeight - 7, {
      align: 'right',
    })
  }

  // Título e cabeçalho na primeira página
  let cursorY = marginTop

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(titulo.toUpperCase(), marginLeft, cursorY)
  cursorY += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  const dataHojeStr = new Date().toLocaleDateString('pt-BR')
  doc.text(`Documento emitido via Sistema Boss Detail em ${dataHojeStr}`, marginLeft, cursorY)
  cursorY += 4

  // Linha divisória
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.4)
  doc.line(marginLeft, cursorY, pageWidth - marginRight, cursorY)
  cursorY += 7

  // Processamento do texto linha a linha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59) // slate-800

  const paragraphs = texto.split('\n')
  const lineHeight = 5.2

  for (let i = 0; i < paragraphs.length; i++) {
    const rawParagraph = paragraphs[i]

    if (rawParagraph.trim() === '') {
      cursorY += 3.5
      if (cursorY > pageHeight - marginBottom) {
        doc.addPage()
        cursorY = marginTop
      }
      continue
    }

    // Identificar títulos de cláusula ou seções em negrito
    const isHeading =
      rawParagraph.startsWith('CLÁUSULA') ||
      rawParagraph.startsWith('TERMO DE') ||
      rawParagraph.startsWith('PRÉ-CONTRATO') ||
      rawParagraph.startsWith('CONTRATO DEFINITIVO') ||
      rawParagraph.startsWith('DECLARA') ||
      rawParagraph.startsWith('TESTEMUNHAS:')

    if (isHeading) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(15, 23, 42)
      cursorY += 2
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
    }

    // Quebra de texto nas margens com splitTextToSize
    const wrappedLines = doc.splitTextToSize(rawParagraph, contentWidth)

    for (let j = 0; j < wrappedLines.length; j++) {
      if (cursorY + lineHeight > pageHeight - marginBottom) {
        doc.addPage()
        cursorY = marginTop
      }
      doc.text(wrappedLines[j], marginLeft, cursorY)
      cursorY += lineHeight
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

  // Nome amigável de arquivo: ex: cof-503-norte-2026.pdf
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
