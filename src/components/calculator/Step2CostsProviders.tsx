import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Users, Calculator, Plus, X, Pencil } from 'lucide-react';
import { useState } from 'react';

interface Provider {
  id: string;
  nome: string;
  precoDefault: number;
  precoAtual: number;
  selecionado: boolean;
  motivo: string;
  editing?: boolean;
}

interface Step2Props {
  providers: Provider[];
  volume: number;
  onChange: (providers: Provider[]) => void;
}

const defaultProviders: Provider[] = [
  { id: 'agente_fiduciario', nome: 'Agente Fiduciário', precoDefault: 15000, precoAtual: 15000, selecionado: true, motivo: '' },
  { id: 'securitizadora', nome: 'Securitizadora', precoDefault: 20000, precoAtual: 20000, selecionado: true, motivo: '' },
  { id: 'liquidante', nome: 'Liquidante', precoDefault: 8000, precoAtual: 8000, selecionado: true, motivo: '' },
  { id: 'custodiante', nome: 'Custodiante', precoDefault: 5000, precoAtual: 5000, selecionado: false, motivo: '' },
  { id: 'auditor', nome: 'Auditor', precoDefault: 3000, precoAtual: 3000, selecionado: false, motivo: '' },
];

export function Step2CostsProviders({ providers, volume, onChange }: Step2Props) {
  const activeProviders = providers.length > 0 ? providers : defaultProviders;
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleProviderChange = (id: string, field: keyof Provider, value: unknown) => {
    const updated = activeProviders.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onChange(updated);
  };

  const toggleProvider = (id: string) => {
    const provider = activeProviders.find(p => p.id === id);
    if (provider) {
      handleProviderChange(id, 'selecionado', !provider.selecionado);
    }
  };

  const removeProvider = (id: string) => {
    handleProviderChange(id, 'selecionado', false);
    handleProviderChange(id, 'precoAtual', activeProviders.find(p => p.id === id)?.precoDefault || 0);
    handleProviderChange(id, 'motivo', '');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalCosts = activeProviders
    .filter(p => p.selecionado)
    .reduce((sum, p) => sum + p.precoAtual, 0);

  const percentCosts = volume > 0 ? ((totalCosts / volume) * 100).toFixed(2) : '0.00';

  const selectedProviders = activeProviders.filter(p => p.selecionado);
  const unselectedProviders = activeProviders.filter(p => !p.selecionado);

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Custos & Prestadores</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Providers */}
        {selectedProviders.map((provider) => (
          <div
            key={provider.id}
            className="p-4 rounded-xl border border-primary/30 bg-primary/5 animate-fade-in"
          >
            <div className="flex items-start gap-4">
              <Checkbox
                checked={true}
                onCheckedChange={() => toggleProvider(provider.id)}
                className="mt-1"
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{provider.nome}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Padrão: {formatCurrency(provider.precoDefault)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(editingId === provider.id ? null : provider.id)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProvider(provider.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingId === provider.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <div className="space-y-2">
                      <Label>Preço nesta Emissão</Label>
                      <Input
                        type="number"
                        value={provider.precoAtual}
                        onChange={(e) =>
                          handleProviderChange(provider.id, 'precoAtual', Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo da Alteração</Label>
                      <Input
                        placeholder="Ex: Desconto por volume"
                        value={provider.motivo}
                        onChange={(e) =>
                          handleProviderChange(provider.id, 'motivo', e.target.value)
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">Nesta Emissão:</span>{' '}
                      <span className="font-medium">{formatCurrency(provider.precoAtual)}</span>
                    </span>
                    {provider.motivo && (
                      <span className="text-muted-foreground">
                        Motivo: {provider.motivo}
                      </span>
                    )}
                    {provider.precoAtual !== provider.precoDefault && !provider.motivo && (
                      <span className="text-warning text-xs">
                        (preço alterado)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Unselected Providers */}
        {unselectedProviders.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Prestadores disponíveis:</p>
            {unselectedProviders.map((provider) => (
              <div
                key={provider.id}
                className="p-4 rounded-xl border border-border bg-muted/30 mb-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => toggleProvider(provider.id)}
                    />
                    <div>
                      <h4 className="font-medium text-muted-foreground">{provider.nome}</h4>
                      <span className="text-sm text-muted-foreground">
                        Padrão: {formatCurrency(provider.precoDefault)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProvider(provider.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Resumo de Custos</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Custos Selecionados</p>
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

export { defaultProviders };
export type { Provider };
