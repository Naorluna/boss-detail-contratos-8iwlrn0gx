migrate(
  (app) => {
    // 1. Seed user naorluna@icloud.com
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let userRecord = null
    try {
      userRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'naorluna@icloud.com')
    } catch (_) {
      userRecord = new Record(users)
      userRecord.setEmail('naorluna@icloud.com')
      userRecord.setPassword('Skip@Pass')
      userRecord.setVerified(true)
      userRecord.set('name', 'Naor Luna')
      app.save(userRecord)
    }

    const franqueadosCol = app.findCollectionByNameOrId('franqueados')
    const contratosCol = app.findCollectionByNameOrId('contratos')
    const documentosCol = app.findCollectionByNameOrId('documentos')

    const standardTemplate = `CONTRATO DE FRANQUIA — BOSS DETAIL

Contratada: Boss Detail Ltda.

Franqueado: {{franqueado_nome}}
CNPJ: {{franqueado_cnpj}}
Endereço: {{franqueado_cidade}}/{{franqueado_estado}}
Responsável: {{franqueado_responsavel}}

Vigência do contrato: {{contrato_inicio}} a {{contrato_fim}}

Dados da última franquia:
Nome: {{ultima_franquia_nome}}
CNPJ: {{ultima_franquia_cnpj}}
Cidade: {{ultima_franquia_cidade}}/{{ultima_franquia_estado}}
Período: {{ultima_franquia_periodo}}

Data de emissão: {{data_hoje}}

Assinaturas:
______________________  ______________________
Contratante             Contratada`

    // Franchisee definitions
    const franchiseesData = [
      {
        nome: 'Boss Detail — Unidade Jardins',
        cnpj: '12.345.678/0001-90',
        cidade: 'São Paulo',
        estado: 'SP',
        responsavel: 'Carlos Andrade',
        email: 'carlos.jardins@bossdetail.com.br',
        telefone: '(11) 98765-4321',
        data_inauguracao: '2023-05-12 00:00:00.000Z',
        contracts: [
          {
            tipo: 'Recebimento da COF',
            status: 'Assinado',
            data_inicio: '2023-01-15 00:00:00.000Z',
            data_fim: '2024-01-15 00:00:00.000Z', // Past date -> Vencido or historical
            hasDoc: true,
            variaveis: {
              ultima_franquia_nome: 'AutoClean Jardins',
              ultima_franquia_cnpj: '11.111.111/0001-11',
              ultima_franquia_cidade: 'São Paulo',
              ultima_franquia_estado: 'SP',
              ultima_franquia_periodo: '2021-2022',
            },
          },
          {
            tipo: 'Pré-Contrato',
            status: 'Assinado',
            data_inicio: '2023-03-01 00:00:00.000Z',
            data_fim: '2026-03-01 00:00:00.000Z',
            hasDoc: true,
            variaveis: {},
          },
          {
            tipo: 'Contrato',
            status: 'Assinado',
            data_inicio: '2023-05-01 00:00:00.000Z',
            // Seed date roughly 4 months (~120 days) from now -> triggers red alert <= 180 days!
            // We can use a dynamic date: today + 110 days
            data_fim: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '),
            hasDoc: true,
            variaveis: {
              ultima_franquia_nome: 'AutoClean Jardins',
              ultima_franquia_cnpj: '12.345.678/0001-90',
              ultima_franquia_cidade: 'São Paulo',
              ultima_franquia_estado: 'SP',
              ultima_franquia_periodo: '2021 a 2023',
            },
          },
        ],
      },
      {
        nome: 'Boss Detail — Unidade Vila Olímpia',
        cnpj: '12.345.678/0002-71',
        cidade: 'São Paulo',
        estado: 'SP',
        responsavel: 'Mariana Souza',
        email: 'mariana.vilaolimpia@bossdetail.com.br',
        telefone: '(11) 97654-3210',
        data_inauguracao: '2023-11-03 00:00:00.000Z',
        contracts: [
          {
            tipo: 'Recebimento da COF',
            status: 'Assinado',
            data_inicio: '2023-08-10 00:00:00.000Z',
            data_fim: '2027-08-10 00:00:00.000Z',
            hasDoc: true,
            variaveis: {},
          },
          {
            tipo: 'Pré-Contrato',
            status: 'Enviado',
            data_inicio: '2023-09-20 00:00:00.000Z',
            // 4 months from now
            data_fim: new Date(Date.now() + 130 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '),
            hasDoc: true,
            variaveis: {
              ultima_franquia_nome: 'Estética Express',
              ultima_franquia_cnpj: '22.222.222/0001-22',
              ultima_franquia_cidade: 'São Paulo',
              ultima_franquia_estado: 'SP',
              ultima_franquia_periodo: '2022 a 2023',
            },
          },
          {
            tipo: 'Contrato',
            status: 'Assinado',
            data_inicio: '2023-11-01 00:00:00.000Z',
            data_fim: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '),
            hasDoc: true,
            variaveis: {},
          },
        ],
      },
      {
        nome: 'Boss Detail — Unidade Centro',
        cnpj: '98.765.432/0001-01',
        cidade: 'Campinas',
        estado: 'SP',
        responsavel: 'Rafael Lima',
        email: 'rafael.campinas@bossdetail.com.br',
        telefone: '(19) 98123-4567',
        data_inauguracao: '2022-08-20 00:00:00.000Z',
        contracts: [
          {
            tipo: 'Recebimento da COF',
            status: 'Assinado',
            data_inicio: '2022-04-10 00:00:00.000Z',
            data_fim: '2023-04-10 00:00:00.000Z', // Vencido
            hasDoc: true,
            variaveis: {},
          },
          {
            tipo: 'Pré-Contrato',
            status: 'Vencido',
            data_inicio: '2022-06-01 00:00:00.000Z',
            data_fim: '2024-01-10 00:00:00.000Z', // Vencido in the past
            hasDoc: false,
            variaveis: {},
          },
          {
            tipo: 'Contrato',
            status: 'Em Elaboração',
            data_inicio: '2022-08-01 00:00:00.000Z',
            data_fim: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '),
            hasDoc: true,
            variaveis: {
              ultima_franquia_nome: 'Detailing Hub Campinas',
              ultima_franquia_cnpj: '98.765.432/0001-01',
              ultima_franquia_cidade: 'Campinas',
              ultima_franquia_estado: 'SP',
              ultima_franquia_periodo: '2020 a 2022',
            },
          },
        ],
      },
      {
        nome: 'Boss Detail — Unidade Barra',
        cnpj: '11.222.333/0001-44',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        responsavel: 'Juliana Costa',
        email: 'juliana.barra@bossdetail.com.br',
        telefone: '(21) 99887-6655',
        data_inauguracao: '2024-01-15 00:00:00.000Z',
        contracts: [
          {
            tipo: 'Recebimento da COF',
            status: 'Assinado',
            data_inicio: '2023-10-01 00:00:00.000Z',
            data_fim: new Date(Date.now() + 600 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '),
            hasDoc: true,
            variaveis: {},
          },
          {
            tipo: 'Pré-Contrato',
            status: 'Assinado',
            data_inicio: '2023-11-15 00:00:00.000Z',
            data_fim: new Date(Date.now() + 700 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '),
            hasDoc: true,
            variaveis: {},
          },
          {
            tipo: 'Contrato',
            status: 'Assinado',
            data_inicio: '2024-01-10 00:00:00.000Z',
            data_fim: new Date(Date.now() + 900 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '),
            hasDoc: true,
            variaveis: {
              ultima_franquia_nome: 'Car Spa RJ',
              ultima_franquia_cnpj: '33.333.333/0001-33',
              ultima_franquia_cidade: 'Rio de Janeiro',
              ultima_franquia_estado: 'RJ',
              ultima_franquia_periodo: '2022 a 2023',
            },
          },
        ],
      },
      {
        nome: 'Boss Detail — Unidade Savassi',
        cnpj: '55.444.333/0001-81',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        responsavel: 'Thiago Rocha',
        email: 'thiago.savassi@bossdetail.com.br',
        telefone: '(31) 98456-7890',
        data_inauguracao: '2024-06-30 00:00:00.000Z',
        contracts: [
          {
            tipo: 'Recebimento da COF',
            status: 'Enviado',
            data_inicio: '2024-03-01 00:00:00.000Z',
            data_fim: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '), // <= 180 days -> Red Alert
            hasDoc: true,
            variaveis: {},
          },
          {
            tipo: 'Pré-Contrato',
            status: 'Pendente',
            data_inicio: '2024-05-01 00:00:00.000Z',
            data_fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' '),
            hasDoc: false,
            variaveis: {},
          },
          {
            tipo: 'Contrato',
            status: 'Pendente',
            data_inicio: null,
            data_fim: null,
            hasDoc: false,
            variaveis: {},
          },
        ],
      },
    ]

    for (let i = 0; i < franchiseesData.length; i++) {
      const fData = franchiseesData[i]
      let fRecord = null
      try {
        fRecord = app.findFirstRecordByData('franqueados', 'nome', fData.nome)
      } catch (_) {
        fRecord = new Record(franqueadosCol)
        fRecord.set('nome', fData.nome)
        fRecord.set('cnpj', fData.cnpj)
        fRecord.set('cidade', fData.cidade)
        fRecord.set('estado', fData.estado)
        fRecord.set('responsavel', fData.responsavel)
        fRecord.set('email', fData.email)
        fRecord.set('telefone', fData.telefone)
        fRecord.set('data_inauguracao', fData.data_inauguracao)
        app.save(fRecord)
      }

      // Seed the 3 contracts for this franchisee
      for (let j = 0; j < fData.contracts.length; j++) {
        const cData = fData.contracts[j]
        let cRecord = null
        try {
          const existing = app.findRecordsByFilter(
            'contratos',
            `franqueado = '${fRecord.id}' && tipo = '${cData.tipo}'`,
            '-created',
            1,
            0,
          )
          if (existing && existing.length > 0) {
            cRecord = existing[0]
          } else {
            throw new Error('Not found')
          }
        } catch (_) {
          cRecord = new Record(contratosCol)
          cRecord.set('franqueado', fRecord.id)
          cRecord.set('tipo', cData.tipo)
          cRecord.set('status', cData.status)
          if (cData.data_inicio) cRecord.set('data_inicio', cData.data_inicio)
          if (cData.data_fim) cRecord.set('data_fim', cData.data_fim)
          app.save(cRecord)
        }

        // Seed document if specified
        if (cData.hasDoc) {
          try {
            app.findFirstRecordByData('documentos', 'contrato', cRecord.id)
          } catch (_) {
            const dRecord = new Record(documentosCol)
            dRecord.set('contrato', cRecord.id)
            dRecord.set('conteudo', standardTemplate)
            dRecord.set('variaveis', cData.variaveis || {})
            if (cData.status === 'Enviado' || cData.status === 'Assinado') {
              dRecord.set('data_envio', new Date().toISOString().replace('T', ' '))
            }
            app.save(dRecord)
          }
        }
      }
    }
  },
  (app) => {
    // Truncate records in reverse order
    try {
      const docs = app.findCollectionByNameOrId('documentos')
      app.truncateCollection(docs)
    } catch (_) {}

    try {
      const contratos = app.findCollectionByNameOrId('contratos')
      app.truncateCollection(contratos)
    } catch (_) {}

    try {
      const franqueados = app.findCollectionByNameOrId('franqueados')
      app.truncateCollection(franqueados)
    } catch (_) {}
  },
)
