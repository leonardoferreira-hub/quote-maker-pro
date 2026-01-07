import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { NavigationTabs } from '@/components/NavigationTabs';
import { StepIndicator } from '@/components/calculator/StepIndicator';
import { Step1BasicData, type EmissaoData } from '@/components/calculator/Step1BasicData';
import { Step2CostsProviders, defaultCostsData, type CostsData } from '@/components/calculator/Step2CostsProviders';
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

  const [costsData, setCostsData] = useState<CostsData>(defaultCostsData);

  const validateStep1 = (): string[] => {
    const errors: string[] = [];
    if (!basicData.nome_operacao.trim()) errors.push('Nome da Operação');
    if (!basicData.demandante_proposta.trim()) errors.push('Demandante da Proposta');
    if (!basicData.empresa_destinataria.trim()) errors.push('Empresa Destinatária');
    if (!basicData.categoria) errors.push('Categoria');
    if (!basicData.tipo_oferta) errors.push('Tipo de Oferta');
    if (!basicData.veiculo) errors.push('Veículo');
    
    const volumeTotal = basicData.series.reduce((sum, s) => sum + (s.volume || 0), 0);
    if (volumeTotal <= 0) errors.push('Volume das Séries (deve ser maior que zero)');
    
    return errors;
  };

  const generateNumeroEmissao = (): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `EMIT-${year}-${random}`;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const errors = validateStep1();
      if (errors.length > 0) {
        toast({
          title: 'Campos obrigatórios',
          description: `Preencha: ${errors.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
    }
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

      // Create emission with auto-generated numero_emissao
      const emissaoPayload = {
        numero_emissao: generateNumeroEmissao(),
        demandante_proposta: basicData.demandante_proposta,
        empresa_destinataria: basicData.empresa_destinataria || undefined,
        categoria,
        volume: volumeTotal,
        quantidade_series: Number(basicData.quantidade_series) || 1,
        valor_mobiliario: volumeTotal || undefined,
        status_proposta: 'rascunho',
        observacao: basicData.observacao || undefined,
      };

      console.log('🧾 [Calculator] payload criarEmissao:', emissaoPayload);

      const result = await criarEmissao(emissaoPayload);
      console.log('🧾 [Calculator] resposta criarEmissao:', result);

      if (result?.error) {
        throw new Error(result.error);
      }

      // Save costs from all sections
      const allCosts = [
        ...costsData.upfront.map((c) => ({ tipo: `Upfront - ${c.prestador}`, valor: c.valorBruto, descricao: `Gross Up: ${c.grossUp}%` })),
        ...costsData.anual.map((c) => ({ tipo: `Anual - ${c.prestador}`, valor: c.valorBruto, descricao: `Gross Up: ${c.grossUp}%` })),
        ...costsData.mensal.map((c) => ({ tipo: `Mensal - ${c.prestador}`, valor: c.valorBruto, descricao: `Gross Up: ${c.grossUp}%` })),
      ].filter((c) => c.valor > 0);

      console.log('🧾 [Calculator] custos para salvar:', { count: allCosts.length, allCosts });

      if (allCosts.length > 0 && result?.data?.id) {
        const salvarResult = await salvarCustos(result.data.id, allCosts);
        console.log('🧾 [Calculator] resposta salvarCustos:', salvarResult);
        if (salvarResult?.error) {
          throw new Error(salvarResult.error);
        }
      }

      toast({
        title: 'Cotação salva!',
        description: `Emissão ${basicData.nome_operacao} criada com sucesso.`,
      });

      navigate('/');
    } catch (error) {
      console.error('💥 [Calculator] erro ao salvar:', error);
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
      <NavigationTabs />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              costsData={costsData} 
              volume={volumeTotal}
              onChange={setCostsData} 
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
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Cotação'}
              </Button>
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
