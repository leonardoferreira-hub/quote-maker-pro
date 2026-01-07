import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown, Send, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { detalhesEmissao, finalizarProposta } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Proposal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const id = searchParams.get('id');

  const [emissao, setEmissao] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEmissao();
    }
  }, [id]);

  const loadEmissao = async () => {
    try {
      const result = await detalhesEmissao(id!);
      if (result.data) {
        setEmissao(result.data);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar a emissão.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendProposal = async () => {
    try {
      await finalizarProposta(id!, 'enviada', new Date().toISOString());
      toast({
        title: 'Proposta enviada!',
        description: 'A proposta foi marcada como enviada.',
      });
      loadEmissao();
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!emissao) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Emissão não encontrada.</p>
          <Button onClick={() => navigate('/')} className="mx-auto mt-4 block">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h2 className="text-2xl font-bold">Proposta - {emissao.numero_emissao}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={emissao.status_proposta} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleSendProposal}>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Emission Data */}
          <Card className="border-0 card-shadow">
            <CardHeader>
              <CardTitle>Dados da Emissão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Demandante</p>
                  <p className="font-semibold">{emissao.demandante_proposta}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-semibold">{emissao.categoria}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="font-semibold">{formatCurrency(emissao.volume)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Séries</p>
                  <p className="font-semibold">{emissao.quantidade_series || 1}</p>
                </div>
              </div>
              {emissao.empresa_destinataria && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Empresa Destinatária</p>
                  <p className="font-semibold">{emissao.empresa_destinataria}</p>
                </div>
              )}
              {emissao.observacao && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm">{emissao.observacao}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costs */}
          <Card className="border-0 card-shadow">
            <CardHeader>
              <CardTitle>Custos Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              {emissao.custos && emissao.custos.length > 0 ? (
                <div className="space-y-3">
                  {emissao.custos.map((custo: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium">{custo.tipo}</p>
                        {custo.descricao && (
                          <p className="text-sm text-muted-foreground">{custo.descricao}</p>
                        )}
                      </div>
                      <p className="font-semibold">{formatCurrency(custo.valor)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-primary/20">
                    <p className="font-bold text-lg">Total</p>
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(
                        emissao.custos.reduce((sum: number, c: any) => sum + c.valor, 0)
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum custo registrado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
