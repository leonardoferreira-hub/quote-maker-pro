// ============= TIPOS PARA SISTEMA DE CUSTOS DINÂMICOS =============

// Interface base para custo individual
export interface Custo {
  id: string;
  papel: string;                    // Ex: "Securitizadora", "Taxa Fiscalização"
  id_prestador?: string;            // UUID do prestador (se aplicável)
  nome_prestador?: string;          // Nome do prestador
  preco_upfront?: number;           // Valor fixo upfront
  preco_anual?: number;             // Valor anual
  preco_mensal?: number;            // Valor mensal
  tipo_preco: 'Fixo' | 'Variável' | 'Percentual';
  formula_descricao?: string;       // Ex: "0,03% sobre o volume, mínimo 800"
  gross_up: number;                 // Ex: 0.1633 (16.33%)
  valor_calculado?: number;         // Valor após cálculo
  valor_bruto?: number;             // Valor com gross up aplicado
  editado?: boolean;                // Flag se foi editado manualmente
  periodicidade?: 'upfront' | 'anual' | 'mensal';
}

// Dados de série individual
export interface SerieEmissao {
  numero: number;
  valor_emissao: number;
}

// Dados da emissão retornados pela API
export interface EmissaoData {
  volume: number;
  series: SerieEmissao[];
}

// Tabela progressiva de custódia de debênture
export interface CustodiaDebenture {
  valor_minimo: number;
  valor_maximo: number;
  taxa: number;               // Ex: 0.0000175
}

// Totais calculados
export interface TotaisCustos {
  total_upfront: number;
  total_anual: number;
  total_mensal: number;
  total_primeiro_ano: number;
  total_anos_subsequentes: number;
}

// Resposta completa da Edge Function
export interface CustosPorCombinacaoResponse {
  success: boolean;
  data: {
    upfront: Custo[];
    anual: Custo[];
    mensal: Custo[];
  };
  emissao: EmissaoData;
  custodia_debenture: CustodiaDebenture[];
  totais: TotaisCustos;
  error?: string;
}

// Parâmetros para buscar custos
export interface FetchCustosParams {
  categoria: string;
  tipo_oferta: string;
  veiculo?: string;
  lastro?: string;
  volume: number;
  series: SerieEmissao[];
}

// Custos agrupados por periodicidade
export interface CustosAgrupados {
  upfront: Custo[];
  anual: Custo[];
  mensal: Custo[];
}
