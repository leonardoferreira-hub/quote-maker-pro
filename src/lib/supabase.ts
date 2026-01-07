const SUPABASE_URL = 'https://gthtvpujwukbfgokghne.supabase.co/functions/v1';
const SUPABASE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHR2cHVqd3VrYmZnb2tnaG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDU4MjYsImV4cCI6MjA4MzI4MTgyNn0.viQaLgE8Kk32DCtEAUEglxCR8bwBwhrIqAh_JIfdxv4';

const headers = {
  'Authorization': `Bearer ${SUPABASE_TOKEN}`,
  'Content-Type': 'application/json'
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
  const response = await fetch(
    `${SUPABASE_URL}/fluxo-1-criar-emissao`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }
  );
  return response.json();
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
  const response = await fetch(
    `${SUPABASE_URL}/fluxo-1-salvar-custos`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ id_emissao, custos })
    }
  );
  return response.json();
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
