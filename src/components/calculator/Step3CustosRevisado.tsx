// ============= STEP 3: REVISÃO DE CUSTOS CALCULADOS =============

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DollarSign, Calendar, CalendarDays, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Custo, TotaisCustos, SerieEmissao } from '@/types/custos';
import { CustosVariaveisCalculador } from '@/lib/custos/CustosVariaveisCalculador';
import { useEffect } from 'react';

interface Step3Props {
  isLoading: boolean;
  error: string | null;
  custosUpfront: Custo[];
  custosAnual: Custo[];
  custosMensal: Custo[];
  totais: TotaisCustos | null;
  volume: number;
  series: SerieEmissao[];
  onRetry: () => void;
  onCustoChange: (periodicidade: 'upfront' | 'anual' | 'mensal', custoId: string, novoValor: number) => void;
  onRecalcularTotais: () => void;
}

// Componente para badge de tipo de custo
function TipoBadge({ tipo }: { tipo: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
    'Fixo': { variant: 'default', label: 'Fixo' },
    'Variável': { variant: 'secondary', label: 'Var' },
    'Percentual': { variant: 'outline', label: '%' }
  };
  
  const config = variants[tipo] || variants['Fixo'];
  
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}

// Componente para tabela de custos
function TabelaCustos({ 
  custos, 
  periodicidade,
  campoValor,
  onCustoChange 
}: { 
  custos: Custo[];
  periodicidade: 'upfront' | 'anual' | 'mensal';
  campoValor: 'preco_upfront' | 'preco_anual' | 'preco_mensal';
  onCustoChange: (periodicidade: 'upfront' | 'anual' | 'mensal', custoId: string, novoValor: number) => void;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    // Se o valor for menor que 1, assume que já está em decimal
    const percent = value < 1 ? value * 100 : value;
    return `${percent.toFixed(2)}%`;
  };

  if (custos.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum custo nesta categoria
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">Papel/Prestador</TableHead>
            <TableHead className="w-[150px]">Valor (R$)</TableHead>
            <TableHead className="w-[100px]">Gross Up</TableHead>
            <TableHead className="w-[150px]">Valor Bruto</TableHead>
            <TableHead className="w-[80px]">Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {custos.map((custo) => (
            <TableRow key={custo.id} className={custo.editado ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
              <TableCell className="font-medium">
                <div>
                  <span>{custo.papel}</span>
                  {custo.nome_prestador && (
                    <span className="text-xs text-muted-foreground block">{custo.nome_prestador}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <CurrencyInput
                  value={custo.valor_calculado || custo[campoValor] || 0}
                  onChange={(value) => onCustoChange(periodicidade, custo.id, value)}
                  className="max-w-[140px]"
                />
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">{formatPercent(custo.gross_up)}</span>
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(custo.valor_bruto || 0)}
              </TableCell>
              <TableCell>
                <TipoBadge tipo={custo.tipo_preco} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Componente principal
export function Step3CustosRevisado({
  isLoading,
  error,
  custosUpfront,
  custosAnual,
  custosMensal,
  totais,
  volume,
  series,
  onRetry,
  onCustoChange,
  onRecalcularTotais
}: Step3Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Recalcular totais quando custos mudam
  useEffect(() => {
    if (custosUpfront.length > 0 || custosAnual.length > 0 || custosMensal.length > 0) {
      onRecalcularTotais();
    }
  }, [custosUpfront, custosAnual, custosMensal]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 card-shadow">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const totalUpfront = custosUpfront.reduce((sum, c) => sum + (c.valor_bruto || 0), 0);
  const totalAnual = custosAnual.reduce((sum, c) => sum + (c.valor_bruto || 0), 0);
  const totalMensal = custosMensal.reduce((sum, c) => sum + (c.valor_bruto || 0), 0);

  const percentualVolume = volume > 0 && totais ? ((totais.total_primeiro_ano / volume) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Informações da Emissão */}
      <Card className="border-0 card-shadow bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Volume Total:</span>
              <span className="font-semibold ml-2">{formatCurrency(volume)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Séries:</span>
              <span className="font-semibold ml-2">{series.length}</span>
            </div>
            {series.map(s => (
              <div key={s.numero}>
                <span className="text-muted-foreground">Série {s.numero}:</span>
                <span className="font-semibold ml-2">{formatCurrency(s.valor_emissao)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Despesas Upfront */}
      <Card className="border-0 card-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-lg">DESPESAS UP FRONT (FLAT)</CardTitle>
            </div>
            <Badge variant="outline" className="text-green-600">
              Total: {formatCurrency(totalUpfront)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <TabelaCustos 
            custos={custosUpfront} 
            periodicidade="upfront"
            campoValor="preco_upfront"
            onCustoChange={onCustoChange}
          />
        </CardContent>
      </Card>

      {/* Despesas Anuais */}
      <Card className="border-0 card-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">DESPESAS ANUAIS</CardTitle>
            </div>
            <Badge variant="outline" className="text-blue-600">
              Total: {formatCurrency(totalAnual)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <TabelaCustos 
            custos={custosAnual} 
            periodicidade="anual"
            campoValor="preco_anual"
            onCustoChange={onCustoChange}
          />
        </CardContent>
      </Card>

      {/* Despesas Mensais */}
      <Card className="border-0 card-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <CalendarDays className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg">DESPESAS MENSAIS</CardTitle>
            </div>
            <Badge variant="outline" className="text-purple-600">
              Total: {formatCurrency(totalMensal)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <TabelaCustos 
            custos={custosMensal} 
            periodicidade="mensal"
            campoValor="preco_mensal"
            onCustoChange={onCustoChange}
          />
        </CardContent>
      </Card>

      {/* Totais */}
      <Card className="border-0 card-shadow bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">CUSTO TOTAL DA OPERAÇÃO</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-4 card-shadow">
              <p className="text-sm text-muted-foreground mb-1">Primeiro Ano</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totais?.total_primeiro_ano || 0)}
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 card-shadow">
              <p className="text-sm text-muted-foreground mb-1">Anos Subsequentes</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totais?.total_anos_subsequentes || 0)}
              </p>
              <p className="text-xs text-muted-foreground">/ano</p>
            </div>
            <div className="bg-card rounded-lg p-4 card-shadow">
              <p className="text-sm text-muted-foreground mb-1">% do Volume</p>
              <p className="text-2xl font-bold text-orange-600">{percentualVolume}%</p>
              <p className="text-xs text-muted-foreground">Volume: {formatCurrency(volume)}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Upfront</p>
                <p className="font-semibold text-green-600">{formatCurrency(totalUpfront)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Anual</p>
                <p className="font-semibold text-blue-600">{formatCurrency(totalAnual)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Mensal × 12</p>
                <p className="font-semibold text-purple-600">{formatCurrency(totalMensal * 12)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export type { Step3Props };
