migrate(
  (app) => {
    // 1. Create 'franqueados' collection
    const franqueados = new Collection({
      name: 'franqueados',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'cnpj', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'estado', type: 'text' },
        { name: 'responsavel', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'data_inauguracao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_franqueados_nome ON franqueados (nome)'],
    })
    app.save(franqueados)

    const franqueadosId = app.findCollectionByNameOrId('franqueados').id

    // 2. Create 'contratos' collection
    const contratos = new Collection({
      name: 'contratos',
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
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['Recebimento da COF', 'Pré-Contrato', 'Contrato'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Em Elaboração', 'Enviado', 'Assinado', 'Vencido'],
          maxSelect: 1,
        },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contratos_franqueado ON contratos (franqueado)',
        'CREATE INDEX idx_contratos_tipo ON contratos (tipo)',
        'CREATE INDEX idx_contratos_status ON contratos (status)',
        'CREATE INDEX idx_contratos_data_fim ON contratos (data_fim)',
      ],
    })
    app.save(contratos)

    const contratosId = app.findCollectionByNameOrId('contratos').id

    // 3. Create 'documentos' collection
    const documentos = new Collection({
      name: 'documentos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'contrato',
          type: 'relation',
          required: true,
          collectionId: contratosId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'conteudo', type: 'editor' },
        { name: 'variaveis', type: 'json' },
        { name: 'data_envio', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_documentos_contrato ON documentos (contrato)'],
    })
    app.save(documentos)
  },
  (app) => {
    try {
      const documentos = app.findCollectionByNameOrId('documentos')
      app.delete(documentos)
    } catch (_) {}

    try {
      const contratos = app.findCollectionByNameOrId('contratos')
      app.delete(contratos)
    } catch (_) {}

    try {
      const franqueados = app.findCollectionByNameOrId('franqueados')
      app.delete(franqueados)
    } catch (_) {}
  },
)
