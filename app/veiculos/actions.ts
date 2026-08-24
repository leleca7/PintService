'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export async function createVehicle(formData: FormData) {
  const user = await requirePermission('gerenciar_veiculos');
  const clienteNome = text(formData, 'cliente_nome');
  const telefone = text(formData, 'telefone').replace(/\D/g, '');
  const placa = text(formData, 'placa').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const modelo = text(formData, 'modelo');
  const cor = text(formData, 'cor');
  const status = text(formData, 'status');
  const setor = text(formData, 'setor');
  if (!telefone || !placa) throw new Error('Telefone do cliente e placa são obrigatórios.');

  const sql = getDb();
  const clients = await sql`
    INSERT INTO clientes (nome, telefone)
    VALUES (${clienteNome || null}, ${telefone})
    ON CONFLICT (telefone) DO UPDATE SET nome = COALESCE(EXCLUDED.nome, clientes.nome), atualizado_em = now()
    RETURNING id
  `;
  const clienteId = String(clients[0].id);
  const vehicles = await sql`
    INSERT INTO veiculos (cliente_id, placa, modelo, cor, status, setor)
    VALUES (${clienteId}, ${placa}, ${modelo || null}, ${cor || null}, ${status || null}, ${setor || null})
    ON CONFLICT (placa) DO UPDATE SET cliente_id = EXCLUDED.cliente_id, modelo = EXCLUDED.modelo, cor = EXCLUDED.cor, status = EXCLUDED.status, setor = EXCLUDED.setor, ultima_atualizacao = now()
    RETURNING id
  `;
  await writeAudit(user, 'salvar', 'veiculo', String(vehicles[0]?.id ?? ''), { placa, modelo, setor, status });
  revalidatePath('/');
  revalidatePath('/veiculos');
}
