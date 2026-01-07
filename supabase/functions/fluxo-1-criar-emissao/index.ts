import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  console.log(`[fluxo-1-criar-emissao] ${req.method} ${req.url}`);
  console.log(`[fluxo-1-criar-emissao] Origin: ${req.headers.get('origin')}`);

  if (req.method === "OPTIONS") {
    console.log("[fluxo-1-criar-emissao] Preflight OPTIONS - returning 204");
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
    console.log("[fluxo-1-criar-emissao] Body recebido:", JSON.stringify(body));

    // Validate required fields
    const camposObrigatorios = [
      "demandante_proposta",
      "empresa_destinataria",
      "categoria",
      "oferta",
      "veiculo",
      "quantidade_series",
      "series",
    ];

    for (const campo of camposObrigatorios) {
      if (!body[campo]) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Campo obrigatório ausente: ${campo}`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    // Validate series array
    if (!Array.isArray(body.series) || body.series.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Series deve ser um array com pelo menos uma série",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate each serie
    for (const serie of body.series) {
      if (!serie.numero || !serie.valor_emissao || serie.valor_emissao <= 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Cada série deve ter numero e valor_emissao maior que zero",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    // Calculate total volume from series
    const volumeTotal = body.series.reduce(
      (sum: number, s: { valor_emissao: number }) => sum + s.valor_emissao,
      0
    );

    if (volumeTotal <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Volume total deve ser maior que zero",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Generate unique emission number
    const agora = new Date();
    const data = agora.toISOString().split("T")[0].replace(/-/g, "");
    const aleatorio = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const numero_emissao = `EM-${data}-${aleatorio}`;

    console.log("[fluxo-1-criar-emissao] Criando emissão:", numero_emissao);

    // Create emission
    const { data: emissao, error: emissaoError } = await supabaseClient
      .from("emissoes")
      .insert({
        numero_emissao,
        demandante_proposta: body.demandante_proposta,
        empresa_destinataria: body.empresa_destinataria,
        categoria: body.categoria,
        oferta: body.oferta,
        veiculo: body.veiculo,
        volume: volumeTotal,
        quantidade_series: body.series.length,
        status_proposta: "rascunho",
      })
      .select()
      .single();

    if (emissaoError) {
      console.error("[fluxo-1-criar-emissao] Erro ao criar emissão:", emissaoError);
      throw emissaoError;
    }

    console.log("[fluxo-1-criar-emissao] Emissão criada:", emissao.id);

    // Save series
    for (const serie of body.series) {
      const { error: serieError } = await supabaseClient
        .from("series")
        .insert({
          id_emissao: emissao.id,
          numero: serie.numero,
          valor_emissao: serie.valor_emissao,
        });

      if (serieError) {
        console.error("[fluxo-1-criar-emissao] Erro ao salvar série:", serieError);
        // Continue even if series insert fails
      }
    }

    // Create empty costs record
    await supabaseClient.from("custos").insert({
      id_emissao: emissao.id,
    });

    // Record in history
    await supabaseClient.from("historico_emissoes").insert({
      id_emissao: emissao.id,
      status_novo: "rascunho",
      motivo: "Emissão criada",
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: emissao,
        message: "Emissão criada com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error) {
    console.error("[fluxo-1-criar-emissao] Erro:", error);
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
