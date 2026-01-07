// ============= EDGE FUNCTION: BUSCAR CUSTOS POR COMBINAÇÃO =============

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { categoria, tipo_oferta, veiculo, lastro, volume, series } = await req.json()

    console.log('📊 Parâmetros recebidos:', { categoria, tipo_oferta, veiculo, lastro, volume, series })

    // Buscar custos baseado na combinação
    let query = supabase
      .from('custos_padrao')
      .select('*')
      .eq('categoria', categoria)

    // Adicionar filtros opcionais
    if (tipo_oferta) {
      query = query.eq('tipo_oferta', tipo_oferta)
    }
    if (veiculo) {
      query = query.eq('veiculo', veiculo)
    }
    if (lastro) {
      query = query.eq('lastro', lastro)
    }

    const { data: custos, error: custosError } = await query

    if (custosError) {
      console.error('❌ Erro ao buscar custos:', custosError)
      throw custosError
    }

    console.log('✅ Custos encontrados:', custos?.length || 0)

    // Buscar tabela de custódia de debênture
    const { data: custodiaDebenture, error: custodiaError } = await supabase
      .from('custodia_debenture')
      .select('*')
      .order('valor_minimo', { ascending: true })

    if (custodiaError) {
      console.error('⚠️ Erro ao buscar custódia (não crítico):', custodiaError)
    }

    // Separar custos por periodicidade
    const upfront = custos?.filter(c => c.periodicidade === 'upfront').map(c => ({
      id: c.id,
      papel: c.papel,
      id_prestador: c.id_prestador,
      nome_prestador: c.nome_prestador,
      preco_upfront: c.preco_upfront,
      tipo_preco: c.tipo_preco || 'Fixo',
      formula_descricao: c.formula_descricao,
      gross_up: c.gross_up || 0,
      periodicidade: 'upfront'
    })) || []

    const anual = custos?.filter(c => c.periodicidade === 'anual').map(c => ({
      id: c.id,
      papel: c.papel,
      id_prestador: c.id_prestador,
      nome_prestador: c.nome_prestador,
      preco_anual: c.preco_anual,
      tipo_preco: c.tipo_preco || 'Fixo',
      formula_descricao: c.formula_descricao,
      gross_up: c.gross_up || 0,
      periodicidade: 'anual'
    })) || []

    const mensal = custos?.filter(c => c.periodicidade === 'mensal').map(c => ({
      id: c.id,
      papel: c.papel,
      id_prestador: c.id_prestador,
      nome_prestador: c.nome_prestador,
      preco_mensal: c.preco_mensal,
      tipo_preco: c.tipo_preco || 'Fixo',
      formula_descricao: c.formula_descricao,
      gross_up: c.gross_up || 0,
      periodicidade: 'mensal'
    })) || []

    // Calcular totais base (apenas custos fixos)
    const total_upfront = upfront.reduce((sum, c) => sum + (c.preco_upfront || 0), 0)
    const total_anual = anual.reduce((sum, c) => sum + (c.preco_anual || 0), 0)
    const total_mensal = mensal.reduce((sum, c) => sum + (c.preco_mensal || 0), 0)

    const response = {
      success: true,
      data: { upfront, anual, mensal },
      emissao: { volume, series },
      custodia_debenture: custodiaDebenture || [],
      totais: {
        total_upfront,
        total_anual,
        total_mensal,
        total_primeiro_ano: total_upfront + total_anual + (total_mensal * 12)
      }
    }

    console.log('📤 Resposta:', JSON.stringify(response, null, 2))

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        data: { upfront: [], anual: [], mensal: [] },
        custodia_debenture: [],
        totais: { total_upfront: 0, total_anual: 0, total_mensal: 0, total_primeiro_ano: 0 }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
