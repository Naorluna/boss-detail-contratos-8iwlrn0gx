migrate(
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')

    if (!contratosCol.fields.getByName('data_assinatura')) {
      contratosCol.fields.add(
        new DateField({
          name: 'data_assinatura',
        }),
      )
      app.save(contratosCol)
    }
  },
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const field = contratosCol.fields.getByName('data_assinatura')
    if (field) {
      contratosCol.fields.removeByName('data_assinatura')
      app.save(contratosCol)
    }
  },
)
