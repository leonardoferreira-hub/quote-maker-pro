// ============= CALCULADOR DE CUSTOS VARIÁVEIS =============

import { Custo, CustodiaDebenture, SerieEmissao, TotaisCustos } from '@/types/custos';

export class CustosVariaveisCalculador {
  
  /**
   * Extrai taxa percentual da fórmula
   * Ex: "0,03% sobre volume" → 0.0003
   */
  static extrairTaxa(formula: string): number {
    const match = formula.match(/(\d+[,.]?\d*)\s*%/);
    if (match) {
      return parseFloat(match[1].replace(',', '.')) / 100;
    }
    return 0;
  }

  /**
   * Extrai valor mínimo da fórmula
   * Ex: "mínimo de R$ 800" → 800
   */
  static extrairMinimo(formula: string): number {
    const match = formula.match(/m[íi]nimo\s+(?:de\s+)?(?:R\$\s*)?(\d+(?:[.,]\d+)?)/i);
    if (match) {
      return parseFloat(match[1].replace('.', '').replace(',', '.'));
    }
    return 0;
  }

  /**
   * Extrai valor máximo da fórmula
   * Ex: "máximo de R$ 5000" → 5000
   */
  static extrairMaximo(formula: string): number {
    const match = formula.match(/m[áa]ximo\s+(?:de\s+)?(?:R\$\s*)?(\d+(?:[.,]\d+)?)/i);
    if (match) {
      return parseFloat(match[1].replace('.', '').replace(',', '.'));
    }
    return Infinity;
  }

  /**
   * Calcula custo percentual com mínimo e máximo
   * Exemplo: Taxa Fiscalização = 0.03% sobre volume, mínimo 800
   */
  static calcularPercentual(volume: number, formula: string): number {
    const taxa = this.extrairTaxa(formula);
    const minimo = this.extrairMinimo(formula);
    const maximo = this.extrairMaximo(formula);
    
    const valorCalculado = volume * taxa;
    return Math.min(Math.max(valorCalculado, minimo), maximo);
  }

  /**
   * Calcula custódia de debênture usando tabela progressiva por série
   * Cada série usa a faixa correspondente ao seu valor
   */
  static calcularCustodiaDebenture(
    series: SerieEmissao[], 
    tabela: CustodiaDebenture[]
  ): number {
    if (!tabela || tabela.length === 0) {
      console.warn('Tabela de custódia de debênture vazia');
      return 0;
    }

    let totalMensal = 0;
    
    for (const serie of series) {
      const faixa = tabela.find(
        f => serie.valor_emissao >= f.valor_minimo && 
             serie.valor_emissao <= f.valor_maximo
      );
      if (faixa) {
        totalMensal += serie.valor_emissao * faixa.taxa;
        console.log(`Série ${serie.numero}: ${serie.valor_emissao} * ${faixa.taxa} = ${serie.valor_emissao * faixa.taxa}`);
      }
    }
    
    return totalMensal;
  }

  /**
   * Aplica gross up ao valor
   * Gross up de 16.33% = valor * 1.1633
   */
  static aplicarGrossUp(valor: number, grossUp: number): number {
    return valor * (1 + grossUp);
  }

  /**
   * Converte gross up de percentual (16.33) para decimal (0.1633)
   */
  static converterGrossUp(grossUp: number): number {
    // Se já está em decimal (menor que 1), retorna como está
    if (grossUp < 1) return grossUp;
    // Senão, divide por 100
    return grossUp / 100;
  }

  /**
   * Calcula todos os custos variáveis de uma lista
   */
  static calcularCustosVariaveis(
    custos: Custo[], 
    volume: number, 
    series: SerieEmissao[],
    custodiaDebenture: CustodiaDebenture[],
    periodicidade?: 'upfront' | 'anual' | 'mensal'
  ): Custo[] {
    console.log(`📊 Calculando custos (${periodicidade || 'todos'}):`, { custos, volume, series });
    
    return custos.map(custo => {
      let valorCalculado = 0;

      // Custos percentuais: calcular baseado no volume
      if (custo.tipo_preco === 'Percentual' && custo.formula_descricao) {
        valorCalculado = this.calcularPercentual(volume, custo.formula_descricao);
        console.log(`💹 Percentual ${custo.papel}: fórmula="${custo.formula_descricao}" → ${valorCalculado}`);
      } 
      // Custos variáveis: calcular baseado nas séries (custódia)
      else if (custo.tipo_preco === 'Variável') {
        const papelLower = custo.papel.toLowerCase();
        if (papelLower.includes('custódia') || 
            papelLower.includes('custodia') ||
            papelLower.includes('depositária') ||
            papelLower.includes('depositaria')) {
          valorCalculado = this.calcularCustodiaDebenture(series, custodiaDebenture);
          console.log(`📦 Variável ${custo.papel}: ${valorCalculado}`);
        } else if (custo.formula_descricao) {
          // Outros custos variáveis com fórmula
          valorCalculado = this.calcularPercentual(volume, custo.formula_descricao);
          console.log(`📊 Variável c/ fórmula ${custo.papel}: ${valorCalculado}`);
        }
      } 
      // Custos fixos: usar o valor da periodicidade correta
      else if (custo.tipo_preco === 'Fixo') {
        // Priorizar o valor da periodicidade específica
        if (periodicidade === 'upfront' || custo.periodicidade === 'upfront') {
          valorCalculado = custo.preco_upfront || 0;
        } else if (periodicidade === 'anual' || custo.periodicidade === 'anual') {
          valorCalculado = custo.preco_anual || 0;
        } else if (periodicidade === 'mensal' || custo.periodicidade === 'mensal') {
          valorCalculado = custo.preco_mensal || 0;
        } else {
          // Fallback: usar qualquer valor disponível
          valorCalculado = custo.preco_upfront || custo.preco_anual || custo.preco_mensal || 0;
        }
        console.log(`💵 Fixo ${custo.papel}: ${valorCalculado}`);
      }

      const grossUpDecimal = this.converterGrossUp(custo.gross_up || 0);
      const valorBruto = this.aplicarGrossUp(valorCalculado, grossUpDecimal);

      console.log(`✅ ${custo.papel}: calculado=${valorCalculado}, grossUp=${grossUpDecimal}, bruto=${valorBruto}`);

      return {
        ...custo,
        valor_calculado: valorCalculado,
        valor_bruto: valorBruto
      };
    });
  }

  /**
   * Calcula totais de custos por periodicidade
   */
  static calcularTotais(
    upfront: Custo[], 
    anual: Custo[], 
    mensal: Custo[]
  ): TotaisCustos {
    const total_upfront = upfront.reduce((sum, c) => sum + (c.valor_bruto || 0), 0);
    const total_anual = anual.reduce((sum, c) => sum + (c.valor_bruto || 0), 0);
    const total_mensal = mensal.reduce((sum, c) => sum + (c.valor_bruto || 0), 0);
    
    // Primeiro ano: upfront + anual + (mensal * 12)
    const total_primeiro_ano = total_upfront + total_anual + (total_mensal * 12);
    // Anos subsequentes: anual + (mensal * 12)
    const total_anos_subsequentes = total_anual + (total_mensal * 12);

    return {
      total_upfront,
      total_anual,
      total_mensal,
      total_primeiro_ano,
      total_anos_subsequentes
    };
  }

  /**
   * Formata valor em moeda brasileira
   */
  static formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }
}
