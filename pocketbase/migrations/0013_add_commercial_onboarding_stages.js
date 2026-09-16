migrate(
  (app) => {
    // 1. Atualizar o campo 'tipo' da collection 'contratos' para incluir os 3 novos tipos
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const tipoField = contratosCol.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = [
        'Recebimento da COF',
        'Pré-Contrato',
        'Pagamento da Taxa de Franquia',
        'Busca do Ponto',
        'Abertura do CNPJ',
        'Contrato',
        'Inauguração',
      ]
      tipoField.maxSelect = 1
      app.save(contratosCol)
    }

    // 2. Criar contratos dos 3 novos tipos para todos os franqueados existentes que ainda não os possuem
    const novosTipos = ['Pagamento da Taxa de Franquia', 'Busca do Ponto', 'Abertura do CNPJ']

    const franqueadosList = app.findRecordsByFilter('franqueados', '', 'created', 500, 0)

    for (let i = 0; i < franqueadosList.length; i++) {
      const f = franqueadosList[i]

      for (let j = 0; j < novosTipos.length; j++) {
        const tipoNome = novosTipos[j]
        const existing = app.findRecordsByFilter(
          'contratos',
          `franqueado = '${f.id}' && tipo = '${tipoNome}'`,
          '-created',
          1,
          0,
        )

        if (existing.length === 0) {
          const cRecord = new Record(contratosCol)
          cRecord.set('franqueado', f.id)
          cRecord.set('tipo', tipoNome)
          cRecord.set('status', 'Pendente')
          app.save(cRecord)
        }
      }
    }
  },
  (app) => {
    // Rollback: remover contratos dos 3 novos tipos e reverter valores do campo tipo
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const novosTipos = ['Pagamento da Taxa de Franquia', 'Busca do Ponto', 'Abertura do CNPJ']

    for (let j = 0; j < novosTipos.length; j++) {
      const tipoNome = novosTipos[j]
      const records = app.findRecordsByFilter(
        'contratos',
        `tipo = '${tipoNome}'`,
        '-created',
        500,
        0,
      )

      for (let i = 0; i < records.length; i++) {
        try {
          app.delete(records[i])
        } catch (_) {}
      }
    }

    const tipoField = contratosCol.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['Recebimento da COF', 'Pré-Contrato', 'Contrato', 'Inauguração']
      tipoField.maxSelect = 1
      app.save(contratosCol)
    }
  },
)
