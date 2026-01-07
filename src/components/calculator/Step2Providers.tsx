import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Users } from 'lucide-react';

interface Provider {
  id: string;
  nome: string;
  precoDefault: number;
  precoAtual: number;
  selecionado: boolean;
  motivo: string;
}

interface Step2Props {
  providers: Provider[];
  onChange: (providers: Provider[]) => void;
}

const defaultProviders: Provider[] = [
  { id: 'agente_fiduciario', nome: 'Agente Fiduciário', precoDefault: 15000, precoAtual: 15000, selecionado: true, motivo: '' },
  { id: 'securitizadora', nome: 'Securitizadora', precoDefault: 20000, precoAtual: 20000, selecionado: true, motivo: '' },
  { id: 'liquidante', nome: 'Liquidante', precoDefault: 8000, precoAtual: 8000, selecionado: true, motivo: '' },
  { id: 'custodiante', nome: 'Custodiante', precoDefault: 5000, precoAtual: 5000, selecionado: false, motivo: '' },
  { id: 'auditor', nome: 'Auditor', precoDefault: 3000, precoAtual: 3000, selecionado: false, motivo: '' },
];

export function Step2Providers({ providers, onChange }: Step2Props) {
  const activeProviders = providers.length > 0 ? providers : defaultProviders;

  const handleProviderChange = (id: string, field: keyof Provider, value: unknown) => {
    const updated = activeProviders.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onChange(updated);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Prestadores & Preços</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeProviders.map((provider) => (
          <div
            key={provider.id}
            className={`p-4 rounded-xl border transition-all ${
              provider.selecionado
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <Checkbox
                checked={provider.selecionado}
                onCheckedChange={(checked) =>
                  handleProviderChange(provider.id, 'selecionado', checked)
                }
                className="mt-1"
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{provider.nome}</h4>
                  <span className="text-sm text-muted-foreground">
                    Padrão: {formatCurrency(provider.precoDefault)}
                  </span>
                </div>
                {provider.selecionado && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {provider.precoAtual !== provider.precoDefault && (
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
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { defaultProviders };
