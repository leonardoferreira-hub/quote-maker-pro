import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/Header';
import { KPICards } from '@/components/KPICards';
import { EmissionsTable } from '@/components/EmissionsTable';
import { listarEmissoes, type Emissao } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [emissoes, setEmissoes] = useState<Emissao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadEmissoes();
  }, [page]);

  const loadEmissoes = async () => {
    setIsLoading(true);
    try {
      const result = await listarEmissoes(page, 10);
      if (result.data) {
        setEmissoes(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar emissões',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmissoes = emissoes.filter((e) => {
    const matchesSearch =
      e.numero_emissao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.demandante_proposta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status_proposta === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const total = emissoes.length;
  const aceitas = emissoes.filter((e) => e.status_proposta === 'aceita').length;
  const estruturando = emissoes.filter(
    (e) => e.status_proposta === 'estruturando' || e.status_proposta === 'estruturada'
  ).length;
  const volumeTotal = emissoes.reduce((sum, e) => sum + e.volume, 0);

  const handleView = (id: string) => {
    navigate(`/proposta?id=${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/calculadora?edit=${id}`);
  };

  const handleExport = (id: string) => {
    navigate(`/proposta?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs */}
        <div className="mb-8">
          <KPICards
            total={total}
            aceitas={aceitas}
            estruturando={estruturando}
            volumeTotal={volumeTotal}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou demandante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="aceita">Aceita</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
                <SelectItem value="estruturando">Estruturando</SelectItem>
                <SelectItem value="estruturada">Estruturada</SelectItem>
                <SelectItem value="liquidada">Liquidada</SelectItem>
                <SelectItem value="arquivada">Arquivada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate('/calculadora')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Cotação
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Carregando emissões...</div>
          </div>
        ) : filteredEmissoes.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl card-shadow">
            <div className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Nenhuma emissão encontrada com os filtros aplicados.'
                : 'Nenhuma emissão cadastrada ainda.'}
            </div>
            <Button onClick={() => navigate('/calculadora')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Cotação
            </Button>
          </div>
        ) : (
          <>
            <EmissionsTable
              emissoes={filteredEmissoes}
              onView={handleView}
              onEdit={handleEdit}
              onExport={handleExport}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
