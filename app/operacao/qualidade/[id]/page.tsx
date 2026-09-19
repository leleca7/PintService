import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getQualityChecklist, QUALITY_ITEMS } from '@/lib/quality-control';
import { saveQualityChecklist } from './actions';

export default async function QualityPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const data=await getQualityChecklist(id);
  if(!data.vehicle) notFound();
  const vehicle=data.vehicle;
  const checklist=data.checklist;
  const items=(checklist?.itens&&typeof checklist.itens==='object')?checklist.itens:{};

  return <AppShell active="operacao" source="live">
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.kicker}>QUALIDADE · {String(vehicle.placa)}</p>
          <h1 className={styles.title}>Checklist antes da entrega</h1>
          <p className={styles.subtitle}>{String(vehicle.modelo??'Veículo')} · confira o essencial uma vez antes de liberar a saída.</p>
        </div>
        <Link className={styles.button} href="/operacao">Voltar à operação</Link>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div><p>CONFERÊNCIA FINAL</p><h2>{checklist?.status==='aprovado'?'Veículo aprovado':'Itens de qualidade'}</h2></div>
          <span className={styles.count}>{checklist?.status??'pendente'}</span>
        </div>
        <form action={saveQualityChecklist} style={{display:'grid',gap:12}}>
          <input type="hidden" name="vehicle_id" value={id}/>
          {QUALITY_ITEMS.map(([key,label])=><label key={key} style={{display:'flex',gap:12,alignItems:'flex-start',padding:12,border:'1px solid #d9dde3',borderRadius:12}}>
            <input type="checkbox" name={key} defaultChecked={Boolean((items as any)[key])} style={{marginTop:3}}/>
            <span><strong>{label}</strong></span>
          </label>)}
          <label style={{display:'grid',gap:6}}>
            <span>Observações finais</span>
            <textarea name="observacoes" defaultValue={String(checklist?.observacoes??'')} placeholder="Registre somente algo que precise ficar no histórico." style={{minHeight:90,padding:12,border:'1px solid #d9dde3',borderRadius:12}}/>
          </label>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className={styles.button} type="submit" name="decision" value="approve">Aprovar para entrega</button>
            <button className={styles.button} type="submit" name="decision" value="review">Salvar em revisão</button>
            <button className={styles.button} type="submit" name="decision" value="reject">Reprovar</button>
          </div>
        </form>
      </section>
    </div>
  </AppShell>;
}
