import { NextResponse } from 'next/server';
import { requireAnyPermission, userHasPermission } from '@/lib/auth/current-user';
import { getDb, isDatabaseConfigured } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mapTask(row: any) {
  return {
    id: String(row.id), codigo: row.codigo, tipo: row.tipo, titulo: row.titulo, instrucoes: row.instrucoes,
    setor_responsavel: row.setor_responsavel, responsavel_id: row.responsavel_id, prioridade: row.prioridade,
    status: row.status, requer_foto: row.requer_foto, resposta_funcionario: row.resposta_funcionario,
    evidencia_url: row.evidencia_url, evidencia_media_id: row.evidencia_media_id, resultado: row.resultado,
    criado_em: row.criado_em, atualizado_em: row.atualizado_em, resolvido_em: row.resolvido_em,
    veiculos: row.veiculo_id ? { id: String(row.veiculo_id), placa: row.placa, modelo: row.modelo, status: row.veiculo_status, setor: row.veiculo_setor } : null,
    funcionarios: row.funcionario_id ? { id: String(row.funcionario_id), nome: row.funcionario_nome, setor: row.funcionario_setor, telefone: row.funcionario_telefone } : null,
  };
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Banco Neon não configurado.' }, { status: 503 });
  try {
    const user = await requireAnyPermission(['ver_todas_tarefas', 'ver_proprias_tarefas']);
    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get('status')?.trim() || '';
    const requestedSector = url.searchParams.get('setor')?.trim().toLowerCase() || '';
    const requestedEmployeeId = url.searchParams.get('responsavel')?.trim() || '';
    const sql = getDb();
    const all = userHasPermission(user, 'ver_todas_tarefas');

    const rows = all
      ? requestedStatus
        ? await sql`SELECT t.*,v.id AS veiculo_id,v.placa,v.modelo,v.status AS veiculo_status,v.setor AS veiculo_setor,f.id AS funcionario_id,f.nome AS funcionario_nome,f.setor AS funcionario_setor,f.telefone AS funcionario_telefone FROM tarefas_operacionais t LEFT JOIN veiculos v ON v.id=t.veiculo_id LEFT JOIN funcionarios f ON f.id=t.responsavel_id WHERE t.status=${requestedStatus} ORDER BY t.criado_em DESC LIMIT 100`
        : await sql`SELECT t.*,v.id AS veiculo_id,v.placa,v.modelo,v.status AS veiculo_status,v.setor AS veiculo_setor,f.id AS funcionario_id,f.nome AS funcionario_nome,f.setor AS funcionario_setor,f.telefone AS funcionario_telefone FROM tarefas_operacionais t LEFT JOIN veiculos v ON v.id=t.veiculo_id LEFT JOIN funcionarios f ON f.id=t.responsavel_id WHERE t.status IN ('aberta','em_execucao','aguardando_confirmacao') ORDER BY t.criado_em DESC LIMIT 100`
      : user.funcionarioId
        ? await sql`SELECT t.*,v.id AS veiculo_id,v.placa,v.modelo,v.status AS veiculo_status,v.setor AS veiculo_setor,f.id AS funcionario_id,f.nome AS funcionario_nome,f.setor AS funcionario_setor,f.telefone AS funcionario_telefone FROM tarefas_operacionais t LEFT JOIN veiculos v ON v.id=t.veiculo_id LEFT JOIN funcionarios f ON f.id=t.responsavel_id WHERE t.responsavel_id=${user.funcionarioId} AND t.status IN ('aberta','em_execucao','aguardando_confirmacao') ORDER BY t.criado_em DESC LIMIT 100`
        : [];

    const filtered = rows.filter((row: any) => (!requestedSector || String(row.setor_responsavel ?? '').toLowerCase() === requestedSector) && (!requestedEmployeeId || String(row.responsavel_id ?? '') === requestedEmployeeId));
    return NextResponse.json({ tasks: filtered.map(mapTask) });
  } catch (error: any) {
    const status = error?.status === 401 ? 401 : error?.status === 403 ? 403 : 500;
    if (status === 500) console.error('Erro ao listar tarefas operacionais:', error);
    return NextResponse.json({ error: status === 401 ? 'Não autenticado.' : status === 403 ? 'Sem permissão.' : 'Não foi possível carregar as tarefas.' }, { status });
  }
}
