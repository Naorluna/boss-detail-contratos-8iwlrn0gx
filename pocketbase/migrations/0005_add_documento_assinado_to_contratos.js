migrate(
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')

    if (!contratosCol.fields.getByName('documento_assinado')) {
      contratosCol.fields.add(
        new FileField({
          name: 'documento_assinado',
          maxSelect: 1,
          maxSize: 20 * 1024 * 1024, // 20 MB
          mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        }),
      )
      app.save(contratosCol)
    }
  },
  (app) => {
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const field = contratosCol.fields.getByName('documento_assinado')
    if (field) {
      contratosCol.fields.removeByName('documento_assinado')
      app.save(contratosCol)
    }
  },
)
