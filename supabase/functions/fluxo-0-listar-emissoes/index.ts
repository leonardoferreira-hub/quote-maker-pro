import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Obter parâmetros de query
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const comercial_id = url.searchParams.get("comercial_id");
    const categoria = url.searchParams.get("categoria");
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "10");
    const search = url.searchParams.get("search");

    // Construir query
    let query = supabaseClient
      .from("emissoes")
      .select(
        `
        id,
        numero_emissao,
        demandante_proposta,
        empresa_destinataria,
        categoria,
        volume,
        quantidade_series,
        status_proposta,
        data_criacao,
        data_atualizacao,
        usuarios!emissoes_comercial_id_fkey(nome_completo)
      `,
        { count: "exact" }
      );

    // Aplicar filtros
    if (status) {
      query = query.eq("status_proposta", status);
    }
    if (comercial_id) {
      query = query.eq("comercial_id", comercial_id);
    }
    if (categoria) {
      query = query.eq("categoria", categoria);
    }
    if (search) {
      query = query.or(
        `numero_emissao.ilike.%${search}%,demandante_proposta.ilike.%${search}%,empresa_destinataria.ilike.%${search}%`
      );
    }

    // Ordenar por data (mais recentes primeiro)
    query = query.order("data_criacao", { ascending: false });

    // Paginação
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil((count ?? 0) / limit),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
