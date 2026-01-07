import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus, Trash2 } from 'lucide-react';

interface Cost {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
}

interface Step3Props {
  costs: Cost[];
  volume: number;
  onChange: (costs: Cost[]) => void;
}

export function Step3Costs({ costs, volume, onChange }: Step3Props) {
  const addCost = () => {
    const newCost: Cost = {
      id: `cost-${Date.now()}`,
      tipo: '',
      valor: 0,
      descricao: '',
    };
    onChange([...costs, newCost]);
  };

  const removeCost = (id: string) => {
    onChange(costs.filter((c) => c.id !== id));
  };

  const updateCost = (id: string, field: keyof Cost, value: unknown) => {
    onChange(costs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const totalCosts = costs.reduce((sum, c) => sum + (c.valor || 0), 0);
  const percentCosts = volume > 0 ? ((totalCosts / volume) * 100).toFixed(2) : '0.00';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Custos Detalhados</CardTitle>
          </div>
          <Button onClick={addCost} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Custo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {costs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum custo adicionado ainda.</p>
            <p className="text-sm">Clique em "Adicionar Custo" para começar.</p>
          </div>
        ) : (
          costs.map((cost, index) => (
            <div
              key={cost.id}
              className="p-4 rounded-xl border border-border bg-card animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Custo</Label>
                    <Input
                      placeholder="Ex: Taxa de Estruturação"
                      value={cost.tipo}
                      onChange={(e) => updateCost(cost.id, 'tipo', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={cost.valor || ''}
                      onChange={(e) => updateCost(cost.id, 'valor', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      placeholder="Descrição opcional"
                      value={cost.descricao}
                      onChange={(e) => updateCost(cost.id, 'descricao', e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCost(cost.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {/* Summary */}
        <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total de Custos</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalCosts)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Volume da Emissão</p>
              <p className="text-2xl font-bold">{formatCurrency(volume)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">% de Custos</p>
              <p className="text-2xl font-bold text-warning">{percentCosts}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
