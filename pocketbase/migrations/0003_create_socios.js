migrate(
  (app) => {
    const franqueadosCol = app.findCollectionByNameOrId('franqueados')
    const franqueadosId = franqueadosCol.id

    // 1. Create 'socios' collection
    const socios = new Collection({
      name: 'socios',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'franqueado',
          type: 'relation',
          required: true,
          collectionId: franqueadosId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'cpf_cnpj', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'percentual', type: 'number', min: 0, max: 100 },
        { name: 'cargo', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_socios_franqueado ON socios (franqueado)',
        'CREATE INDEX idx_socios_nome ON socios (nome)',
      ],
    })
    app.save(socios)

    const sociosCol = app.findCollectionByNameOrId('socios')

    // 2. Migrate existing 'responsavel' data from franqueados to 'socios'
    const franqueadosList = app.findRecordsByFilter(
      'franqueados',
      "responsavel != ''",
      'created',
      500,
      0,
    )
    for (let i = 0; i < franqueadosList.length; i++) {
      const f = franqueadosList[i]
      const resp = (f.getString('responsavel') || '').trim()
      if (resp) {
        // Check if a socio with this name already exists for this franqueado
        const existing = app.findRecordsByFilter(
          'socios',
          `franqueado = '${f.id}' && nome = '${resp.replace(/'/g, "\\'")}'`,
          'created',
          1,
          0,
        )
        if (existing.length === 0) {
          const socioRecord = new Record(sociosCol)
          socioRecord.set('franqueado', f.id)
          socioRecord.set('nome', resp)
          socioRecord.set('email', f.getString('email') || '')
          socioRecord.set('telefone', f.getString('telefone') || '')
          socioRecord.set('cargo', 'Sócio Administrador')
          app.save(socioRecord)
        }
      }
    }
  },
  (app) => {
    try {
      const socios = app.findCollectionByNameOrId('socios')
      app.delete(socios)
    } catch (_) {}
  },
)
