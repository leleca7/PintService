'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/current-user';
import { writeAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { todayInBahia } from '@/lib/entry-queue-data';

const ALLOWED_STATUS = new Set(['Aguardando', 'Contato realizado', 'Confirmado', 'Cancelado']);
const ALLOWED_ORIGINS = new Set(['Seguradora', 'Particular']);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function nullableDate(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Data inválida.');
  return value;
}

function nullablePriority(value: string) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error('Prioridade inválida.');
  return parsed;
}

function normalizedPlate(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function normalizedPhone(value: string) {
  return value.replace(/\D/g, '');
}

function revalidateEntryPaths() {
  revalidatePath('/operacao');
  revalidatePath('/operacao/fila');
  revalidatePath('/operacao/agenda');
  revalidatePath('/operacao/pecas');
  revalidatePath('/veiculos');
}

export async function createEntryQueueItem(formData: FormData) {
  const user = await requirePermission('gerenciar_fila_entrada');
  const placa = normalizedPlate(text(formData, 'placa'));
  const modelo = text(formData, 'modelo');
  const clienteNome = text(formData, 'cliente_nome');
  const telefone = normalizedPhone(text(formData, 'telefone'));
  const origemRaw = text(formData, 'origem') || 'Seguradora';
  const origem = ALLOWED_ORIGINS.has(origemRaw) ? origemRaw : 'Seguradora';
  const seguradora = text(formData, 'seguradora');
  const dataAutorizacao = nullableDate(text(formData, 'data_autorizacao'));
  const prioridadeManual = nullablePriority(text(formData, 'prioridade_manual'));
  const observacoes = text(formData, 'observacoes');

  if (!placa || !dataAutorizacao) throw new Error('Placa e data de autorização são obrigatórias.');

  const sql = getDb();
  const existing = await sql`
    SELECT id FROM fila_entrada
    WHERE upper(placa) = upper(${placa})
      AND status NOT IN ('Movido para Produção','Cancelado')
    LIMIT 1
  `;

  let id: string;
  if (existing[0]) {
    id = String(existing[0].id);
    await sql`
      UPDATE fila_entrada
      SET modelo = ${modelo || null}, cliente_nome = ${clienteNome || null}, telefone = ${telefone || null},
          origem = ${origem}, seguradora = ${seguradora || null}, data_autorizacao = ${dataAutorizacao},
          prioridade_manual = ${prioridadeManual}, observacoes = ${observacoes || null}, atualizado_em = now()
      WHERE id = ${id}
    `;
  } else {
    const inserted = await sql`
      INSERT INTO fila_entrada
        (placa, modelo, cliente_nome, telefone, origem, seguradora, data_autorizacao,
         prioridade_manual, observacoes, criado_por)
      VALUES
        (${placa}, ${modelo || null}, ${clienteNome || null}, ${telefone || null}, ${origem},
         ${seguradora || null}, ${dataAutorizacao}, ${prioridadeManual}, ${observacoes || null}, ${user.id})
      RETURNING id
    `;
    id = String(inserted[0].id);
  }

  const existingParts = await sql`
    SELECT id FROM controle_pecas
    WHERE upper(placa) = upper(${placa}) AND encerrado_em IS NULL
    LIMIT 1
  `;
  if (existingParts[0]) {
    await sql`
      UPDATE controle_pecas
      SET fila_entrada_id = ${id}, atualizado_em = now()
      WHERE id = ${existingParts[0].id}
    `;
  } else {
    await sql`
      INSERT INTO controle_pecas (placa, fila_entrada_id, criado_por)
      VALUES (${placa}, ${id}, ${user.id})
    `;
  }

  await writeAudit(user, existing[0] ? 'editar_fila_entrada' : 'criar_fila_entrada', 'fila_entrada', id, {
    placa, dataAutorizacao, prioridadeManual, origem,
  });
  revalidateEntryPaths();
}

export async function updateEntryQueueItem(formData: FormData) {
  const user = await requirePermission('gerenciar_fila_entrada');
  const id = text(formData, 'id');
  const statusRaw = text(formData, 'status') || 'Aguardando';
  const status = ALLOWED_STATUS.has(statusRaw) ? statusRaw : 'Aguardando';
  const prioridadeManual = nullablePriority(text(formData, 'prioridade_manual'));
  const dataEntradaCombinada = nullableDate(text(formData, 'data_entrada_combinada'));
  const observacoes = text(formData, 'observacoes');
  if (!id) throw new Error('Item da fila inválido.');

  const sql = getDb();
  const beforeRows = await sql`
    SELECT placa, status, prioridade_manual, data_entrada_combinada, observacoes
    FROM fila_entrada WHERE id = ${id} LIMIT 1
  `;
  if (!beforeRows[0]) throw new Error('Item da fila não encontrado.');

  await sql`
    UPDATE fila_entrada
    SET status = ${status}, prioridade_manual = ${prioridadeManual},
        data_entrada_combinada = ${dataEntradaCombinada}, observacoes = ${observacoes || null},
        atualizado_em = now()
    WHERE id = ${id}
  `;

  await writeAudit(user, 'editar_fila_entrada', 'fila_entrada', id, {
    placa: beforeRows[0].placa,
    antes: {
      status: beforeRows[0].status,
      prioridadeManual: beforeRows[0].prioridade_manual,
      dataEntradaCombinada: beforeRows[0].data_entrada_combinada,
    },
    depois: { status, prioridadeManual, dataEntradaCombinada },
  });
  revalidateEntryPaths();
}

export async function registerVehicleEntry(formData: FormData) {
  const user = await requirePermission('gerenciar_fila_entrada');
  const id = text(formData, 'id');
  if (!id) throw new Error('Item da fila inválido.');

  const sql = getDb();
  const rows = await sql`
    SELECT id, placa, modelo, cliente_nome, telefone, seguradora, observacoes, status
    FROM fila_entrada WHERE id = ${id} LIMIT 1
  `;
  const item = rows[0];
  if (!item) throw new Error('Item da fila não encontrado.');
  if (['Movido para Produção', 'Cancelado'].includes(String(item.status))) throw new Error('Este item não pode mais ser registrado como entrada.');

  const partsRows = await sql`
    SELECT id, liberado_entrada
    FROM controle_pecas
    WHERE encerrado_em IS NULL
      AND (fila_entrada_id = ${id} OR upper(placa) = upper(${item.placa}))
    ORDER BY (fila_entrada_id = ${id}) DESC, atualizado_em DESC
    LIMIT 1
  `;
  const partsControl = partsRows[0];
  if (!partsControl) throw new Error('Inicie o controle de peças antes de registrar a entrada.');
  if (!partsControl.liberado_entrada) throw new Error('Entrada bloqueada: o responsável por peças ainda não marcou este veículo como Liberado para entrada.');

  let clienteId: string | null = null;
  const telefone = normalizedPhone(String(item.telefone ?? ''));
  if (telefone) {
    const clients = await sql`
      INSERT INTO clientes (nome, telefone)
      VALUES (${item.cliente_nome || null}, ${telefone})
      ON CONFLICT (telefone) DO UPDATE
      SET nome = COALESCE(EXCLUDED.nome, clientes.nome), atualizado_em = now()
      RETURNING id
    `;
    clienteId = String(clients[0].id);
  }

  const today = todayInBahia();
  const vehicles = await sql`
    INSERT INTO veiculos
      (cliente_id, placa, modelo, seguradora, data_entrada, setor, status, observacoes, ultima_atualizacao)
    VALUES
      (${clienteId}, ${item.placa}, ${item.modelo || null}, ${item.seguradora || null}, ${today},
       'Desmontagem', 'Em serviço', ${item.observacoes || null}, now())
    ON CONFLICT (placa) DO UPDATE SET
      cliente_id = COALESCE(EXCLUDED.cliente_id, veiculos.cliente_id),
      modelo = COALESCE(EXCLUDED.modelo, veiculos.modelo),
      seguradora = COALESCE(EXCLUDED.seguradora, veiculos.seguradora),
      data_entrada = EXCLUDED.data_entrada,
      previsao_saida = NULL,
      data_saida_real = NULL,
      setor = 'Desmontagem',
      status = 'Em serviço',
      prioridade = NULL,
      observacoes = COALESCE(EXCLUDED.observacoes, veiculos.observacoes),
      ultima_atualizacao = now()
    RETURNING id
  `;
  const vehicleId = String(vehicles[0].id);

  await sql`
    UPDATE fila_entrada
    SET status = 'Movido para Produção', veiculo_id = ${vehicleId}, atualizado_em = now()
    WHERE id = ${id}
  `;

  await sql`
    UPDATE controle_pecas
    SET fila_entrada_id = ${id}, veiculo_id = ${vehicleId}, atualizado_em = now()
    WHERE id = ${partsControl.id}
  `;

  await sql`
    INSERT INTO historico_veiculos (veiculo_id, usuario_app_id, evento, dados_anteriores, dados_novos)
    VALUES (${vehicleId}, ${user.id}, 'entrada_registrada', '{}'::jsonb,
      ${JSON.stringify({ setor: 'Desmontagem', status: 'Em serviço', data_entrada: today, origem_fila_id: id, liberado_pecas: true })}::jsonb)
  `;

  await writeAudit(user, 'registrar_entrada', 'veiculo', vehicleId, {
    placa: item.placa, filaEntradaId: id, dataEntrada: today, setor: 'Desmontagem', liberadoPecas: true,
  });
  revalidateEntryPaths();
  revalidatePath(`/veiculos/${vehicleId}`);
}
