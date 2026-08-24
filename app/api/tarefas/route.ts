import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';

function authorized(request: Request) {
  const expected = process.env.STAFF_API_TOKEN;
  if (!expected) return false;
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const direct = request.headers.get('x-staff-token');
  return bearer === expected || direct === expected;
}

export async function GET(request: Request) {
  if (!process.env.STAFF_API_TOKEN) return NextResponse.json({ error: 'STAFF_API_TOKEN não configurado.' }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return NextResponse.json({ error: 'Banco não conectado. O painel web continua disponível em modo demonstração.' }, { status: 503 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const sector = url.searchParams.get('setor');
  const employeeId = url.searchParams.get('responsavel');
  const supabase = getSupabaseAdmin();
  let query = supabase.from('tarefas_operacionais').select('id,codigo,tipo,titulo,instrucoes,setor_responsavel,responsavel_id,prioridade,status,requer_foto,resposta_funcionario,evidencia_url,evidencia_media_id,resultado,criado_em,atualizado_em,resolvido_em,veiculos(id,placa,modelo,status,setor),funcionarios(id,nome,setor,telefone)').order('criado_em', { ascending: false }).limit(100);
  if (status) query = query.eq('status', status); else query = query.in('status', ['aberta', 'em_execucao', 'aguardando_confirmacao']);
  if (sector) query = query.ilike('setor_responsavel', sector);
  if (employeeId) query = query.eq('responsavel_id', employeeId);
  const { data, error } = await query;
  if (error) { console.error('Erro ao listar tarefas operacionais:', error); return NextResponse.json({ error: 'Não foi possível carregar as tarefas.' }, { status: 500 }); }
  return NextResponse.json({ tasks: data ?? [] });
}
