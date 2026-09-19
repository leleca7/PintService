import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getOperationalIntelligenceData } from '@/lib/operational-intelligence';
import { markOperationalAlertResolved, markSupplierChargeSent, saveSupplierContact } from './actions';

function asObject(value:any){
  if(!value) return {};
  if(typeof value==='string'){try{return JSON.parse(value);}catch{return {};}}
  return value;
}

export default async function OperationalIntelligencePage(){
  const data=await getOperationalIntelligenceData();
  const critical=data.alerts.filter((a:any)=>a.nivel==='critico').length;
  const high=data.alerts.filter((a:any)=>a.nivel==='alto').length;

  return <AppShell active="operacao" source="live">
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.kicker}>INTELIGÊNCIA OPERACIONAL · EXCEÇÕES PRIMEIRO</p>
          <h1 className={styles.title}>Supervisor digital da oficina</h1>
          <p className={styles.subtitle}>A rotina normal fica silenciosa. Aqui aparecem atrasos, paradas, fornecedores e previsões que realmente pedem decisão.</p>
        </div>
        <Link className={styles.button} href="/operacao">Voltar à operação</Link>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}><span>Alertas abertos</span><strong>{data.alerts.length}</strong><small>{critical} críticos · {high} altos</small></div>
        <div className={styles.summaryItem}><span>Com previsão operacional</span><strong>{Number((data.forecast as any).com_previsao??0)}</strong><small>estimativa interna calculada</small></div>
        <div className={styles.summaryItem}><span>Sem previsão segura</span><strong>{Number((data.forecast as any).sem_previsao??0)}</strong><small>não inventamos data</small></div>
        <div className={styles.summaryItem}><span>Confiança média</span><strong>{(data.forecast as any).confianca_media==null?'—':`${Number((data.forecast as any).confianca_media)}%`}</strong><small>das previsões disponíveis</small></div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}><div><p>EXCEÇÕES</p><h2>O que precisa de ação</h2></div><span className={styles.count}>{data.alerts.length}</span></div>
        {data.alerts.length?<div className={styles.list}>{data.alerts.map((alert:any)=>{
          const payload=asObject(alert.dados);
          return <article className={`${styles.row} ${['alto','critico'].includes(String(alert.nivel))?styles.rowCritical:''}`} key={String(alert.id)}>
            <div className={styles.rowBody}>
              <div className={styles.rowTop}><strong>{String(alert.titulo)}</strong><span>{String(alert.nivel)}</span></div>
              <p className={styles.preview}>{String(alert.mensagem)}</p>
              {payload.draft&&<div style={{marginTop:8,padding:10,border:'1px dashed #BD9558',borderRadius:10}}><small>Mensagem de cobrança preparada</small><p style={{margin:'4px 0 0'}}>{String(payload.draft)}</p></div>}
              <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                {alert.tipo==='fornecedor_atrasado'&&alert.pedido_pecas_id&&<form action={markSupplierChargeSent}><input type="hidden" name="alert_id" value={String(alert.id)}/><button className={styles.button} type="submit">Marcar cobrança feita</button></form>}
                <form action={markOperationalAlertResolved}><input type="hidden" name="id" value={String(alert.id)}/><button className={styles.button} type="submit">Resolver alerta</button></form>
              </div>
            </div>
          </article>;
        })}</div>:<div className={styles.quiet}><strong>Nenhuma exceção aberta.</strong>A operação está dentro dos limites registrados.</div>}
      </section>

      <div className={styles.split}>
        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>ETAPAS</p><h2>Carga e permanência</h2></div></div>
          <div className={styles.list}>{data.stages.map((row:any)=><div className={styles.row} key={String(row.setor??'sem-setor')}><div className={styles.rowBody}><div className={styles.rowTop}><strong>{String(row.setor??'Sem etapa')}</strong><span>{Number(row.quantidade)} carro(s)</span></div><p className={styles.preview}>Média atual: {Number(row.media_horas??0)}h nesta etapa</p></div></div>)}</div>
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>CAUSAS</p><h2>Por que os carros param</h2></div></div>
          <div className={styles.list}>{data.causes.map((row:any)=><div className={styles.row} key={String(row.motivo)}><div className={styles.rowBody}><div className={styles.rowTop}><strong>{String(row.motivo)}</strong><span>{Number(row.quantidade)}</span></div></div></div>)}</div>
        </section>
      </div>

      <div className={styles.split}>
        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>SEGURADORAS</p><h2>Tempo médio dos entregues</h2></div></div>
          <div className={styles.list}>{data.insurers.map((row:any)=><div className={styles.row} key={String(row.seguradora)}><div className={styles.rowBody}><div className={styles.rowTop}><strong>{String(row.seguradora)}</strong><span>{row.media_dias==null?'—':`${Number(row.media_dias)} dias`}</span></div><p className={styles.preview}>{Number(row.entregues)} veículo(s) concluído(s) na base</p></div></div>)}</div>
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p>FORNECEDORES</p><h2>Pedidos e atrasos</h2></div></div>
          <div className={styles.list}>{data.suppliers.map((row:any)=><div className={styles.row} key={String(row.fornecedor)}><div className={styles.rowBody}>
            <div className={styles.rowTop}><strong>{String(row.fornecedor)}</strong><span>{Number(row.atrasados)} atrasado(s)</span></div>
            <p className={styles.preview}>{Number(row.pedidos)} pedido(s) registrados · {row.telefone ? 'WhatsApp cadastrado' : 'sem contato cadastrado'}</p>
            <form action={saveSupplierContact} style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
              <input type="hidden" name="nome" value={String(row.fornecedor)}/>
              <input name="telefone" defaultValue={String(row.telefone??'')} placeholder="WhatsApp do fornecedor" style={{padding:8,border:'1px solid #d9dde3',borderRadius:8}}/>
              <input name="email" defaultValue={String(row.email??'')} placeholder="E-mail" style={{padding:8,border:'1px solid #d9dde3',borderRadius:8}}/>
              <button className={styles.button} type="submit">Salvar contato</button>
            </form>
          </div></div>)}</div>
        </section>
      </div>
    </div>
  </AppShell>;
}
