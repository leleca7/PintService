import 'server-only';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import type { DataSource } from '@/lib/dashboard-data';
import { normalizeOperationalStage, OPERATION_STAGES } from '@/lib/operation-stages';

export type CapacitySituation = 'ok' | 'limit' | 'over';

export type PhaseCapacity = {
  fase: string;
  ordem: number;
  capacidadeMaxima: number;
  emAndamento: number;
  atrasados: number;
  vagasLivres: number;
  ocupacaoPercentual: number;
  situacao: CapacitySituation;
  filaTravada: boolean;
};

export type CapacityData = {
  source: DataSource;
  phases: PhaseCapacity[];
  canManage: boolean;
  error?: string;
};

function dateOnly(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function todayInBahia() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function getCapacityData(): Promise<CapacityData> {
  if (!isDatabaseConfigured()) return { source: 'demo', phases: [], canManage: false };

  try {
    const user = await getCurrentAppUser();
    if (!user?.ativo) return { source: 'error', phases: [], canManage: false, error: 'Usuário sem perfil ativo.' };
    if (!userHasPermission(user, 'atualizar_operacao_veiculos')) {
      return { source: 'error', phases: [], canManage: false, error: 'Acesso operacional não autorizado.' };
    }

    const sql = getDb();
    const [capacityRows, vehicleRows] = await Promise.all([
      sql`SELECT fase, capacidade_maxima, ordem FROM capacidade_fases ORDER BY ordem`,
      sql`SELECT setor, previsao_saida FROM veiculos WHERE data_saida_real IS NULL`,
    ]);

    const today = todayInBahia();
    const counts = new Map<string, { active: number; delayed: number }>();
    for (const stage of OPERATION_STAGES) counts.set(stage, { active: 0, delayed: 0 });

    for (const row of vehicleRows) {
      const stage = normalizeOperationalStage(String(row.setor ?? ''));
      if (!stage) continue;
      const current = counts.get(stage) ?? { active: 0, delayed: 0 };
      current.active += 1;
      const forecast = dateOnly(row.previsao_saida);
      if (forecast && forecast < today) current.delayed += 1;
      counts.set(stage, current);
    }

    const phases: PhaseCapacity[] = capacityRows.map((row: any) => {
      const fase = String(row.fase);
      const capacidadeMaxima = Number(row.capacidade_maxima ?? 0);
      const count = counts.get(fase) ?? { active: 0, delayed: 0 };
      const situacao: CapacitySituation = count.active > capacidadeMaxima ? 'over' : count.active === capacidadeMaxima ? 'limit' : 'ok';
      return {
        fase,
        ordem: Number(row.ordem),
        capacidadeMaxima,
        emAndamento: count.active,
        atrasados: count.delayed,
        vagasLivres: Math.max(0, capacidadeMaxima - count.active),
        ocupacaoPercentual: capacidadeMaxima > 0 ? Math.round((count.active / capacidadeMaxima) * 100) : count.active > 0 ? 100 : 0,
        situacao,
        filaTravada: situacao === 'over' && count.delayed > 0,
      };
    });

    return {
      source: 'live',
      phases,
      canManage: userHasPermission(user, 'gerenciar_capacidade'),
    };
  } catch (error) {
    console.error('Falha ao carregar capacidade por fase:', error);
    return {
      source: 'error',
      phases: [],
      canManage: false,
      error: error instanceof Error ? error.message : 'Falha ao carregar capacidade por fase.',
    };
  }
}
