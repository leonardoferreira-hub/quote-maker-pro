import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  console.log(`[fluxo-1-salvar-custos] ${req.method} ${req.url}`);
  console.log(`[fluxo-1-salvar-custos] Origin: ${req.headers.get('origin')}`);

  if (req.method === "OPTIONS") {
    console.log("[fluxo-1-salvar-custos] Preflight OPTIONS - returning 204");
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    const body = await req.json();
    console.log("[fluxo-1-salvar-custos] Body recebido:", JSON.stringify(body));

    // Aceita id_emissao do body (mais flexível)
    const id_emissao = body.id_emissao;

    if (!id_emissao) {
      return new Response(
        JSON.stringify({ success: false, error: "ID de emissão não fornecido no body" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validar que emissão existe
    const { data: emissaoExiste } = await supabaseClient
      .from("emissoes")
      .select("id")
      .eq("id", id_emissao)
      .single();

    if (!emissaoExiste) {
      return new Response(
        JSON.stringify({ success: false, error: "Emissão não encontrada" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Calcular totais se não fornecidos
    const custos = { ...body };

    // Calcular total upfront
    if (!custos.total_upfront) {
      let totalUpfront = 0;
      const camposUpfront = [
        "fee_agente_fiduciario_upfront",
        "fee_securitizadora_upfront",
        "fee_custodiante_lastro_upfront",
        "fee_liquidante_upfront",
        "fee_escriturador_upfront",
        "fee_contabilidade_upfront",
        "fee_auditoria_upfront",
        "fee_servicer_upfront",
        "fee_escriturador_nc_upfront",
        "fee_gerenciador_obra_upfront",
        "fee_coordenador_lider_upfront",
        "fee_assessor_legal_upfront",
        "fee_originador_upfront",
      ];

      for (const campo of camposUpfront) {
        if (custos[campo]) {
          totalUpfront += parseFloat(custos[campo]);
        }
      }

      custos.total_upfront = totalUpfront;
    }

    // Calcular total recorrente
    if (!custos.total_recorrente) {
      let totalRecorrente = 0;
      const camposRecorrente = [
        "fee_agente_fiduciario_recorrente",
        "fee_securitizadora_recorrente",
        "fee_custodiante_lastro_recorrente",
        "fee_liquidante_recorrente",
        "fee_escriturador_recorrente",
        "fee_contabilidade_recorrente",
        "fee_auditoria_recorrente",
        "fee_servicer_recorrente",
        "fee_escriturador_nc_recorrente",
        "fee_gerenciador_obra_recorrente",
        "fee_coordenador_lider_recorrente",
        "fee_assessor_legal_recorrente",
        "fee_originador_recorrente",
      ];

      for (const campo of camposRecorrente) {
        if (custos[campo]) {
          totalRecorrente += parseFloat(custos[campo]);
        }
      }

      custos.total_recorrente = totalRecorrente;
    }

    // Verificar se custos já existem
    const { data: custoExistente } = await supabaseClient
      .from("custos")
      .select("id")
      .eq("id_emissao", id_emissao)
      .single();

    let resultado;
    if (custoExistente) {
      // Atualizar
      resultado = await supabaseClient
        .from("custos")
        .update(custos)
        .eq("id_emissao", id_emissao)
        .select()
        .single();
    } else {
      // Criar
      resultado = await supabaseClient
        .from("custos")
        .insert({
          id_emissao,
          ...custos,
        })
        .select()
        .single();
    }

    const { data, error } = resultado;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: "Custos salvos com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
