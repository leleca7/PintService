import 'server-only';
import { findExternalVehicleByPlate } from '@/lib/external-vehicle-source';

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

function operationalFields(external: any) {
  return {
    placa: external.placa,
    modelo: external.modelo || null,
    cor: external.cor || null,
    status: external.status || null,
    setor: external.etapa || null,
    observacoes: external.observacoes || null,
    ultima_atualizacao: external.fetchedAt || new Date().toISOString(),
  };
}

export async function resolveOperationalVehicle(supabase: any, plate: string): Promise<VehicleResolution> {
  if (externalVehicleSourceConfigured()) {
    const { source, vehicle: external } = await findExternalVehicleByPlate(plate);
    if (source.error) return { ok: false, reason: 'source_error', error: source.error };
    if (!external) return { ok: false, reason: 'not_found' };
    if (!external.status.trim() && !external.etapa.trim()) return { ok: false, reason: 'incomplete' };

    const { data: existing, error: existingError } = await supabase.from('veiculos').select('id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao').ilike('placa', external.placa).maybeSingle();
    if (existingError) throw existingError;

    let dbVehicle = existing;
    if (existing) {
      const { data: updated, error } = await supabase.from('veiculos').update(operationalFields(external)).eq('id', existing.id).select('id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao').single();
      if (error) throw error;
      dbVehicle = updated;
    } else {
      const { data: inserted, error } = await supabase.from('veiculos').insert(operationalFields(external)).select('id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao').single();
      if (error?.code === '23505') {
        const { data: concurrent, error: concurrentError } = await supabase.from('veiculos').select('id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao').ilike('placa', external.placa).single();
        if (concurrentError) throw concurrentError;
        dbVehicle = concurrent;
      } else if (error) throw error;
      else dbVehicle = inserted;
    }

    return {
      ok: true,
      vehicle: {
        ...dbVehicle,
        placa: external.placa,
        modelo: external.modelo || dbVehicle?.modelo || null,
        cor: external.cor || dbVehicle?.cor || null,
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

  const { data: vehicle, error } = await supabase.from('veiculos').select('id,placa,modelo,cor,status,setor,observacoes,ultima_atualizacao').ilike('placa', plate).maybeSingle();
  if (error) throw error;
  if (!vehicle) return { ok: false, reason: 'not_found' };
  if (!String(vehicle.status ?? '').trim() && !String(vehicle.setor ?? '').trim()) return { ok: false, reason: 'incomplete' };
  return { ok: true, vehicle: { ...vehicle, source: 'banco' } };
}
