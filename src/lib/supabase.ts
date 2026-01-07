const SUPABASE_URL = 'https://gthtvpujwukbfgokghne.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHR2cHVqd3VrYmZnb2tnaG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDU4MjYsImV4cCI6MjA4MzI4MTgyNn0.viQaLgE8Kk32DCtEAUEglxCR8bwBwhrIqAh_JIfdxv4';

const headers = {
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
};

export interface Emissao {
  id: string;
  numero_emissao: string;
  demandante_proposta: string;
  empresa_destinataria?: string;
  categoria: 'DEB' | 'CRA' | 'CRI' | 'NC' | 'CR';
  volume: number;
  quantidade_series?: number;
  valor_mobiliario?: number;
  status_proposta: string;
  data_criacao: string;
  observacao?: string;
}

export interface Custo {
  tipo: string;
  valor: number;
  descricao?: string;
}

// FLUXO 0
export async function listarEmissoes(page = 1, limit = 10) {
  const response = await fetch(
    `${SUPABASE_URL}/fluxo-0-listar-emissoes?page=${page}&limit=${limit}`,
    { headers }
  );
  return response.json();
}

export async function detalhesEmissao(id: string) {
  const response = await fetch(
    `${SUPABASE_URL}/fluxo-0-detalhes-emissao?id=${id}`,
    { headers }
  );
  return response.json();
}

// FLUXO 1
export async function criarEmissao(data: Partial<Emissao>) {
  const url = `${SUPABASE_URL}/fluxo-1-criar-emissao`;
  console.log('🌐 [criarEmissao] POST', url, data);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const text = await response.text();
    console.log('📩 [criarEmissao] status:', response.status, 'body:', text);

    // pode ser texto não-JSON em erro
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: `Resposta não-JSON (${response.status}): ${text}`,
      };
    }
  } catch (err) {
    // "Failed to fetch" costuma ser CORS / função não deployada / falha de rede
    console.error('💥 [criarEmissao] fetch falhou:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Falha de rede ao chamar ${url}: ${msg}`,
    };
  }
}

export async function atualizarEmissao(id: string, data: Partial<Emissao>) {
  const response = await fetch(
    `${SUPABASE_URL}/fluxo-1-atualizar-emissao`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, ...data })
    }
  );
  return response.json();
}

export async function salvarCustos(id_emissao: string, custos: Custo[]) {
  const url = `${SUPABASE_URL}/fluxo-1-salvar-custos`;
  console.log('🌐 [salvarCustos] POST', url, { id_emissao, custosCount: custos.length });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id_emissao, custos }),
    });

    const text = await response.text();
    console.log('📩 [salvarCustos] status:', response.status, 'body:', text);

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: `Resposta não-JSON (${response.status}): ${text}`,
      };
    }
  } catch (err) {
    console.error('💥 [salvarCustos] fetch falhou:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Falha de rede ao chamar ${url}: ${msg}`,
    };
  }
}

// FLUXO 2
export async function gerarPDF(id: string) {
  const response = await fetch(
    `${SUPABASE_URL}/fluxo-2-gerar-pdf?id=${id}`,
    { headers }
  );
  return response.json();
}

export async function finalizarProposta(id: string, status: string, data_envio?: string) {
  const response = await fetch(
    `${SUPABASE_URL}/fluxo-2-finalizar-proposta`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, status, data_envio })
    }
  );
  return response.json();
}

// ============= FLUXO CUSTOS - NOVA FUNÇÃO =============

export interface FetchCustosParams {
  categoria: string;
  tipo_oferta: string;
  veiculo?: string;
  lastro?: string;
  volume: number;
  series: { numero: number; valor_emissao: number }[];
}

export async function fetchCustosPorCombinacao(params: FetchCustosParams) {
  try {
    console.log('📊 Buscando custos para:', params);
    
    const response = await fetch(
      `${SUPABASE_URL}/fluxo_custos_por_combinacao`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          categoria: params.categoria,
          tipo_oferta: params.tipo_oferta,
          veiculo: params.veiculo || null,
          lastro: params.lastro || null,
          volume: params.volume,
          series: params.series
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Resposta da API:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar custos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar custos',
      data: { upfront: [], anual: [], mensal: [] },
      custodia_debenture: [],
      totais: { total_upfront: 0, total_anual: 0, total_mensal: 0, total_primeiro_ano: 0 }
    };
  }
}
