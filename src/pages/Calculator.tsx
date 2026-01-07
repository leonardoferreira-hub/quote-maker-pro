import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { StepIndicator } from '@/components/calculator/StepIndicator';
import { Step1BasicData, type EmissaoData, type Serie } from '@/components/calculator/Step1BasicData';
import { Step2CostsProviders, defaultProviders, type Provider } from '@/components/calculator/Step2CostsProviders';
import { criarEmissao, salvarCustos } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Calculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [basicData, setBasicData] = useState<EmissaoData>({
    nome_operacao: '',
    demandante_proposta: '',
    empresa_destinataria: '',
    categoria: '',
    tipo_oferta: '',
    veiculo: '',
    quantidade_series: '1',
    series: [{ numero: 1, volume: 0 }],
    observacao: '',
  });

  const [providers, setProviders] = useState<Provider[]>(defaultProviders);

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const volumeTotal = basicData.series.reduce((sum, s) => sum + (s.volume || 0), 0);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const validCategories = ['DEB', 'CRA', 'CRI', 'NC', 'CR'] as const;
      const categoria = validCategories.includes(basicData.categoria as any)
        ? (basicData.categoria as 'DEB' | 'CRA' | 'CRI' | 'NC' | 'CR')
        : 'DEB';

      // Create emission
      const emissaoPayload = {
        numero_emissao: basicData.nome_operacao, // Using nome_operacao as numero
        demandante_proposta: basicData.demandante_proposta,
        empresa_destinataria: basicData.empresa_destinataria || undefined,
        categoria,
        volume: volumeTotal,
        quantidade_series: Number(basicData.quantidade_series) || 1,
        valor_mobiliario: volumeTotal || undefined,
        status_proposta: 'rascunho',
        observacao: basicData.observacao || undefined,
      };

      const result = await criarEmissao(emissaoPayload);

      if (result.error) {
        throw new Error(result.error);
      }

      // Save costs from selected providers
      const allCosts = providers
        .filter((p) => p.selecionado)
        .map((p) => ({
          tipo: `Taxa ${p.nome}`,
          valor: p.precoAtual,
          descricao: p.motivo || '',
        }));

      if (allCosts.length > 0 && result.data?.id) {
        await salvarCustos(result.data.id, allCosts);
      }

      toast({
        title: 'Cotação salva!',
        description: `Emissão ${basicData.nome_operacao} criada com sucesso.`,
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            {editId ? 'Editar Cotação' : 'Nova Cotação'}
          </h2>
          <p className="text-muted-foreground">
            Preencha os dados para {editId ? 'atualizar' : 'criar'} a cotação
          </p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={2} />

        <div className="animate-fade-in">
          {currentStep === 1 && (
            <Step1BasicData data={basicData} onChange={setBasicData} />
          )}
          {currentStep === 2 && (
            <Step2CostsProviders 
              providers={providers} 
              volume={volumeTotal}
              onChange={setProviders} 
            />
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <>
                <Button variant="outline" disabled={isLoading}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Cotação'}
                </Button>
              </>
            )}
            {currentStep < 2 && (
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
