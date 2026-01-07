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

    const body = await req.json();

    // Validar campos obrigatórios
    const camposObrigatorios = [
      "demandante_proposta",
      "empresa_destinataria",
      "categoria",
      "volume",
      "quantidade_series",
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

    // Validar volume
    if (body.volume <= 0) {
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
    if (body.quantidade_series <= 0) {
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

    // Gerar número de emissão único
    const agora = new Date();
    const data = agora.toISOString().split("T")[0].replace(/-/g, "");
    const aleatorio = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const numero_emissao = `EM-${data}-${aleatorio}`;

    // Criar emissão
    const { data: emissao, error: emissaoError } = await supabaseClient
      .from("emissoes")
      .insert({
        numero_emissao,
        demandante_proposta: body.demandante_proposta,
        empresa_destinataria: body.empresa_destinataria,
        categoria: body.categoria,
        volume: parseFloat(body.volume),
        quantidade_series: parseInt(body.quantidade_series),
        status_proposta: "rascunho",
        comercial_id: body.comercial_id || null,
        observacao: body.observacao || null,
      })
      .select()
      .single();

    if (emissaoError) throw emissaoError;

    // Criar dados da empresa se fornecidos
    if (body.dados_empresa) {
      const empresaData = {
        id_emissao: emissao.id,
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

      await supabaseClient.from("dados_empresa").insert(empresaData);
    }

    // Criar custos (inicialmente vazio)
    await supabaseClient.from("custos").insert({
      id_emissao: emissao.id,
    });

    // Registrar no histórico
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
