import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';

function dateTime(value: string | null) {
  if (!value) return 'Sem horário';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bahia' }).format(new Date(value));
}

export default async function AttendancePage() {
  const data = await getDashboardData();
  const human = data.conversations.filter((item) => item.status.includes('humano'));
  const ai = data.conversations.filter((item) => !item.status.includes('humano'));

  return (
    <AppShell active="atendimento" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">WHATSAPP</p><h1>Atendimento</h1><p>Conversas recentes e casos que realmente precisam de uma pessoa.</p></div></header>

      <div className="attendance-layout">
        <section className="panel page-panel">
          <div className="panel-head"><div><p className="eyebrow">PRIORIDADE HUMANA</p><h2>Precisam de atendimento</h2></div><span className="count">{human.length}</span></div>
          <div className="chat-list">
            {human.map((conversation) => <article className="chat-card human-chat" key={conversation.id}><div className="avatar soft">{conversation.cliente.slice(0, 2).toUpperCase()}</div><div className="chat-card-body"><div><strong>{conversation.cliente}</strong><time>{dateTime(conversation.criadoEm)}</time></div><p>{conversation.mensagem}</p><div className="chat-meta"><span className="tag human">Aguardando humano</span>{conversation.placa && <span>{conversation.placa}</span>}{conversation.intencao && <span>{conversation.intencao}</span>}</div></div></article>)}
            {!human.length && <div className="empty-state compact-empty">Nenhuma conversa aguardando humano.</div>}
          </div>
        </section>

        <section className="panel page-panel">
          <div className="panel-head"><div><p className="eyebrow">IA ACOMPANHANDO</p><h2>Conversas automatizadas</h2></div><span className="live"><i /> {data.source === 'live' ? 'ao vivo' : 'preview'}</span></div>
          <div className="chat-list">
            {ai.map((conversation) => <article className="chat-card" key={conversation.id}><div className="avatar soft">{conversation.cliente.slice(0, 2).toUpperCase()}</div><div className="chat-card-body"><div><strong>{conversation.cliente}</strong><time>{dateTime(conversation.criadoEm)}</time></div><p>{conversation.mensagem}</p><div className="chat-meta"><span className="tag ai">{conversation.status}</span>{conversation.placa && <span>{conversation.placa}</span>}{conversation.intencao && <span>{conversation.intencao}</span>}</div></div></article>)}
            {!ai.length && <div className="empty-state compact-empty">Nenhuma conversa automatizada encontrada.</div>}
          </div>
        </section>
      </div>

      <section className="system-banner info-banner"><strong>Como vai funcionar ao vivo</strong><span>A IA continua respondendo sozinha nos casos seguros. Reclamação, negociação de preço/prazo, pedido de gerente ou baixa confiança aparecem aqui para uma pessoa assumir.</span></section>
    </AppShell>
  );
}
