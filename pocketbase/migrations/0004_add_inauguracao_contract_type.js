migrate(
  (app) => {
    // 1. Atualizar o campo 'tipo' da collection 'contratos' para incluir 'Inauguração'
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const tipoField = contratosCol.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['Recebimento da COF', 'Pré-Contrato', 'Contrato', 'Inauguração']
      tipoField.maxSelect = 1
      app.save(contratosCol)
    }

    // 2. Criar contrato do tipo 'Inauguração' para todos os franqueados existentes que ainda não o possuem
    const franqueadosList = app.findRecordsByFilter('franqueados', '', 'created', 500, 0)

    for (let i = 0; i < franqueadosList.length; i++) {
      const f = franqueadosList[i]
      const existing = app.findRecordsByFilter(
        'contratos',
        `franqueado = '${f.id}' && tipo = 'Inauguração'`,
        '-created',
        1,
        0,
      )

      if (existing.length === 0) {
        const cRecord = new Record(contratosCol)
        cRecord.set('franqueado', f.id)
        cRecord.set('tipo', 'Inauguração')
        cRecord.set('status', 'Pendente')
        // Se o franqueado tiver data_inauguracao cadastrada, podemos prever data_inicio
        const fInaug = f.getString('data_inauguracao')
        if (fInaug) {
          cRecord.set('data_inicio', fInaug)
        }
        app.save(cRecord)
      }
    }
  },
  (app) => {
    // Rollback: remover contratos do tipo 'Inauguração' e reverter valores do campo tipo
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const inauguracaoRecords = app.findRecordsByFilter(
      'contratos',
      "tipo = 'Inauguração'",
      '-created',
      500,
      0,
    )

    for (let i = 0; i < inauguracaoRecords.length; i++) {
      try {
        app.delete(inauguracaoRecords[i])
      } catch (_) {}
    }

    const tipoField = contratosCol.fields.getByName('tipo')
    if (tipoField) {
      tipoField.values = ['Recebimento da COF', 'Pré-Contrato', 'Contrato']
      tipoField.maxSelect = 1
      app.save(contratosCol)
    }
  },
)
