import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import ops from '@/app/components/precision-atelier-ops.module.css';
import { getDashboardData } from '@/lib/dashboard-data';

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function timestamp(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function dateTime(value: string | null) {
  const parsed = timestamp(value);
  if (parsed === null) return 'Sem horário';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bahia' }).format(new Date(parsed));
}

function elapsed(value: string | null) {
  const parsed = timestamp(value);
  if (parsed === null) return 'tempo não informado';
  const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60_000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

function timeValue(value: string | null, fallback: number) {
  return timestamp(value) ?? fallback;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CL';
}

export default async function AttendancePage() {
  const data = await getDashboardData();
  const human = data.conversations
    .filter((item) => normalize(item.status).includes('humano'))
    .sort((a, b) => timeValue(a.criadoEm, Number.MAX_SAFE_INTEGER) - timeValue(b.criadoEm, Number.MAX_SAFE_INTEGER));
  const ai = data.conversations
    .filter((item) => !normalize(item.status).includes('humano'))
    .sort((a, b) => timeValue(b.criadoEm, 0) - timeValue(a.criadoEm, 0));
  const withVehicle = data.conversations.filter((item) => Boolean(item.placa)).length;
  const hasEscalation = human.length > 0;

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

        {hasEscalation ? (
          <section className={styles.darkBand}>
            <div className={styles.darkCopy}>
              <p className={styles.darkLabel}>FILA ADMINISTRATIVA</p>
              <h2 className={styles.darkTitle}>{human.length} {human.length === 1 ? 'conversa chegou' : 'conversas chegaram'} até a equipe.</h2>
              <p className={styles.darkText}>Esses casos ultrapassaram a camada automática. Os mais antigos aparecem primeiro para reduzir o risco de uma conversa ficar esquecida.</p>
            </div>
            <div className={styles.darkStats}>
              <div className={styles.darkStat}><strong>{human.length}</strong><span>precisam de pessoa</span></div>
              <div className={styles.darkStat}><strong>{ai.length}</strong><span>seguem na base</span></div>
            </div>
          </section>
        ) : (
          <section className={ops.calmBand}>
            <div>
              <p className={ops.calmLabel}>OPERAÇÃO TRANQUILA</p>
              <h2 className={ops.calmTitle}>Nenhuma conversa chegou ao topo agora.</h2>
              <p className={ops.calmText}>As conversas carregadas estão sendo tratadas sem necessidade de escalonamento humano. O sistema permanece silencioso enquanto a base resolve a rotina.</p>
            </div>
            <div className={ops.calmStats}>
              <div className={ops.calmStat}><strong>0</strong><span>escaladas</span></div>
              <div className={ops.calmStat}><strong>{ai.length}</strong><span>na base</span></div>
            </div>
          </section>
        )}

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}><span>Conversas carregadas</span><strong>{data.conversations.length}</strong><small>janela recente</small></div>
          <div className={styles.summaryItem}><span>Escaladas</span><strong>{human.length}</strong><small>atenção humana</small></div>
          <div className={styles.summaryItem}><span>Sem escalonamento</span><strong>{ai.length}</strong><small>rotina silenciosa</small></div>
          <div className={styles.summaryItem}><span>Com veículo identificado</span><strong>{withVehicle}</strong><small>contexto operacional</small></div>
        </div>

        <div className={styles.split}>
          <section className={`${styles.section} ${hasEscalation ? ops.queueSection : ''}`}>
            <div className={styles.sectionHead}><div><p>PRIORIDADE HUMANA</p><h2>Chegaram até você</h2></div><span className={`${styles.count} ${human.length ? styles.countHot : ''}`}>{human.length}</span></div>
            {human.length ? <div className={styles.list}>{human.map((conversation) => <article className={`${styles.row} ${styles.rowCritical}`} key={conversation.id}>
              <div className={styles.avatar}>{initials(conversation.cliente)}</div>
              <div className={styles.rowBody}>
                <div className={styles.rowTop}><strong>{conversation.cliente}</strong><time>{dateTime(conversation.criadoEm)}</time></div>
                <p className={styles.preview}>{conversation.mensagem}</p>
                <div className={styles.meta}>
                  <span className={`${styles.badge} ${styles.badgeHuman}`}>Aguardando humano</span>
                  <span className={ops.waiting}>{elapsed(conversation.criadoEm)}</span>
                  {conversation.placa && <span>{conversation.placa}</span>}
                  {conversation.intencao && <span>{conversation.intencao}</span>}
                </div>
              </div>
              <span className={styles.chevron}>›</span>
            </article>)}</div> : <div className={styles.quiet}><strong>Fila humana limpa.</strong>Nenhuma conversa precisa de intervenção neste momento.</div>}
          </section>

          <section className={`${styles.section} ${ops.routineSection}`}>
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
