migrate(
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')

    if (!contratosCol.fields.getByName('data_envio')) {
      contratosCol.fields.add(
        new DateField({
          name: 'data_envio',
        }),
      )
      app.save(contratosCol)
    }
  },
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const field = contratosCol.fields.getByName('data_envio')
    if (field) {
      contratosCol.fields.removeByName('data_envio')
      app.save(contratosCol)
    }
  },
)
