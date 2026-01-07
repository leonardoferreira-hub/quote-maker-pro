// ============= HOOK PARA CUSTOS VARIÁVEIS =============

import { useState, useCallback } from 'react';
import { fetchCustosPorCombinacao } from '@/lib/supabase';
import { CustosVariaveisCalculador } from '@/lib/custos/CustosVariaveisCalculador';
import { 
  Custo, 
  TotaisCustos, 
  FetchCustosParams, 
  CustodiaDebenture 
} from '@/types/custos';

export function useCustosVariaveis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [custosUpfront, setCustosUpfront] = useState<Custo[]>([]);
  const [custosAnual, setCustosAnual] = useState<Custo[]>([]);
  const [custosMensal, setCustosMensal] = useState<Custo[]>([]);
  const [custodiaDebenture, setCustodiaDebenture] = useState<CustodiaDebenture[]>([]);
  const [totais, setTotais] = useState<TotaisCustos | null>(null);

  /**
   * Carrega custos do backend e calcula valores variáveis
   */
  const carregarCustos = useCallback(async (params: FetchCustosParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📊 Carregando custos para:', params);
      
      const response = await fetchCustosPorCombinacao(params);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar custos');
      }

      console.log('✅ Resposta da API:', response);

      // Calcular custos variáveis para cada periodicidade
      const upfront = CustosVariaveisCalculador.calcularCustosVariaveis(
        response.data?.upfront || [], 
        params.volume, 
        params.series,
        response.custodia_debenture || []
      );
      
      const anual = CustosVariaveisCalculador.calcularCustosVariaveis(
        response.data?.anual || [], 
        params.volume, 
        params.series,
        response.custodia_debenture || []
      );
      
      const mensal = CustosVariaveisCalculador.calcularCustosVariaveis(
        response.data?.mensal || [], 
        params.volume, 
        params.series,
        response.custodia_debenture || []
      );

      setCustosUpfront(upfront);
      setCustosAnual(anual);
      setCustosMensal(mensal);
      setCustodiaDebenture(response.custodia_debenture || []);

      // Calcular totais
      const totaisCalculados = CustosVariaveisCalculador.calcularTotais(upfront, anual, mensal);
      setTotais(totaisCalculados);

      console.log('💰 Custos calculados:', { upfront, anual, mensal, totais: totaisCalculados });
      
      return { success: true, upfront, anual, mensal, totais: totaisCalculados };
    } catch (err) {
      console.error('❌ Erro ao carregar custos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Atualiza um custo específico (edição manual)
   */
  const atualizarCusto = useCallback((
    periodicidade: 'upfront' | 'anual' | 'mensal',
    custoId: string,
    novoValor: number
  ) => {
    const atualizarLista = (lista: Custo[]): Custo[] => {
      return lista.map(custo => {
        if (custo.id === custoId) {
          const grossUpDecimal = CustosVariaveisCalculador.converterGrossUp(custo.gross_up);
          const valorBruto = CustosVariaveisCalculador.aplicarGrossUp(novoValor, grossUpDecimal);
          return {
            ...custo,
            valor_calculado: novoValor,
            valor_bruto: valorBruto,
            editado: true
          };
        }
        return custo;
      });
    };

    switch (periodicidade) {
      case 'upfront':
        setCustosUpfront(prev => atualizarLista(prev));
        break;
      case 'anual':
        setCustosAnual(prev => atualizarLista(prev));
        break;
      case 'mensal':
        setCustosMensal(prev => atualizarLista(prev));
        break;
    }
  }, []);

  /**
   * Recalcula totais após edição manual
   */
  const recalcularTotais = useCallback(() => {
    const totaisCalculados = CustosVariaveisCalculador.calcularTotais(
      custosUpfront, 
      custosAnual, 
      custosMensal
    );
    setTotais(totaisCalculados);
    return totaisCalculados;
  }, [custosUpfront, custosAnual, custosMensal]);

  /**
   * Limpa todos os custos
   */
  const limparCustos = useCallback(() => {
    setCustosUpfront([]);
    setCustosAnual([]);
    setCustosMensal([]);
    setCustodiaDebenture([]);
    setTotais(null);
    setError(null);
  }, []);

  return {
    // Estado
    isLoading,
    error,
    custosUpfront,
    custosAnual,
    custosMensal,
    custodiaDebenture,
    totais,
    
    // Ações
    carregarCustos,
    atualizarCusto,
    recalcularTotais,
    limparCustos,
    
    // Setters (para edição direta)
    setCustosUpfront,
    setCustosAnual,
    setCustosMensal,
    setTotais
  };
}
