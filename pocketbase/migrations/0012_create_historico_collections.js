migrate(
  (app) => {
    // 1. Criar collection 'modelos_historico_versoes'
    const modelosHistorico = new Collection({
      name: 'modelos_historico_versoes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'tipo',
          type: 'text',
          required: true,
        },
        {
          name: 'modelo_id',
          type: 'text',
          required: false,
        },
        {
          name: 'titulo',
          type: 'text',
          required: false,
        },
        {
          name: 'texto',
          type: 'editor',
          required: false,
        },
        {
          name: 'versao',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        {
          name: 'ano_versao',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        {
          name: 'rotulo_versao',
          type: 'text',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_modelos_historico_tipo ON modelos_historico_versoes (tipo)',
        'CREATE INDEX idx_modelos_historico_created ON modelos_historico_versoes (created DESC)',
      ],
    })
    app.save(modelosHistorico)

    // 2. Criar collection 'historico_geracao_contratos'
    const historicoGeracao = new Collection({
      name: 'historico_geracao_contratos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'tipo',
          type: 'text',
          required: true,
        },
        {
          name: 'franqueado_id',
          type: 'text',
          required: false,
        },
        {
          name: 'franqueado_nome',
          type: 'text',
          required: false,
        },
        {
          name: 'rotulo_versao',
          type: 'text',
          required: false,
        },
        {
          name: 'versao',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        {
          name: 'ano_versao',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        {
          name: 'nome_arquivo',
          type: 'text',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_hist_geracao_tipo ON historico_geracao_contratos (tipo)',
        'CREATE INDEX idx_hist_geracao_created ON historico_geracao_contratos (created DESC)',
      ],
    })
    app.save(historicoGeracao)
  },
  (app) => {
    try {
      const colHist = app.findCollectionByNameOrId('modelos_historico_versoes')
      app.delete(colHist)
    } catch (_) {}

    try {
      const colGer = app.findCollectionByNameOrId('historico_geracao_contratos')
      app.delete(colGer)
    } catch (_) {}
  },
)
