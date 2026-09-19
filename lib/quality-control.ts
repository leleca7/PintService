import 'server-only';
import { getDb } from '@/lib/db';

export const QUALITY_ITEMS = [
  ['pintura_polimento','Pintura e polimento conferidos'],
  ['montagem_alinhamento','Montagem e alinhamento conferidos'],
  ['acabamento','Acabamentos conferidos'],
  ['limpeza','Limpeza final concluída'],
  ['luzes_sensores','Luzes, sensores e itens funcionais conferidos'],
  ['itens_cliente','Itens e acessórios do cliente conferidos'],
  ['pendencias','Pendências finais revisadas e registradas'],
  ['evidencia_final','Evidência/foto final registrada quando aplicável'],
] as const;

export async function getQualityChecklist(vehicleId:string) {
  const sql=getDb();
  const vehicleRows=await sql`
    SELECT id,placa,modelo,status,setor FROM veiculos WHERE id=${vehicleId} LIMIT 1
  `;
  const vehicle=vehicleRows[0];
  if(!vehicle) return {vehicle:null,checklist:null};

  const rows=await sql`
    SELECT q.*,f.nome AS concluido_por_nome
    FROM checklists_qualidade q
    LEFT JOIN funcionarios f ON f.id=q.concluido_por
    WHERE q.veiculo_id=${vehicleId}
      AND q.status IN ('pendente','em_revisao','aprovado','reprovado')
    ORDER BY q.criado_em DESC
    LIMIT 1
  `;
  return {vehicle,checklist:rows[0]??null};
}
