migrate(
  (app) => {
    // 1. Criar collection 'modelos_contrato'
    const modelosContrato = new Collection({
      name: 'modelos_contrato',
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
      indexes: ['CREATE UNIQUE INDEX idx_modelos_contrato_tipo ON modelos_contrato (tipo)'],
    })
    app.save(modelosContrato)

    // 2. Seed inicial com os 3 modelos
    const seeds = [
      {
        tipo: 'COF',
        titulo: 'Recebimento da COF (Circular de Oferta de Franquia)',
        texto: `TERMO DE RECEBIMENTO DA CIRCULAR DE OFERTA DE FRANQUIA (COF)
BOSS DETAIL — ESTÉTICA AUTOMOTIVA PREMIUM

Pelo presente instrumento particular, o(a) CANDIDATO(A) A FRANQUEADO(A) abaixo qualificado(a):

Nome/Razão Social: {{nome_franqueado}}
CNPJ/CPF: {{cnpj}}
Responsável Legal: {{responsavel}}
Telefone: {{telefone}}
E-mail: {{email}}
Praça / Município de Interesse: {{cidade}} - {{estado}}

DECLARA, para os devidos fins de direito e em estrito cumprimento às exigências da Lei nº 13.966/2019 (Lei de Franquias):

1. Ter recebido nesta data, de forma regular, completa e tempestiva, cópia integral da CIRCULAR DE OFERTA DE FRANQUIA (COF) da rede BOSS DETAIL, contendo todas as especificações e anexos previstos na legislação em vigor.

2. Estar ciente de que a assinatura deste termo marca o início da contagem do prazo legal impreterível de no mínimo 10 (dez) dias úteis previsto no Artigo 1º, § 2º da Lei nº 13.966/2019, período no qual nenhuma taxa ou valor será cobrado a qualquer título pela Franqueadora, e nenhum contrato definitivo ou pré-contrato será firmado.

3. Observações / Dados Complementares:
{{observacoes}}

Local e Data: {{cidade}} - {{estado}}, {{data_assinatura}}.

_____________________________________________________
{{nome_franqueado}}
{{responsavel}}
CANDIDATO(A) A FRANQUEADO(A)

_____________________________________________________
BOSS DETAIL GESTÃO DE FRANQUIAS LTDA.
FRANQUEADORA`,
      },
      {
        tipo: 'Pre-Contrato',
        titulo: 'Pré-Contrato de Franquia',
        texto: `PRÉ-CONTRATO DE FRANQUIA EMPRESARIAL
REDE BOSS DETAIL

De um lado:
FRANQUEADORA: BOSS DETAIL GESTÃO DE FRANQUIAS LTDA., pessoa jurídica de direito privado.

E de outro lado:
PRÉ-FRANQUEADO(A):
Razão Social / Nome: {{nome_franqueado}}
CNPJ / CPF: {{cnpj}}
Representante Legal: {{responsavel}}
Endereço / Praça de Atuação: {{cidade}} - {{estado}}
Contato: {{telefone}} | {{email}}

Têm entre si, justo e acordado, o presente PRÉ-CONTRATO DE FRANQUIA EMPRESARIAL, sob as seguintes cláusulas:

CLÁUSULA PRIMEIRA — DO OBJETO
O presente instrumento tem por objetivo reservar a praça no município de {{cidade}} - {{estado}} para a implantação de uma unidade franqueada da Rede BOSS DETAIL, estabelecendo os compromissos preparatórios para a assinatura do Contrato de Franquia definitivo.

CLÁUSULA SEGUNDA — DAS DECLARAÇÕES
O(A) PRÉ-FRANQUEADO(A) declara que recebeu a Circular de Oferta de Franquia (COF) há mais de 10 (dez) dias, tendo analisado integralmente os termos, riscos do negócio, investimentos previstos e minuta do contrato final.

CLÁUSULA TERCEIRA — OBSERVAÇÕES E CONDIÇÕES ESPECÍFICAS
{{observacoes}}

Data de celebração: {{data_assinatura}} (Emitido em {{data_hoje}}).

_____________________________________________________
{{nome_franqueado}}
Representante: {{responsavel}}
PRÉ-FRANQUEADO(A)

_____________________________________________________
BOSS DETAIL GESTÃO DE FRANQUIAS LTDA.
FRANQUEADORA`,
      },
      {
        tipo: 'Contrato',
        titulo: 'Contrato de Franquia Empresarial',
        texto: `CONTRATO DEFINITIVO DE FRANQUIA EMPRESARIAL
BOSS DETAIL — CENTRO DE ESTÉTICA AUTOMOTIVA

CONTRATANTE / FRANQUEADORA:
BOSS DETAIL GESTÃO DE FRANQUIAS LTDA.

CONTRATADA / FRANQUEADA:
Razão Social: {{nome_franqueado}}
CNPJ: {{cnpj}}
Sócio Administrador / Responsável: {{responsavel}}
Cidade de Instalação: {{cidade}} - {{estado}}
Telefone de Contato: {{telefone}}
E-mail Institucional: {{email}}

As partes acima qualificadas celebram o presente CONTRATO DE FRANQUIA EMPRESARIAL mediante as seguintes cláusulas e condições:

CLÁUSULA 1ª — OBJETO DA FRANQUIA
Concessão não-exclusiva do direito de uso da marca "BOSS DETAIL", bem como transmissão do know-how, metodologia operacional, padrões de atendimento e catálogo de serviços da rede de estética automotiva.

CLÁUSULA 2ª — TERRITÓRIO E PRAÇA DE ATUAÇÃO
A unidade franqueada operará no município de {{cidade}} - {{estado}}, devendo seguir rigorosamente a identidade visual e o projeto arquitetônico homologado pela Franqueadora.

CLÁUSULA 3ª — VIGÊNCIA
O presente contrato vigerá pelo prazo determinado de 5 (cinco) anos a contar da data de sua assinatura em {{data_assinatura}}.

CLÁUSULA 4ª — DADOS COMPLEMENTARES E ÚLTIMA FRANQUIA
{{observacoes}}

E, por estarem assim justas e contratadas, as partes assinam o presente contrato na presença de 2 (duas) testemunhas.

Local e Data: {{cidade}} - {{estado}}, {{data_assinatura}}.

_____________________________________________________
{{nome_franqueado}}
Responsável: {{responsavel}}
FRANQUEADA

_____________________________________________________
BOSS DETAIL GESTÃO DE FRANQUIAS LTDA.
FRANQUEADORA

TESTEMUNHAS:
1. ___________________________ CPF: ____________________
2. ___________________________ CPF: ____________________`,
      },
    ]

    for (let i = 0; i < seeds.length; i++) {
      const item = seeds[i]
      try {
        const record = new Record(modelosContrato)
        record.set('tipo', item.tipo)
        record.set('titulo', item.titulo)
        record.set('texto', item.texto)
        app.save(record)
      } catch (err) {
        console.log('Erro ao criar seed de modelo ' + item.tipo + ':', err)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('modelos_contrato')
      app.delete(col)
    } catch (_) {}
  },
)
