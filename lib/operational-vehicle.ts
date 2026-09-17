import 'server-only';
import { findExternalVehicleByPlate } from '@/lib/external-vehicle-source';
import { getDb } from '@/lib/db';
import { normalizeOperationalStage } from '@/lib/operation-stages';

export function externalVehicleSourceConfigured() {
  return Boolean(process.env.VEHICLE_DATA_URL?.trim());
}

type ResolvedVehicle = {
  id: string;
  placa: string;
  modelo: string | null;
  cor: string | null;
  seguradora?: string | null;
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

function text(value: unknown) {
  return value == null ? '' : String(value).trim();
}

function dateOnly(value: unknown) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parseExternalDate(value: string) {
  const clean = value.trim();
  if (!clean) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const br = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!br) return null;
  return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
}

function complete(row: any) {
  return Boolean(text(row?.status) || text(row?.setor));
}

function mapDbVehicle(row: any): ResolvedVehicle {
  return {
    id: String(row.id),
    placa: String(row.placa),
    modelo: row.modelo ? String(row.modelo) : null,
    cor: row.cor ? String(row.cor) : null,
    seguradora: row.seguradora ? String(row.seguradora) : null,
    status: row.status ? String(row.status) : null,
    setor: row.setor ? String(row.setor) : null,
    observacoes: row.observacoes ? String(row.observacoes) : null,
    ultima_atualizacao: row.ultima_atualizacao ? String(row.ultima_atualizacao) : null,
    dataEntrada: dateOnly(row.data_entrada),
    dataProducao: dateOnly(row.previsao_saida),
    responsavel: row.responsavel_nome ? String(row.responsavel_nome) : undefined,
    source: 'banco',
  };
}

export async function resolveOperationalVehicle(plate: string): Promise<VehicleResolution> {
  const sql = getDb();
  const existing = await sql`
    SELECT v.id,v.placa,v.modelo,v.cor,v.seguradora,v.status,v.setor,v.observacoes,
           v.ultima_atualizacao,v.data_entrada,v.previsao_saida,f.nome AS responsavel_nome
    FROM veiculos v
    LEFT JOIN funcionarios f ON f.id = v.responsavel_id
    WHERE upper(v.placa) = upper(${plate})
    LIMIT 1
  `;
  let dbVehicle = existing[0];

  // O banco do Sistema da Pint é a fonte oficial. A fonte externa só entra como
  // fallback/importação quando o cadastro interno não existe ou ainda está incompleto.
  if (dbVehicle && complete(dbVehicle)) {
    return { ok: true, vehicle: mapDbVehicle(dbVehicle) };
  }

  if (!externalVehicleSourceConfigured()) {
    if (!dbVehicle) return { ok: false, reason: 'not_found' };
    return { ok: false, reason: 'incomplete' };
  }

  const { source, vehicle: external } = await findExternalVehicleByPlate(plate);
  if (source.error) {
    if (dbVehicle) return { ok: false, reason: 'incomplete', error: source.error };
    return { ok: false, reason: 'source_error', error: source.error };
  }
  if (!external) return dbVehicle ? { ok: false, reason: 'incomplete' } : { ok: false, reason: 'not_found' };
  if (!external.status.trim() && !external.etapa.trim()) return { ok: false, reason: 'incomplete' };

  const normalizedStage = normalizeOperationalStage(external.etapa) ?? external.etapa.trim() || null;
  const dataEntrada = parseExternalDate(external.dataEntrada);
  const previsaoSaida = parseExternalDate(external.dataProducao);
  const dataSaidaReal = parseExternalDate(external.dataSaidaReal);

  if (dbVehicle) {
    const updated = await sql`
      UPDATE veiculos SET
        modelo = COALESCE(NULLIF(modelo, ''), ${external.modelo || null}),
        cor = COALESCE(NULLIF(cor, ''), ${external.cor || null}),
        seguradora = COALESCE(NULLIF(seguradora, ''), ${external.seguradora || null}),
        status = COALESCE(NULLIF(status, ''), ${external.status || null}),
        setor = COALESCE(NULLIF(setor, ''), ${normalizedStage}),
        observacoes = COALESCE(NULLIF(observacoes, ''), ${external.observacoes || null}),
        data_entrada = COALESCE(data_entrada, ${dataEntrada}),
        previsao_saida = COALESCE(previsao_saida, ${previsaoSaida}),
        data_saida_real = COALESCE(data_saida_real, ${dataSaidaReal}),
        ultima_atualizacao = now()
      WHERE id = ${dbVehicle.id}
      RETURNING id,placa,modelo,cor,seguradora,status,setor,observacoes,ultima_atualizacao,data_entrada,previsao_saida
    `;
    dbVehicle = updated[0];
  } else {
    const inserted = await sql`
      INSERT INTO veiculos (placa,modelo,cor,seguradora,status,setor,observacoes,data_entrada,previsao_saida,data_saida_real,ultima_atualizacao)
      VALUES (${external.placa}, ${external.modelo || null}, ${external.cor || null}, ${external.seguradora || null}, ${external.status || null}, ${normalizedStage}, ${external.observacoes || null}, ${dataEntrada}, ${previsaoSaida}, ${dataSaidaReal}, now())
      ON CONFLICT (placa) DO UPDATE SET
        modelo=COALESCE(NULLIF(veiculos.modelo,''),EXCLUDED.modelo),
        cor=COALESCE(NULLIF(veiculos.cor,''),EXCLUDED.cor),
        seguradora=COALESCE(NULLIF(veiculos.seguradora,''),EXCLUDED.seguradora),
        status=COALESCE(NULLIF(veiculos.status,''),EXCLUDED.status),
        setor=COALESCE(NULLIF(veiculos.setor,''),EXCLUDED.setor),
        observacoes=COALESCE(NULLIF(veiculos.observacoes,''),EXCLUDED.observacoes),
        data_entrada=COALESCE(veiculos.data_entrada,EXCLUDED.data_entrada),
        previsao_saida=COALESCE(veiculos.previsao_saida,EXCLUDED.previsao_saida),
        data_saida_real=COALESCE(veiculos.data_saida_real,EXCLUDED.data_saida_real),
        ultima_atualizacao=now()
      RETURNING id,placa,modelo,cor,seguradora,status,setor,observacoes,ultima_atualizacao,data_entrada,previsao_saida
    `;
    dbVehicle = inserted[0];
  }

  return {
    ok: true,
    vehicle: {
      ...mapDbVehicle(dbVehicle),
      statusPrazo: external.statusPrazo,
      diasEmCasa: external.diasEmCasa,
      diasParaEntrega: external.diasParaEntrega,
      dataEntrada: external.dataEntrada || dateOnly(dbVehicle.data_entrada),
      dataProducao: external.dataProducao || dateOnly(dbVehicle.previsao_saida),
      responsavel: external.responsavel || undefined,
      source: 'planilha',
    },
  };
}
