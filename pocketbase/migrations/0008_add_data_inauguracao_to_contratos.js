migrate(
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')

    if (!contratosCol.fields.getByName('data_inauguracao')) {
      contratosCol.fields.add(
        new DateField({
          name: 'data_inauguracao',
        }),
      )
      app.save(contratosCol)
    }

    // Sincronizar data_inauguracao existente de franqueados nos contratos de Inauguração
    try {
      const franqueadosList = app.findRecordsByFilter(
        'franqueados',
        "data_inauguracao != ''",
        '',
        500,
        0,
      )
      for (let i = 0; i < franqueadosList.length; i++) {
        const f = franqueadosList[i]
        const dInaug = f.getString('data_inauguracao')
        if (!dInaug) continue

        const contracts = app.findRecordsByFilter(
          'contratos',
          `franqueado = '${f.id}' && tipo = 'Inauguração'`,
          '-created',
          10,
          0,
        )
        for (let j = 0; j < contracts.length; j++) {
          const c = contracts[j]
          if (!c.getString('data_inauguracao')) {
            c.set('data_inauguracao', dInaug)
            app.save(c)
          }
        }
      }
    } catch (_) {}
  },
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const field = contratosCol.fields.getByName('data_inauguracao')
    if (field) {
      contratosCol.fields.removeByName('data_inauguracao')
      app.save(contratosCol)
    }
  },
)
