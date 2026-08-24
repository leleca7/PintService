import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type DataSource = 'live' | 'demo' | 'error';

export type DashboardVehicle = {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  cliente: string;
  etapa: string;
  status: string;
  ultimaAtualizacao: string | null;
};

export type DashboardTask = {
  id: string;
  codigo: string;
  tipo: string;
  titulo: string;
  instrucoes: string;
  setor: string;
  responsavel: string;
  prioridade: string;
  status: string;
  requerFoto: boolean;
  placa: string;
  modelo: string;
  criadoEm: string | null;
};

export type DashboardConversation = {
  id: string;
  cliente: string;
  telefone: string;
  mensagem: string;
  origem: string;
  intencao: string;
  status: string;
  criadoEm: string | null;
  placa: string;
};

export type DashboardEmployee = {
  id: string;
  nome: string;
  setor: string;
  cargo: string;
  telefone: string;
  ativo: boolean;
};

export type DashboardData = {
  source: DataSource;
  error?: string;
  vehicles: DashboardVehicle[];
  tasks: DashboardTask[];
  conversations: DashboardConversation[];
  employees: DashboardEmployee[];
};

function relationOne<T = any>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function demoData(): DashboardData {
  return {
    source: 'demo',
    vehicles: [
      { id: 'demo-corolla', placa: 'ABC1D23', modelo: 'Toyota Corolla', cor: 'Branco', cliente: 'João Santos', etapa: 'Pintura', status: 'Em produção', ultimaAtualizacao: new Date(Date.now() - 12 * 60_000).toISOString() },
      { id: 'demo-onix', placa: 'QWE4F56', modelo: 'Chevrolet Onix', cor: 'Prata', cliente: 'Mariana Souza', etapa: 'Funilaria', status: 'Em produção', ultimaAtualizacao: new Date(Date.now() - 28 * 60_000).toISOString() },
      { id: 'demo-renegade', placa: 'RTY7G89', modelo: 'Jeep Renegade', cor: 'Preto', cliente: 'Carlos Lima', etapa: 'Preparação de pintura', status: 'Em produção', ultimaAtualizacao: new Date(Date.now() - 41 * 60_000).toISOString() },
      { id: 'demo-civic', placa: 'JKL2M34', modelo: 'Honda Civic', cor: 'Cinza', cliente: 'Aline Rocha', etapa: 'Montagem', status: 'Em produção', ultimaAtualizacao: new Date(Date.now() - 65 * 60_000).toISOString() },
    ],
    tasks: [
      { id: 'demo-task-photo', codigo: '72AE91C304', tipo: 'tirar_foto', titulo: 'Tirar foto atual do veículo', instrucoes: 'Tirar uma foto atual e confirmar que pode ser compartilhada com o cliente.', setor: 'Pintura', responsavel: 'Lucas', prioridade: 'normal', status: 'aberta', requerFoto: true, placa: 'ABC1D23', modelo: 'Toyota Corolla', criadoEm: new Date(Date.now() - 18 * 60_000).toISOString() },
      { id: 'demo-task-part', codigo: '91CD83A112', tipo: 'confirmar_peca', titulo: 'Confirmar chegada de peça', instrucoes: 'Verificar fisicamente se a peça solicitada já chegou.', setor: 'Montagem', responsavel: 'Sem responsável', prioridade: 'alta', status: 'aberta', requerFoto: false, placa: 'JKL2M34', modelo: 'Honda Civic', criadoEm: new Date(Date.now() - 35 * 60_000).toISOString() },
      { id: 'demo-task-stage', codigo: 'C248B0A331', tipo: 'confirmar_etapa', titulo: 'Confirmar entrada na preparação', instrucoes: 'Confirmar a etapa atual do veículo antes de atualizar o cliente.', setor: 'Preparação de pintura', responsavel: 'Carlos', prioridade: 'normal', status: 'aguardando_confirmacao', requerFoto: false, placa: 'RTY7G89', modelo: 'Jeep Renegade', criadoEm: new Date(Date.now() - 52 * 60_000).toISOString() },
    ],
    conversations: [
      { id: 'demo-chat-1', cliente: 'João Santos', telefone: '55••••••••001', mensagem: 'Consegue me mandar uma foto do meu carro?', origem: 'cliente', intencao: 'foto', status: 'IA aguardando equipe', criadoEm: new Date(Date.now() - 17 * 60_000).toISOString(), placa: 'ABC1D23' },
      { id: 'demo-chat-2', cliente: 'Ana Ferreira', telefone: '55••••••••002', mensagem: 'Quero falar com alguém sobre o orçamento.', origem: 'cliente', intencao: 'orcamento', status: 'Aguardando humano', criadoEm: new Date(Date.now() - 26 * 60_000).toISOString(), placa: '' },
      { id: 'demo-chat-3', cliente: 'Mariana Souza', telefone: '55••••••••003', mensagem: 'Minha placa é QWE4F56', origem: 'cliente', intencao: 'status', status: 'IA respondeu', criadoEm: new Date(Date.now() - 43 * 60_000).toISOString(), placa: 'QWE4F56' },
    ],
    employees: [
      { id: 'demo-employee-1', nome: 'Lucas', setor: 'Pintura', cargo: 'Pintor', telefone: '55••••••••101', ativo: true },
      { id: 'demo-employee-2', nome: 'Carlos', setor: 'Preparação de pintura', cargo: 'Preparador', telefone: '55••••••••102', ativo: true },
      { id: 'demo-employee-3', nome: 'Gerente', setor: 'Gerência', cargo: 'Gerente', telefone: '55••••••••103', ativo: true },
    ],
  };
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) return demoData();

  try {
    const supabase = getSupabaseAdmin();
    const [vehiclesResult, tasksResult, conversationsResult, employeesResult] = await Promise.all([
      supabase.from('veiculos').select('id,placa,modelo,cor,status,setor,ultima_atualizacao,clientes(nome)').order('ultima_atualizacao', { ascending: false }).limit(200),
      supabase.from('tarefas_operacionais').select('id,codigo,tipo,titulo,instrucoes,setor_responsavel,responsavel_id,prioridade,status,requer_foto,criado_em,veiculos(placa,modelo),funcionarios(nome)').order('criado_em', { ascending: false }).limit(200),
      supabase.from('conversas').select('id,telefone,mensagem,origem,intencao,atendente_assumiu,criado_em,clientes(nome),veiculos(placa)').order('id', { ascending: false }).limit(50),
      supabase.from('funcionarios').select('id,nome,setor,cargo,telefone,ativo').order('nome', { ascending: true }).limit(200),
    ]);

    const firstError = vehiclesResult.error || tasksResult.error || conversationsResult.error || employeesResult.error;
    if (firstError) throw firstError;

    const vehicles: DashboardVehicle[] = (vehiclesResult.data ?? []).map((row: any) => {
      const client = relationOne<any>(row.clientes);
      return { id: String(row.id), placa: String(row.placa ?? ''), modelo: String(row.modelo ?? 'Veículo'), cor: String(row.cor ?? ''), cliente: String(client?.nome ?? 'Cliente não informado'), etapa: String(row.setor ?? row.status ?? 'Sem etapa'), status: String(row.status ?? 'Em acompanhamento'), ultimaAtualizacao: row.ultima_atualizacao ?? null };
    });

    const tasks: DashboardTask[] = (tasksResult.data ?? []).map((row: any) => {
      const vehicle = relationOne<any>(row.veiculos);
      const employee = relationOne<any>(row.funcionarios);
      return { id: String(row.id), codigo: String(row.codigo ?? ''), tipo: String(row.tipo ?? ''), titulo: String(row.titulo ?? 'Tarefa operacional'), instrucoes: String(row.instrucoes ?? ''), setor: String(row.setor_responsavel ?? 'Sem setor'), responsavel: String(employee?.nome ?? 'Sem responsável'), prioridade: String(row.prioridade ?? 'normal'), status: String(row.status ?? 'aberta'), requerFoto: Boolean(row.requer_foto), placa: String(vehicle?.placa ?? ''), modelo: String(vehicle?.modelo ?? 'Veículo'), criadoEm: row.criado_em ?? null };
    });

    const conversations: DashboardConversation[] = (conversationsResult.data ?? []).map((row: any) => {
      const client = relationOne<any>(row.clientes);
      const vehicle = relationOne<any>(row.veiculos);
      const status = row.atendente_assumiu ? 'Aguardando humano' : row.origem === 'bot' ? 'IA respondeu' : 'IA acompanhando';
      return { id: String(row.id), cliente: String(client?.nome ?? row.telefone ?? 'Cliente'), telefone: String(row.telefone ?? ''), mensagem: String(row.mensagem ?? ''), origem: String(row.origem ?? ''), intencao: String(row.intencao ?? ''), status, criadoEm: row.criado_em ?? null, placa: String(vehicle?.placa ?? '') };
    });

    const employees: DashboardEmployee[] = (employeesResult.data ?? []).map((row: any) => ({ id: String(row.id), nome: String(row.nome ?? ''), setor: String(row.setor ?? ''), cargo: String(row.cargo ?? ''), telefone: String(row.telefone ?? ''), ativo: Boolean(row.ativo) }));

    return { source: 'live', vehicles, tasks, conversations, employees };
  } catch (error) {
    console.error('Falha ao carregar dashboard real:', error);
    return { source: 'error', error: error instanceof Error ? error.message : 'Falha desconhecida ao carregar o banco.', vehicles: [], tasks: [], conversations: [], employees: [] };
  }
}

export async function getVehicleDetail(id: string) {
  const data = await getDashboardData();
  const vehicle = data.vehicles.find((item) => item.id === id || item.placa.toUpperCase() === id.toUpperCase()) ?? null;
  const tasks = vehicle ? data.tasks.filter((task) => task.placa === vehicle.placa) : [];
  const conversations = vehicle ? data.conversations.filter((conversation) => conversation.placa === vehicle.placa) : [];
  return { ...data, vehicle, tasks, conversations };
}
