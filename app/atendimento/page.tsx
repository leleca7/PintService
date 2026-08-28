import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import { getDashboardData } from '@/lib/dashboard-data';

function dateTime(value: string | null) {
  if (!value) return 'Sem horário';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bahia' }).format(new Date(value));
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CL';
}

export default async function AttendancePage() {
  const data = await getDashboardData();
  const human = data.conversations.filter((item) => item.status.includes('humano'));
  const ai = data.conversations.filter((item) => !item.status.includes('humano'));
  const withVehicle = data.conversations.filter((item) => Boolean(item.placa)).length;

  return (
    <AppShell active="atendimento" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>ATENDIMENTO · CENTRAL DE TRIAGEM</p>
            <h1 className={styles.title}>Atendimento</h1>
            <p className={styles.subtitle}>A automação cuida da rotina. Aqui aparecem com clareza as conversas que realmente precisam de decisão ou presença humana.</p>
          </div>
        </header>

        <section className={styles.darkBand}>
          <div className={styles.darkCopy}>
            <p className={styles.darkLabel}>FILA ADMINISTRATIVA</p>
            <h2 className={styles.darkTitle}>{human.length ? `${human.length} ${human.length === 1 ? 'conversa chegou' : 'conversas chegaram'} até a equipe.` : 'Nenhuma conversa chegou ao topo agora.'}</h2>
            <p className={styles.darkText}>{human.length ? 'Esses casos ultrapassaram a camada automática e precisam de acompanhamento humano.' : 'As conversas carregadas estão sendo tratadas sem necessidade de escalonamento humano.'}</p>
          </div>
          <div className={styles.darkStats}>
            <div className={styles.darkStat}><strong>{human.length}</strong><span>precisam de pessoa</span></div>
            <div className={styles.darkStat}><strong>{ai.length}</strong><span>seguem na base</span></div>
          </div>
        </section>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Conversas carregadas</span><strong>{data.conversations.length}</strong><small>janela recente</small></div>
          <div className={styles.summaryItem}><span>Escaladas</span><strong>{human.length}</strong><small>atenção humana</small></div>
          <div className={styles.summaryItem}><span>Sem escalonamento</span><strong>{ai.length}</strong><small>rotina silenciosa</small></div>
          <div className={styles.summaryItem}><span>Com veículo identificado</span><strong>{withVehicle}</strong><small>contexto operacional</small></div>
        </div>

        <div className={styles.split}>
          <section className={styles.section}>
            <div className={styles.sectionHead}><div><p>PRIORIDADE HUMANA</p><h2>Chegaram até você</h2></div><span className={`${styles.count} ${human.length ? styles.countHot : ''}`}>{human.length}</span></div>
            {human.length ? <div className={styles.list}>{human.map((conversation) => <article className={`${styles.row} ${styles.rowCritical}`} key={conversation.id}>
              <div className={styles.avatar}>{initials(conversation.cliente)}</div>
              <div className={styles.rowBody}>
                <div className={styles.rowTop}><strong>{conversation.cliente}</strong><time>{dateTime(conversation.criadoEm)}</time></div>
                <p className={styles.preview}>{conversation.mensagem}</p>
                <div className={styles.meta}><span className={`${styles.badge} ${styles.badgeHuman}`}>Aguardando humano</span>{conversation.placa && <span>{conversation.placa}</span>}{conversation.intencao && <span>{conversation.intencao}</span>}</div>
              </div>
              <span className={styles.chevron}>›</span>
            </article>)}</div> : <div className={styles.quiet}><strong>Fila humana limpa.</strong>Nenhuma conversa precisa de intervenção neste momento.</div>}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><div><p>ROTINA SILENCIOSA</p><h2>Tratadas na base</h2></div><span className={styles.count}>{ai.length}</span></div>
            {ai.length ? <div className={styles.list}>{ai.slice(0, 12).map((conversation) => <article className={styles.row} key={conversation.id}>
              <div className={styles.avatar}>{initials(conversation.cliente)}</div>
              <div className={styles.rowBody}>
                <div className={styles.rowTop}><strong>{conversation.cliente}</strong><time>{dateTime(conversation.criadoEm)}</time></div>
                <p className={styles.preview}>{conversation.mensagem}</p>
                <div className={styles.meta}><span className={`${styles.badge} ${styles.badgeAi}`}>{conversation.status}</span>{conversation.placa && <span>{conversation.placa}</span>}</div>
              </div>
            </article>)}</div> : <div className={styles.quiet}><strong>Nenhuma conversa automática carregada.</strong>Quando o WhatsApp estiver em operação, a rotina segura aparecerá aqui sem competir com as exceções.</div>}
          </section>
        </div>

        <section className="system-banner info-banner"><strong>Regra de operação</strong><span>A IA responde apenas os casos seguros. Reclamação, negociação de preço ou prazo, pedido de gerente, dado ausente ou baixa confiança passam para uma pessoa.</span></section>
      </div>
    </AppShell>
  );
}
