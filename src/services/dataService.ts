import pb from '@/lib/pocketbase/client'
import type { Franqueado, Contrato, Documento, ContractType, ContractStatus } from '@/types'
import { STANDARD_DOCUMENT_TEMPLATE } from '@/types'

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

    // Automatically create the 3 standard contracts for this new franchisee
    const contractTypes: ContractType[] = ['Recebimento da COF', 'Pré-Contrato', 'Contrato']
    for (const tipo of contractTypes) {
      await pb.collection('contratos').create({
        franqueado: franqueado.id,
        tipo,
        status: 'Pendente',
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

  async update(id: string, data: Partial<Contrato>): Promise<Contrato> {
    return await pb.collection('contratos').update<Contrato>(id, data, {
      expand: 'franqueado',
    })
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
