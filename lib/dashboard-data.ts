import 'server-only';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { getDb, isDatabaseConfigured } from '@/lib/db';

export type DataSource = 'live' | 'demo' | 'error';

export type DashboardVehicle = { id: string; placa: string; modelo: string; cor: string; cliente: string; etapa: string; status: string; ultimaAtualizacao: string | null };
export type DashboardTask = { id: string; codigo: string; tipo: string; titulo: string; instrucoes: string; setor: string; responsavel: string; prioridade: string; status: string; requerFoto: boolean; placa: string; modelo: string; criadoEm: string | null };
export type DashboardConversation = { id: string; cliente: string; telefone: string; mensagem: string; origem: string; intencao: string; status: string; criadoEm: string | null; placa: string };
export type DashboardEmployee = { id: string; nome: string; setor: string; cargo: string; telefone: string; ativo: boolean };
export type DashboardData = { source: DataSource; error?: string; vehicles: DashboardVehicle[]; tasks: DashboardTask[]; conversations: DashboardConversation[]; employees: DashboardEmployee[] };

function iso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function demoData(): DashboardData {
  return {
    source: 'demo',
    vehicles: [
      { id: 'demo-corolla', placa: 'ABC1D23', modelo: 'Toyota Corolla', cor: 'Branco', cliente: 'João Santos', etapa: 'Pintura', status: 'Em produção', ultimaAtualizacao: new Date(Date.now() - 12 * 60_000).toISOString() },
      { id: 'demo-onix', placa: 'QWE4F56', modelo: 'Chevrolet Onix', cor: 'Prata', cliente: 'Mariana Souza', etapa: 'Funilaria', status: 'Em produção', ultimaAtualizacao: new Date(Date.now() - 28 * 60_000).toISOString() },
    ],
    tasks: [
      { id: 'demo-task-photo', codigo: '72AE91C304', tipo: 'tirar_foto', titulo: 'Tirar foto atual do veículo', instrucoes: 'Tirar uma foto atual e confirmar que pode ser compartilhada com o cliente.', setor: 'Pintura', responsavel: 'Lucas', prioridade: 'normal', status: 'aberta', requerFoto: true, placa: 'ABC1D23', modelo: 'Toyota Corolla', criadoEm: new Date(Date.now() - 18 * 60_000).toISOString() },
    ],
    conversations: [
      { id: 'demo-chat-1', cliente: 'João Santos', telefone: '55••••••••001', mensagem: 'Consegue me mandar uma foto do meu carro?', origem: 'cliente', intencao: 'foto', status: 'IA aguardando equipe', criadoEm: new Date(Date.now() - 17 * 60_000).toISOString(), placa: 'ABC1D23' },
    ],
    employees: [
      { id: 'demo-employee-1', nome: 'Lucas', setor: 'Pintura', cargo: 'Pintor', telefone: '55••••••••101', ativo: true },
    ],
  };
}

