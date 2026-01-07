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

    if (!id || id === "fluxo-1-atualizar-emissao") {
      return new Response(
        JSON.stringify({ success: false, error: "ID não fornecido" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    // Validar e adicionar campos permitidos
    const camposPermitidos = [
      "demandante_proposta",
      "empresa_destinataria",
      "categoria",
      "volume",
      "quantidade_series",
      "observacao",
      "status_proposta",
    ];

    for (const campo of camposPermitidos) {
      if (body[campo] !== undefined) {
        // Validar volume
        if (campo === "volume" && body[campo] <= 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Volume deve ser maior que zero",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        // Validar quantidade de séries
        if (campo === "quantidade_series" && body[campo] <= 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Quantidade de séries deve ser maior que zero",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }

        updateData[campo] = body[campo];
      }
    }

    // Adicionar timestamp de atualização
    updateData.data_atualizacao = new Date().toISOString();

    // Atualizar emissão
    const { data: emissao, error: emissaoError } = await supabaseClient
      .from("emissoes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (emissaoError) throw emissaoError;

    // Se status foi alterado, registrar no histórico
    if (body.status_proposta) {
      await supabaseClient.from("historico_emissoes").insert({
        id_emissao: id,
        status_novo: body.status_proposta,
        motivo: body.motivo_alteracao || "Status alterado",
      });
    }

    // Atualizar dados da empresa se fornecidos
    if (body.dados_empresa) {
      const empresaData = {
        razao_social: body.dados_empresa.razao_social || null,
        cnpj: body.dados_empresa.cnpj || null,
        logradouro: body.dados_empresa.logradouro || null,
        numero: body.dados_empresa.numero || null,
        complemento: body.dados_empresa.complemento || null,
        bairro: body.dados_empresa.bairro || null,
        cidade: body.dados_empresa.cidade || null,
        estado: body.dados_empresa.estado || null,
        cep: body.dados_empresa.cep || null,
      };

      const { data: empresaExistente } = await supabaseClient
        .from("dados_empresa")
        .select("id")
        .eq("id_emissao", id)
        .single();

      if (empresaExistente) {
        await supabaseClient
          .from("dados_empresa")
          .update(empresaData)
          .eq("id_emissao", id);
      } else {
        await supabaseClient.from("dados_empresa").insert({
          id_emissao: id,
          ...empresaData,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: emissao,
        message: "Emissão atualizada com sucesso",
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
