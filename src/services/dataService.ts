import pb from '@/lib/pocketbase/client'
import type {
  Franqueado,
  Socio,
  Contrato,
  Documento,
  ContractType,
  ContractStatus,
  ModeloContrato,
  ModeloTipo,
  ModeloHistoricoVersao,
  HistoricoGeracaoContrato,
} from '@/types'
import { STANDARD_DOCUMENT_TEMPLATE } from '@/types'

export const sociosService = {
  async getByFranqueado(franqueadoId: string): Promise<Socio[]> {
    return await pb.collection('socios').getFullList<Socio>({
      filter: `franqueado = "${franqueadoId}"`,
      sort: '-created',
    })
  },

  async getById(id: string): Promise<Socio> {
    return await pb.collection('socios').getOne<Socio>(id)
  },

  async create(data: Partial<Socio>): Promise<Socio> {
    return await pb.collection('socios').create<Socio>(data)
  },

  async update(id: string, data: Partial<Socio>): Promise<Socio> {
    return await pb.collection('socios').update<Socio>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('socios').delete(id)
  },
}

export const franqueadosService = {
  async getAll(): Promise<Franqueado[]> {
    return await pb.collection('franqueados').getFullList<Franqueado>({
      sort: 'nome',
    })
  },

  async getById(id: string): Promise<Franqueado> {
    return await pb.collection('franqueados').getOne<Franqueado>(id)
  },

  async create(data: Partial<Franqueado>): Promise<Franqueado> {
    const franqueado = await pb.collection('franqueados').create<Franqueado>(data)

    // If a socio / responsavel was provided, create an initial socio record
    if (data.responsavel && data.responsavel.trim()) {
      try {
        await pb.collection('socios').create({
          franqueado: franqueado.id,
          nome: data.responsavel.trim(),
          email: data.email?.trim() || '',
          telefone: data.telefone?.trim() || '',
          cargo: 'Sócio Administrador',
        })
      } catch (err) {
        console.warn('Não foi possível criar sócio inicial automaticamente:', err)
      }
    }

    // Automatically create the 4 standard contracts for this new franchisee
    const contractTypes: ContractType[] = [
      'Recebimento da COF',
      'Pré-Contrato',
      'Contrato',
      'Inauguração',
    ]
    for (const tipo of contractTypes) {
      await pb.collection('contratos').create({
        franqueado: franqueado.id,
        tipo,
        status: 'Pendente',
        ...(tipo === 'Inauguração' && data.data_inauguracao
          ? { data_inicio: data.data_inauguracao, data_inauguracao: data.data_inauguracao }
          : {}),
      })
    }

    return franqueado
  },

  async update(id: string, data: Partial<Franqueado>): Promise<Franqueado> {
    return await pb.collection('franqueados').update<Franqueado>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('franqueados').delete(id)
  },
}

export const contratosService = {
  async getAll(): Promise<Contrato[]> {
    return await pb.collection('contratos').getFullList<Contrato>({
      sort: '-created',
      expand: 'franqueado',
    })
  },

  async getByFranqueado(franqueadoId: string): Promise<Contrato[]> {
    return await pb.collection('contratos').getFullList<Contrato>({
      filter: `franqueado = "${franqueadoId}"`,
      sort: 'tipo',
      expand: 'franqueado',
    })
  },

  async getById(id: string): Promise<Contrato> {
    return await pb.collection('contratos').getOne<Contrato>(id, {
      expand: 'franqueado',
    })
  },

  async create(data: {
    franqueado: string
    tipo: ContractType
    status: ContractStatus
    data_inicio?: string | null
    data_fim?: string | null
    data_assinatura?: string | null
    data_envio?: string | null
    data_inauguracao?: string | null
    createDocWithTemplate?: boolean
  }): Promise<Contrato> {
    const { createDocWithTemplate, ...rest } = data
    const contrato = await pb.collection('contratos').create<Contrato>(rest)

    if (createDocWithTemplate) {
      await pb.collection('documentos').create({
        contrato: contrato.id,
        conteudo: STANDARD_DOCUMENT_TEMPLATE,
        variaveis: {},
      })
    }

    return contrato
  },

  async update(id: string, data: Partial<Contrato> | FormData): Promise<Contrato> {
    return await pb.collection('contratos').update<Contrato>(id, data, {
      expand: 'franqueado',
    })
  },

  async uploadDocumentoAssinado(
    id: string,
    file: File,
    additionalData?: Partial<Contrato>,
  ): Promise<Contrato> {
    const formData = new FormData()
    formData.append('documento_assinado', file)
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, String(val))
        }
      })
    }
    return await pb.collection('contratos').update<Contrato>(id, formData, {
      expand: 'franqueado',
    })
  },

  async removeDocumentoAssinado(id: string): Promise<Contrato> {
    return await pb
      .collection('contratos')
      .update<Contrato>(id, { documento_assinado: null as any }, { expand: 'franqueado' })
  },

  getFileUrl(contrato: Contrato, fileName?: string): string {
    const file = fileName || contrato.documento_assinado
    if (!file) return ''
    return pb.files.getURL(contrato, file)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('contratos').delete(id)
  },
}

