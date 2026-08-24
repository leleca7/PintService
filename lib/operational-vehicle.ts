import 'server-only';
import { findExternalVehicleByPlate } from '@/lib/external-vehicle-source';
import { getDb } from '@/lib/db';

export function externalVehicleSourceConfigured() {
  return Boolean(process.env.VEHICLE_DATA_URL?.trim());
}

type ResolvedVehicle = {
  id: string;
  placa: string;
  modelo: string | null;
  cor: string | null;
  status: string | null;
  setor: string | null;
  observacoes?: string | null;
  ultima_atualizacao?: string | null;
  statusPrazo?: string;
  diasEmCasa?: string;
  diasParaEntrega?: string;
  dataEntrada?: string;
  dataProducao?: string;
  responsavel?: string;
  source: 'planilha' | 'banco';
};

export type VehicleResolution =
  | { ok: true; vehicle: ResolvedVehicle }
  | { ok: false; reason: 'not_found' | 'source_error' | 'incomplete'; error?: string };

export async function resolveOperationalVehicle(plate: string): Promise<VehicleResolution> {
  const sql = getDb();
  if (externalVehicleSourceConfigured()) {
    const { source, vehicle: external } = await findExternalVehicleByPlate(plate);
    if (source.error) return { ok: false, reason: 'source_error', error: source.error };
    if (!external) return { ok: false, reason: 'not_found' };
    if (!external.status.trim() && !external.etapa.trim()) return { ok: false, reason: 'incomplete' };

    const existing = await sql`SELECT id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao FROM veiculos WHERE upper(placa) = upper(${external.placa}) LIMIT 1`;
    let dbVehicle = existing[0];
    if (dbVehicle) {
      const updated = await sql`
        UPDATE veiculos SET modelo = ${external.modelo || dbVehicle.modelo || null}, cor = ${external.cor || dbVehicle.cor || null}, status = ${external.status || null}, setor = ${external.etapa || null}, observacoes = ${external.observacoes || null}, ultima_atualizacao = now()
        WHERE id = ${dbVehicle.id}
        RETURNING id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao
      `;
      dbVehicle = updated[0];
    } else {
      const inserted = await sql`
        INSERT INTO veiculos (placa,modelo,cor,status,setor,observacoes,ultima_atualizacao)
        VALUES (${external.placa}, ${external.modelo || null}, ${external.cor || null}, ${external.status || null}, ${external.etapa || null}, ${external.observacoes || null}, now())
        ON CONFLICT (placa) DO UPDATE SET modelo = EXCLUDED.modelo, cor = EXCLUDED.cor, status = EXCLUDED.status, setor = EXCLUDED.setor, observacoes = EXCLUDED.observacoes, ultima_atualizacao = now()
        RETURNING id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao
      `;
      dbVehicle = inserted[0];
    }

    return {
      ok: true,
      vehicle: {
        id: String(dbVehicle.id),
        placa: external.placa,
        modelo: external.modelo || (dbVehicle.modelo ? String(dbVehicle.modelo) : null),
        cor: external.cor || (dbVehicle.cor ? String(dbVehicle.cor) : null),
        status: external.status || null,
        setor: external.etapa || null,
        observacoes: external.observacoes || null,
        ultima_atualizacao: external.fetchedAt,
        statusPrazo: external.statusPrazo,
        diasEmCasa: external.diasEmCasa,
        diasParaEntrega: external.diasParaEntrega,
        dataEntrada: external.dataEntrada,
        dataProducao: external.dataProducao,
        responsavel: external.responsavel,
        source: 'planilha',
      },
    };
  }

  const rows = await sql`SELECT id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao FROM veiculos WHERE upper(placa) = upper(${plate}) LIMIT 1`;
  const vehicle = rows[0];
  if (!vehicle) return { ok: false, reason: 'not_found' };
  if (!String(vehicle.status ?? '').trim() && !String(vehicle.setor ?? '').trim()) return { ok: false, reason: 'incomplete' };
  return { ok: true, vehicle: { id: String(vehicle.id), placa: String(vehicle.placa), modelo: vehicle.modelo ? String(vehicle.modelo) : null, cor: vehicle.cor ? String(vehicle.cor) : null, status: vehicle.status ? String(vehicle.status) : null, setor: vehicle.setor ? String(vehicle.setor) : null, observacoes: vehicle.observacoes ? String(vehicle.observacoes) : null, ultima_atualizacao: vehicle.ultima_atualizacao ? String(vehicle.ultima_atualizacao) : null, source: 'banco' } };
}
