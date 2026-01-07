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

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id_emissao = pathParts[pathParts.length - 1];

    if (!id_emissao || id_emissao === "fluxo-2-gerar-pdf") {
      return new Response(
        JSON.stringify({ success: false, error: "ID de emissão não fornecido" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Buscar dados completos da emissão
    const { data: emissao, error: emissaoError } = await supabaseClient
      .from("emissoes")
      .select("*")
      .eq("id", id_emissao)
      .single();

    if (emissaoError) throw emissaoError;

    // Buscar dados da empresa
    const { data: empresa } = await supabaseClient
      .from("dados_empresa")
      .select("*")
      .eq("id_emissao", id_emissao)
      .single();

    // Buscar custos
    const { data: custos } = await supabaseClient
      .from("custos")
      .select("*")
      .eq("id_emissao", id_emissao)
      .single();

    // Buscar prestadores
    const { data: prestadores } = await supabaseClient
      .from("prestadores")
      .select(
        `
        papel,
        terceiros(nome, cnpj, email)
      `
      )
      .eq("id_emissao", id_emissao);

    // Buscar séries
    const { data: series } = await supabaseClient
      .from("series")
      .select("*")
      .eq("id_emissao", id_emissao)
      .order("numero_serie");

    // Buscar assinantes
    const { data: assinantes } = await supabaseClient
      .from("assinantes")
      .select("*")
      .eq("id_emissao", id_emissao)
      .order("ordem");

    // Gerar HTML do PDF
    const html = gerarHtmlPDF({
      emissao,
      empresa,
      custos,
      prestadores,
      series,
      assinantes,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          html,
          emissao_id: id_emissao,
          numero_emissao: emissao.numero_emissao,
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

function gerarHtmlPDF(dados: any): string {
  const { emissao, empresa, custos, prestadores, series, assinantes } = dados;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cotação ${emissao.numero_emissao}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
          background: #f5f5f5;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 3px solid #1e40af;
          margin-bottom: 30px;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1e40af;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header-info {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          font-size: 18px;
          color: #1e40af;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background-color: #f0f0f0;
          color: #333;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #eee;
        }
        tr:hover {
          background-color: #f9f9f9;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 10px;
        }
        .info-item {
          padding: 10px;
          background: #f9f9f9;
          border-left: 3px solid #1e40af;
          border-radius: 4px;
        }
        .info-item strong {
          display: block;
          color: #1e40af;
          margin-bottom: 5px;
        }
        .info-item span {
          color: #666;
        }
        .totals {
          background: #f0f7ff;
          padding: 20px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #ddd;
        }
        .total-row.grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          border-bottom: 2px solid #1e40af;
          margin-top: 10px;
          padding-top: 10px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        .assinantes {
          display: flex;
          justify-content: space-around;
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #ddd;
        }
        .assinante {
          text-align: center;
          width: 200px;
        }
        .assinante-linha {
          border-top: 1px solid #333;
          margin-top: 40px;
          padding-top: 5px;
          font-size: 12px;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          background: #e0e0e0;
          border-radius: 4px;
          font-size: 12px;
          margin-right: 5px;
        }
        .badge.status-rascunho { background: #fff3cd; color: #856404; }
        .badge.status-enviada { background: #d1ecf1; color: #0c5460; }
        .badge.status-aceita { background: #d4edda; color: #155724; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <h1>📄 COTAÇÃO DE SECURITIZAÇÃO</h1>
          <div class="header-info">
            <div>
              <strong>Número:</strong> ${emissao.numero_emissao}
            </div>
            <div>
              <strong>Data:</strong> ${formatarData(emissao.data_criacao)}
            </div>
            <div>
              <span class="badge badge-status-${emissao.status_proposta}">
                ${emissao.status_proposta.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <!-- DADOS DA OPERAÇÃO -->
        <div class="section">
          <h2>📋 Dados da Operação</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Demandante:</strong>
              <span>${emissao.demandante_proposta}</span>
            </div>
            <div class="info-item">
              <strong>Empresa Destinatária:</strong>
              <span>${emissao.empresa_destinataria}</span>
            </div>
            <div class="info-item">
              <strong>Categoria:</strong>
              <span>${emissao.categoria}</span>
            </div>
            <div class="info-item">
              <strong>Volume:</strong>
              <span>${formatarMoeda(emissao.volume)}</span>
            </div>
            <div class="info-item">
              <strong>Quantidade de Séries:</strong>
              <span>${emissao.quantidade_series}</span>
            </div>
            <div class="info-item">
              <strong>Status:</strong>
              <span>${emissao.status_proposta}</span>
            </div>
          </div>
        </div>

        <!-- DADOS DA EMPRESA -->
        ${
          empresa
            ? `
        <div class="section">
          <h2>🏢 Dados da Empresa</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Razão Social:</strong>
              <span>${empresa.razao_social || "-"}</span>
            </div>
            <div class="info-item">
              <strong>CNPJ:</strong>
              <span>${empresa.cnpj || "-"}</span>
            </div>
            <div class="info-item">
              <strong>Endereço:</strong>
              <span>${empresa.logradouro || ""} ${empresa.numero || ""}, ${empresa.bairro || ""}</span>
            </div>
            <div class="info-item">
              <strong>Cidade/Estado:</strong>
              <span>${empresa.cidade || ""} - ${empresa.estado || ""}</span>
            </div>
          </div>
        </div>
        `
            : ""
        }

        <!-- PRESTADORES -->
        ${
          prestadores && prestadores.length > 0
            ? `
        <div class="section">
          <h2>🤝 Prestadores</h2>
          <table>
            <thead>
              <tr>
                <th>Papel</th>
                <th>Prestador</th>
                <th>CNPJ</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${prestadores
                .map(
                  (p: any) => `
                <tr>
                  <td>${p.papel}</td>
                  <td>${p.terceiros?.nome || "-"}</td>
                  <td>${p.terceiros?.cnpj || "-"}</td>
                  <td>${p.terceiros?.email || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        <!-- CUSTOS -->
        ${
          custos
            ? `
        <div class="section">
          <h2>💰 Custos</h2>
          <div class="totals">
            <div class="total-row">
              <span>Total Upfront:</span>
              <strong>${formatarMoeda(custos.total_upfront || 0)}</strong>
            </div>
            <div class="total-row">
              <span>Total Recorrente (${custos.periodicidade_recorrente || "anual"}):</span>
              <strong>${formatarMoeda(custos.total_recorrente || 0)}</strong>
            </div>
            <div class="total-row">
              <span>Total Recorrência:</span>
              <strong>${formatarMoeda(custos.total_recorrencia || 0)}</strong>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL GERAL:</span>
              <strong>${formatarMoeda(
                (custos.total_upfront || 0) +
                  (custos.total_recorrente || 0) +
                  (custos.total_recorrencia || 0)
              )}</strong>
            </div>
          </div>
        </div>
        `
            : ""
        }

        <!-- SÉRIES -->
        ${
          series && series.length > 0
            ? `
        <div class="section">
          <h2>📊 Séries</h2>
          <table>
            <thead>
              <tr>
                <th>Série</th>
                <th>Valor de Emissão</th>
                <th>Data de Emissão</th>
                <th>Data de Vencimento</th>
                <th>Taxa de Juros</th>
              </tr>
            </thead>
            <tbody>
              ${series
                .map(
                  (s: any) => `
                <tr>
                  <td>${s.numero_serie}</td>
                  <td>${formatarMoeda(s.valor_emissao)}</td>
                  <td>${formatarData(s.data_emissao)}</td>
                  <td>${formatarData(s.data_vencimento)}</td>
                  <td>${s.taxa_juros || "-"}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        <!-- ASSINANTES -->
        ${
          assinantes && assinantes.length > 0
            ? `
        <div class="section">
          <h2>✍️ Assinantes</h2>
          <div class="assinantes">
            ${assinantes
              .map(
                (a: any) => `
              <div class="assinante">
                <div class="assinante-linha"></div>
                <div>${a.nome}</div>
                <div style="font-size: 11px; color: #999;">CPF: ${a.cpf || "-"}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }

        <!-- FOOTER -->
        <div class="footer">
          <p>Este documento foi gerado automaticamente pelo sistema de cotações de securitização.</p>
          <p>Data de geração: ${formatarData(new Date().toISOString())}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
