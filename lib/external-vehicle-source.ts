import 'server-only';

export type ExternalVehicle = {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  seguradora: string;
  dataEntrada: string;
  dataProducao: string;
  etapa: string;
  status: string;
  diasEmCasa: string;
  diasParaEntrega: string;
  statusPrazo: string;
  observacoes: string;
  responsavel: string;
  dataSaidaReal: string;
  fetchedAt: string;
};

export type ExternalVehicleSourceResult = {
  configured: boolean;
  sourceUrl: string | null;
  fetchUrl: string | null;
  fetchedAt: string | null;
  vehicles: ExternalVehicle[];
  error?: string;
};

function normalizeText(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function normalizePlate(value = '') {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

function googleSheetCsvUrl(input: string) {
  const url = new URL(input);
  if (!url.hostname.includes('docs.google.com') || !url.pathname.includes('/spreadsheets/')) return input;
  if (url.searchParams.get('output') === 'csv' || url.pathname.includes('/export')) return input;

  const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) return input;
  const gid = url.searchParams.get('gid') || '0';
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

export function sourceFetchUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return '';
  try { return googleSheetCsvUrl(trimmed); } catch { return trimmed; }
}

function parseCsv(text: string) {
  const clean = text.replace(/^\uFEFF/, '');
  const lines: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); lines.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  row.push(field);
  if (row.some((value) => value.length)) lines.push(row);
  return lines;
}

function findHeaderRow(rows: string[][]) {
  return rows.findIndex((row) => {
    const cells = row.map(normalizeText);
    return cells.includes('placa') && cells.some((value) => value.includes('modelo'));
  });
}

function headerIndex(headers: string[], aliases: string[]) {
  const normalized = headers.map(normalizeText);
  const normalizedAliases = aliases.map(normalizeText);
  for (const alias of normalizedAliases) {
    const exact = normalized.indexOf(alias);
    if (exact >= 0) return exact;
  }
  for (let index = 0; index < normalized.length; index += 1) {
    if (normalizedAliases.some((alias) => normalized[index].includes(alias))) return index;
  }
  return -1;
}

function cell(row: string[], index: number) {
  return index >= 0 ? String(row[index] ?? '').trim() : '';
}

export function parseVehicleCsv(csv: string, fetchedAt = new Date().toISOString()): ExternalVehicle[] {
  const rows = parseCsv(csv).filter((row) => !(row.length === 1 && normalizeText(row[0]).startsWith('sep=')));
  const headerRow = findHeaderRow(rows);
  if (headerRow < 0) throw new Error('A fonte não possui uma linha de cabeçalho com Placa e Modelo.');
  const headers = rows[headerRow];

  const idx = {
    placa: headerIndex(headers, ['Placa']),
    modelo: headerIndex(headers, ['Modelo']),
    cor: headerIndex(headers, ['Cor']),
    seguradora: headerIndex(headers, ['Seguradora', 'Seguradora/Cliente', 'Seguradora_Cliente']),
    dataEntrada: headerIndex(headers, ['Dt. Entrada', 'Data Entrada']),
    dataProducao: headerIndex(headers, ['Dt. Producao', 'Dt. Produção', 'Data Producao', 'Data Produção']),
    etapa: headerIndex(headers, ['Fase', 'Etapa', 'Setor']),
    status: headerIndex(headers, ['Status']),
    diasEmCasa: headerIndex(headers, ['Dias em Casa', 'Dias na Oficina']),
    diasParaEntrega: headerIndex(headers, ['Dias p Entrega', 'Dias p/ Entrega', 'Dias para Entrega']),
    statusPrazo: headerIndex(headers, ['Status Prazo', 'Prazo']),
    observacoes: headerIndex(headers, ['Observacoes', 'Observações']),
    responsavel: headerIndex(headers, ['Responsavel', 'Responsável']),
    dataSaidaReal: headerIndex(headers, ['Dt. Saida Real', 'Dt. Saída Real', 'Dt. Saida', 'Dt. Saída']),
  };

  if (idx.placa < 0 || idx.modelo < 0) throw new Error('A fonte precisa conter as colunas Placa e Modelo.');

  const result: ExternalVehicle[] = [];
  const seen = new Set<string>();
  for (const row of rows.slice(headerRow + 1)) {
    const placa = normalizePlate(cell(row, idx.placa));
    if (!placa || placa === 'PLACA' || seen.has(placa)) continue;
    const modelo = cell(row, idx.modelo);
    if (!modelo) continue;
    seen.add(placa);
    result.push({
      id: `external-${placa}`,
      placa,
      modelo,
      cor: cell(row, idx.cor),
      seguradora: cell(row, idx.seguradora),
      dataEntrada: cell(row, idx.dataEntrada),
      dataProducao: cell(row, idx.dataProducao),
      etapa: cell(row, idx.etapa),
      status: cell(row, idx.status),
      diasEmCasa: cell(row, idx.diasEmCasa),
      diasParaEntrega: cell(row, idx.diasParaEntrega),
      statusPrazo: cell(row, idx.statusPrazo),
      observacoes: cell(row, idx.observacoes),
      responsavel: cell(row, idx.responsavel),
      dataSaidaReal: cell(row, idx.dataSaidaReal),
      fetchedAt,
    });
  }
  return result;
}

export async function fetchExternalVehicles(): Promise<ExternalVehicleSourceResult> {
  const sourceUrl = process.env.VEHICLE_DATA_URL?.trim() || '';
  if (!sourceUrl) return { configured: false, sourceUrl: null, fetchUrl: null, fetchedAt: null, vehicles: [] };
  const fetchUrl = sourceFetchUrl(sourceUrl);
  try {
    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'PintService/1.0', Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.5' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') && !fetchUrl.includes('docs.google.com')) throw new Error('O link retornou uma página HTML, não uma planilha CSV pública.');
    const text = await response.text();
    const fetchedAt = new Date().toISOString();
    const vehicles = parseVehicleCsv(text, fetchedAt);
    return { configured: true, sourceUrl, fetchUrl, fetchedAt, vehicles };
  } catch (error) {
    return { configured: true, sourceUrl, fetchUrl, fetchedAt: null, vehicles: [], error: error instanceof Error ? error.message : 'Falha ao ler a fonte operacional.' };
  }
}

export async function findExternalVehicleByPlate(plate: string) {
  const normalized = normalizePlate(plate);
  if (!normalized) return { source: await fetchExternalVehicles(), vehicle: null };
  const source = await fetchExternalVehicles();
  const vehicle = source.vehicles.find((item) => item.placa === normalized) ?? null;
  return { source, vehicle };
}
