import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];
    const body = await req.json();

    if (!id || id === "fluxo-2-finalizar-proposta") {
      return new Response(
        JSON.stringify({ success: false, error: "ID não fornecido" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validar status
    const statusPermitidos = ["rascunho", "enviada", "aceita", "rejeitada"];
    const novoStatus = body.status || "enviada";

    if (!statusPermitidos.includes(novoStatus)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Status inválido. Permitidos: ${statusPermitidos.join(", ")}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Atualizar status para "enviada" ou status fornecido
    const { data: emissao, error: emissaoError } = await supabaseClient
      .from("emissoes")
      .update({
        status_proposta: novoStatus,
        data_atualizacao: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (emissaoError) throw emissaoError;

    // Registrar no histórico
    await supabaseClient.from("historico_emissoes").insert({
      id_emissao: id,
      status_novo: novoStatus,
      motivo: body.motivo || "Proposta finalizada",
    });

    // Se houver email para envio, registrar
    if (body.email_cliente) {
      // Aqui você pode integrar com um serviço de email
      // Por enquanto, apenas registramos
      console.log(`Email seria enviado para: ${body.email_cliente}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: emissao,
        message: `Proposta finalizada e status alterado para "${novoStatus}"`,
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
