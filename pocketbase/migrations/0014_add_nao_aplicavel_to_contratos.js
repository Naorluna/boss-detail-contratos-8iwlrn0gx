migrate(
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')

    if (!contratosCol.fields.getByName('nao_aplicavel')) {
      contratosCol.fields.add(
        new BoolField({
          name: 'nao_aplicavel',
          required: false,
        }),
      )
      app.save(contratosCol)
    }
  },
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const field = contratosCol.fields.getByName('nao_aplicavel')
    if (field) {
      contratosCol.fields.removeByName('nao_aplicavel')
      app.save(contratosCol)
    }
  },
)
