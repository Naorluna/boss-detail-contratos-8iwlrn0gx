migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('modelos_contrato')

    // 1. Adicionar campos 'versao' e 'ano_versao' se ainda não existirem
    if (!col.fields.getByName('versao')) {
      col.fields.add(
        new NumberField({
          name: 'versao',
          required: false,
          onlyInt: true,
          min: 1,
        }),
      )
    }

    if (!col.fields.getByName('ano_versao')) {
      col.fields.add(
        new NumberField({
          name: 'ano_versao',
          required: false,
          onlyInt: true,
          min: 2000,
        }),
      )
    }

    app.save(col)

    // 2. Inicializar modelos existentes com versao = 1 e ano_versao = 2026 (conforme regra de negócio)
    app
      .db()
      .newQuery(
        'UPDATE modelos_contrato SET versao = 1, ano_versao = 2026 WHERE versao IS NULL OR versao = 0',
      )
      .execute()
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('modelos_contrato')
      col.fields.removeByName('versao')
      col.fields.removeByName('ano_versao')
      app.save(col)
    } catch (_) {}
  },
)
