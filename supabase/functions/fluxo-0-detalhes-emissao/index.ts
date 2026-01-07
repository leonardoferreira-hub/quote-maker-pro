import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // Extrair ID da URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    if (!id || id === "fluxo-0-detalhes-emissao") {
      return new Response(
        JSON.stringify({ success: false, error: "ID não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Buscar emissão
    const { data: emissao, error: emissaoError } = await supabaseClient
      .from("emissoes")
      .select("*")
      .eq("id", id)
      .single();

    if (emissaoError) throw emissaoError;

    // Buscar dados da empresa
    const { data: empresa } = await supabaseClient
      .from("dados_empresa")
      .select("*")
      .eq("id_emissao", id)
      .single();

    // Buscar custos
    const { data: custos } = await supabaseClient
      .from("custos")
      .select("*")
      .eq("id_emissao", id)
      .single();

    // Buscar prestadores
    const { data: prestadores } = await supabaseClient
      .from("prestadores")
      .select(
        `
        id,
        papel,
        terceiros(id, nome, cnpj, email)
      `
      )
      .eq("id_emissao", id);

    // Buscar séries
    const { data: series } = await supabaseClient
      .from("series")
      .select("*")
      .eq("id_emissao", id)
      .order("numero_serie");

    // Buscar assinantes
    const { data: assinantes } = await supabaseClient
      .from("assinantes")
      .select("*")
      .eq("id_emissao", id)
      .order("ordem");

    // Buscar histórico
    const { data: historico } = await supabaseClient
      .from("historico_emissoes")
      .select("*")
      .eq("id_emissao", id)
      .order("criado_em", { ascending: false });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          emissao,
          empresa,
          custos,
          prestadores,
          series,
          assinantes,
          historico,
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
