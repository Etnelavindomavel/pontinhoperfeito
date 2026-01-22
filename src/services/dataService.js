import { supabase } from '../lib/supabase'

export const dataService = {
  // Salvar upload
  async saveUpload(userId, uploadInfo) {
    if (!supabase) {
      console.log('ℹ️ Supabase não configurado, usando localStorage')
      return null
    }
    try {
      const { data, error } = await supabase
        .from('uploads')
        .insert({
          user_id: userId,
          filename: uploadInfo.filename,
          file_size: uploadInfo.fileSize,
          row_count: uploadInfo.rowCount,
          columns: uploadInfo.columns,
          date_range: uploadInfo.dateRange
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao salvar upload:', error)
      throw error
    }
  },

  // Salvar dados brutos (em chunks para performance)
  async saveRawData(userId, uploadId, data) {
    if (!supabase) {
      console.log('ℹ️ Supabase não configurado, usando localStorage')
      return true
    }
    try {
      // Dividir em chunks de 100 registros
      const chunkSize = 100
      const chunks = []
      
      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize))
      }

      // Inserir cada chunk
      for (const chunk of chunks) {
        const records = chunk.map(row => ({
          user_id: userId,
          upload_id: uploadId,
          data: row
        }))

        const { error } = await supabase
          .from('raw_data')
          .insert(records)

        if (error) {
          console.error('Erro ao inserir chunk:', error)
          throw error
        }
      }

      return true
    } catch (error) {
      console.error('Erro ao salvar raw data:', error)
      throw error
    }
  },

  // Buscar dados do usuário
  async getUserData(userId) {
    if (!supabase) {
      return []
    }
    try {
      const { data, error } = await supabase
        .from('raw_data')
        .select('data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Extrair apenas o campo data de cada registro
      return data.map(item => item.data)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      return []
    }
  },

  // Buscar uploads do usuário
  async getUserUploads(userId) {
    if (!supabase) {
      return []
    }
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar uploads:', error)
      return []
    }
  },

  // Deletar upload e dados relacionados
  async deleteUpload(uploadId) {
    if (!supabase) {
      return true
    }
    try {
      // O cascade delete vai remover os raw_data automaticamente
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('id', uploadId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao deletar upload:', error)
      throw error
    }
  },

  // Salvar relatório gerado
  async saveReport(userId, reportData) {
    try {
      if (!supabase) {
        throw new Error('Supabase não configurado.')
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: userId,
          report_name: reportData.name,
          analysis_types: reportData.analysisTypes,
          date_range: reportData.dateRange,
          filters: reportData.filters
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao salvar relatório:', error)
      throw error
    }
  },

  // Buscar relatórios do usuário
  async getUserReports(userId) {
    try {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
      return []
    }
  }
}