export function isNeonConfigured() {
  return isDatabaseConfigured();
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isDatabaseConfigured()) return demoData();

  try {
    const user = await getCurrentAppUser();
    if (!user?.ativo) {
      return { source: 'error', error: 'Usuário sem perfil ativo no PintService.', vehicles: [], tasks: [], conversations: [], employees: [] };
    }

    const sql = getDb();
    const canSeeAllVehicles = userHasPermission(user, 'ver_todos_veiculos');
    const canSeeAllTasks = userHasPermission(user, 'ver_todas_tarefas');
    const canSeeConversations = userHasPermission(user, 'ver_atendimento');
    const canSeeEmployees = userHasPermission(user, 'ver_funcionarios');

    const vehiclesRows = canSeeAllVehicles
      ? await sql`SELECT v.id, v.placa, v.modelo, v.cor, v.status, v.setor, v.ultima_atualizacao, c.nome AS cliente_nome FROM veiculos v LEFT JOIN clientes c ON c.id = v.cliente_id ORDER BY v.ultima_atualizacao DESC LIMIT 200`
      : await sql`SELECT v.id, v.placa, v.modelo, v.cor, v.status, v.setor, v.ultima_atualizacao, c.nome AS cliente_nome FROM veiculos v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE lower(coalesce(v.setor, '')) = lower(${user.setor ?? ''}) ORDER BY v.ultima_atualizacao DESC LIMIT 200`;

    const taskRows = canSeeAllTasks
      ? await sql`SELECT t.id, t.codigo, t.tipo, t.titulo, t.instrucoes, t.setor_responsavel, t.prioridade, t.status, t.requer_foto, t.criado_em, v.placa, v.modelo, f.nome AS responsavel_nome FROM tarefas_operacionais t LEFT JOIN veiculos v ON v.id = t.veiculo_id LEFT JOIN funcionarios f ON f.id = t.responsavel_id ORDER BY t.criado_em DESC LIMIT 200`
      : user.funcionarioId
        ? await sql`SELECT t.id, t.codigo, t.tipo, t.titulo, t.instrucoes, t.setor_responsavel, t.prioridade, t.status, t.requer_foto, t.criado_em, v.placa, v.modelo, f.nome AS responsavel_nome FROM tarefas_operacionais t LEFT JOIN veiculos v ON v.id = t.veiculo_id LEFT JOIN funcionarios f ON f.id = t.responsavel_id WHERE t.responsavel_id = ${user.funcionarioId} ORDER BY t.criado_em DESC LIMIT 200`
        : [];

    const conversationRows = canSeeConversations
      ? await sql`SELECT co.id, co.telefone, co.mensagem, co.origem, co.intencao, co.atendente_assumiu, co.criado_em, c.nome AS cliente_nome, v.placa FROM conversas co LEFT JOIN clientes c ON c.id = co.cliente_id LEFT JOIN veiculos v ON v.id = co.veiculo_id ORDER BY co.id DESC LIMIT 50`
      : [];

    const employeeRows = canSeeEmployees
      ? await sql`SELECT id, nome, setor, cargo, telefone, ativo FROM funcionarios ORDER BY nome ASC LIMIT 200`
      : user.funcionarioId
        ? await sql`SELECT id, nome, setor, cargo, telefone, ativo FROM funcionarios WHERE id = ${user.funcionarioId} LIMIT 1`
        : [];

    const vehicles: DashboardVehicle[] = vehiclesRows.map((row: any) => ({ id: String(row.id), placa: String(row.placa ?? ''), modelo: String(row.modelo ?? 'Veículo'), cor: String(row.cor ?? ''), cliente: String(row.cliente_nome ?? 'Cliente não informado'), etapa: String(row.setor ?? row.status ?? 'Sem etapa'), status: String(row.status ?? 'Em acompanhamento'), ultimaAtualizacao: iso(row.ultima_atualizacao) }));
    const tasks: DashboardTask[] = taskRows.map((row: any) => ({ id: String(row.id), codigo: String(row.codigo ?? ''), tipo: String(row.tipo ?? ''), titulo: String(row.titulo ?? 'Tarefa operacional'), instrucoes: String(row.instrucoes ?? ''), setor: String(row.setor_responsavel ?? 'Sem setor'), responsavel: String(row.responsavel_nome ?? 'Sem responsável'), prioridade: String(row.prioridade ?? 'normal'), status: String(row.status ?? 'aberta'), requerFoto: Boolean(row.requer_foto), placa: String(row.placa ?? ''), modelo: String(row.modelo ?? 'Veículo'), criadoEm: iso(row.criado_em) }));
    const conversations: DashboardConversation[] = conversationRows.map((row: any) => ({ id: String(row.id), cliente: String(row.cliente_nome ?? row.telefone ?? 'Cliente'), telefone: String(row.telefone ?? ''), mensagem: String(row.mensagem ?? ''), origem: String(row.origem ?? ''), intencao: String(row.intencao ?? ''), status: row.atendente_assumiu ? 'Aguardando humano' : row.origem === 'bot' ? 'IA respondeu' : 'IA acompanhando', criadoEm: iso(row.criado_em), placa: String(row.placa ?? '') }));
    const employees: DashboardEmployee[] = employeeRows.map((row: any) => ({ id: String(row.id), nome: String(row.nome ?? ''), setor: String(row.setor ?? ''), cargo: String(row.cargo ?? ''), telefone: String(row.telefone ?? ''), ativo: Boolean(row.ativo) }));

    return { source: 'live', vehicles, tasks, conversations, employees };
  } catch (error) {
    console.error('Falha ao carregar dashboard do Neon:', error);
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
