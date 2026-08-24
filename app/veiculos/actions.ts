'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

function text(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }
function normalizedPhone(formData: FormData) { return text(formData, 'telefone').replace(/\D/g, ''); }
function normalizedPlate(formData: FormData) { return text(formData, 'placa').replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); }

export async function createVehicle(formData: FormData) {
  const user = await requirePermission('gerenciar_veiculos');
  const clienteNome = text(formData, 'cliente_nome');
  const telefone = normalizedPhone(formData);
  const placa = normalizedPlate(formData);
  const modelo = text(formData, 'modelo');
  const cor = text(formData, 'cor');
  const status = text(formData, 'status');
  const setor = text(formData, 'setor');
  if (!telefone || !placa) throw new Error('Telefone do cliente e placa são obrigatórios.');

  const sql = getDb();
  const clients = await sql`INSERT INTO clientes (nome,telefone) VALUES (${clienteNome || null},${telefone}) ON CONFLICT (telefone) DO UPDATE SET nome=COALESCE(EXCLUDED.nome,clientes.nome),atualizado_em=now() RETURNING id`;
  const clienteId = String(clients[0].id);
  const vehicles = await sql`INSERT INTO veiculos (cliente_id,placa,modelo,cor,status,setor) VALUES (${clienteId},${placa},${modelo || null},${cor || null},${status || null},${setor || null}) ON CONFLICT (placa) DO UPDATE SET cliente_id=EXCLUDED.cliente_id,modelo=EXCLUDED.modelo,cor=EXCLUDED.cor,status=EXCLUDED.status,setor=EXCLUDED.setor,ultima_atualizacao=now() RETURNING id`;
  await writeAudit(user, 'salvar', 'veiculo', String(vehicles[0]?.id ?? ''), { placa, modelo, setor, status });
  revalidatePath('/');
  revalidatePath('/veiculos');
}

export async function updateVehicle(formData: FormData) {
  const user = await requirePermission('gerenciar_veiculos');
  const id = text(formData, 'id');
  const modelo = text(formData, 'modelo');
  const cor = text(formData, 'cor');
  const status = text(formData, 'status');
  const setor = text(formData, 'setor');
  const observacoes = text(formData, 'observacoes');
  if (!id) throw new Error('Veículo inválido.');
  const sql = getDb();
  const rows = await sql`UPDATE veiculos SET modelo=${modelo || null},cor=${cor || null},status=${status || null},setor=${setor || null},observacoes=${observacoes || null},ultima_atualizacao=now() WHERE id=${id} RETURNING placa`;
  if (!rows[0]) throw new Error('Veículo não encontrado.');
  await writeAudit(user, 'editar', 'veiculo', id, { placa: rows[0].placa, modelo, setor, status });
  revalidatePath('/');
  revalidatePath('/veiculos');
  revalidatePath(`/veiculos/${id}`);
}
