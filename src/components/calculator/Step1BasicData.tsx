import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface EmissaoData {
  numero_emissao: string;
  demandante_proposta: string;
  empresa_destinataria: string;
  categoria: string;
  volume: string;
  quantidade_series: string;
  valor_mobiliario: string;
  observacao: string;
}

interface Step1Props {
  data: EmissaoData;
  onChange: (data: EmissaoData) => void;
}

export function Step1BasicData({ data, onChange }: Step1Props) {
  const handleChange = (field: keyof EmissaoData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Dados Básicos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="numero_emissao">Número da Emissão *</Label>
            <Input
              id="numero_emissao"
              placeholder="EMIT-2025-XXXX"
              value={data.numero_emissao}
              onChange={(e) => handleChange('numero_emissao', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demandante">Demandante da Proposta *</Label>
            <Input
              id="demandante"
              placeholder="Nome do demandante"
              value={data.demandante_proposta}
              onChange={(e) => handleChange('demandante_proposta', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="empresa">Empresa Destinatária</Label>
          <Input
            id="empresa"
            placeholder="Nome da empresa destinatária"
            value={data.empresa_destinataria}
            onChange={(e) => handleChange('empresa_destinataria', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={data.categoria} onValueChange={(value) => handleChange('categoria', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEB">DEB - Debênture</SelectItem>
                <SelectItem value="CRA">CRA - Certificado de Recebíveis do Agronegócio</SelectItem>
                <SelectItem value="CRI">CRI - Certificado de Recebíveis Imobiliários</SelectItem>
                <SelectItem value="NC">NC - Nota Comercial</SelectItem>
                <SelectItem value="CR">CR - Certificado de Recebíveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="volume">Volume (R$) *</Label>
            <Input
              id="volume"
              type="number"
              placeholder="0,00"
              value={data.volume}
              onChange={(e) => handleChange('volume', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="series">Quantidade de Séries</Label>
            <Input
              id="series"
              type="number"
              placeholder="1"
              value={data.quantidade_series}
              onChange={(e) => handleChange('quantidade_series', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_mobiliario">Valor Mobiliário</Label>
          <Input
            id="valor_mobiliario"
            type="number"
            placeholder="0,00"
            value={data.valor_mobiliario}
            onChange={(e) => handleChange('valor_mobiliario', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacao">Observações</Label>
          <Textarea
            id="observacao"
            placeholder="Observações adicionais sobre a emissão..."
            value={data.observacao}
            onChange={(e) => handleChange('observacao', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