export const documentosService = {
  async getByContrato(contratoId: string): Promise<Documento | null> {
    try {
      const records = await pb.collection('documentos').getFullList<Documento>({
        filter: `contrato = "${contratoId}"`,
        sort: '-created',
        limit: 1,
        expand: 'contrato,contrato.franqueado',
      })
      return records.length > 0 ? records[0] : null
    } catch (_) {
      return null
    }
  },

  async create(
    contratoId: string,
    conteudo?: string,
    variaveis?: Record<string, string>,
  ): Promise<Documento> {
    return await pb.collection('documentos').create<Documento>({
      contrato: contratoId,
      conteudo: conteudo || STANDARD_DOCUMENT_TEMPLATE,
      variaveis: variaveis || {},
    })
  },

  async update(id: string, data: Partial<Documento>): Promise<Documento> {
    return await pb.collection('documentos').update<Documento>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('documentos').delete(id)
  },
}

export const modelosContratoService = {
  async getAll(): Promise<ModeloContrato[]> {
    return await pb.collection('modelos_contrato').getFullList<ModeloContrato>({
      sort: 'tipo',
    })
  },

  async getByTipo(tipo: ModeloTipo): Promise<ModeloContrato | null> {
    try {
      return await pb
        .collection('modelos_contrato')
        .getFirstListItem<ModeloContrato>(`tipo = "${tipo}"`)
    } catch (_) {
      return null
    }
  },

  async update(id: string, data: Partial<ModeloContrato>): Promise<ModeloContrato> {
    return await pb.collection('modelos_contrato').update<ModeloContrato>(id, data)
  },

  async create(data: {
    tipo: ModeloTipo
    titulo?: string
    texto?: string
    versao?: number
    ano_versao?: number
  }): Promise<ModeloContrato> {
    return await pb.collection('modelos_contrato').create<ModeloContrato>({
      versao: 1,
      ano_versao: 2026,
      ...data,
    })
  },
}

export const modelosHistoricoService = {
  async getByTipo(tipo: ModeloTipo): Promise<ModeloHistoricoVersao[]> {
    try {
      return await pb.collection('modelos_historico_versoes').getFullList<ModeloHistoricoVersao>({
        filter: `tipo = "${tipo}"`,
        sort: '-created',
      })
    } catch (_) {
      return []
    }
  },

  async getAll(): Promise<ModeloHistoricoVersao[]> {
    try {
      return await pb.collection('modelos_historico_versoes').getFullList<ModeloHistoricoVersao>({
        sort: '-created',
      })
    } catch (_) {
      return []
    }
  },

  async create(data: {
    tipo: ModeloTipo
    modelo_id?: string
    titulo?: string
    texto?: string
    versao?: number
    ano_versao?: number
    rotulo_versao?: string
  }): Promise<ModeloHistoricoVersao> {
    return await pb.collection('modelos_historico_versoes').create<ModeloHistoricoVersao>(data)
  },
}

export const historicoGeracaoService = {
  async getByTipo(tipo: ModeloTipo): Promise<HistoricoGeracaoContrato[]> {
    try {
      return await pb
        .collection('historico_geracao_contratos')
        .getFullList<HistoricoGeracaoContrato>({
          filter: `tipo = "${tipo}"`,
          sort: '-created',
        })
    } catch (_) {
      return []
    }
  },

  async getAll(): Promise<HistoricoGeracaoContrato[]> {
    try {
      return await pb
        .collection('historico_geracao_contratos')
        .getFullList<HistoricoGeracaoContrato>({
          sort: '-created',
        })
    } catch (_) {
      return []
    }
  },

  async create(data: {
    tipo: ModeloTipo
    franqueado_id?: string
    franqueado_nome?: string
    rotulo_versao?: string
    versao?: number
    ano_versao?: number
    nome_arquivo?: string
  }): Promise<HistoricoGeracaoContrato> {
    return await pb.collection('historico_geracao_contratos').create<HistoricoGeracaoContrato>(data)
  },
}
