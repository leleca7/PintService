'use client';

import { useMemo, useState } from 'react';
import type { ReputationData, ReputationItem, ReputationChannel } from '@/lib/reputation';

const channelLabels: Record<ReputationChannel, string> = { google: 'Google', instagram: 'Instagram', reclame_aqui: 'Reclame Aqui', whatsapp: 'WhatsApp' };

function relativeTime(value: string) {
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}
function stars(value: number | null) { return value ? `${value}/5` : null; }

export default function ReputationClient({ data }: { data: ReputationData }) {
  const [items, setItems] = useState(data.items);
  const [filter, setFilter] = useState<'todos' | ReputationChannel>('todos');
  const initial = data.items.find((item) => item.priority === 'urgente' || item.priority === 'alta') ?? data.items[0] ?? null;
  const [selectedId, setSelectedId] = useState(initial?.id ?? '');
  const [draft, setDraft] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const visible = useMemo(() => items.filter((item) => filter === 'todos' || item.channel === filter), [items, filter]);
  const selected = items.find((item) => item.id === selectedId) ?? visible[0] ?? null;

  function choose(item: ReputationItem) { setSelectedId(item.id); setDraft(''); setNotice(''); }

  async function generateDraft() {
    if (!selected) return;
    setLoadingDraft(true); setNotice('');
    try {
      const response = await fetch('/api/reputacao/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item: selected }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Não foi possível gerar o rascunho.');
      setDraft(String(payload.text || ''));
    } catch (error: any) { setNotice(error?.message || 'Falha ao gerar rascunho.'); }
    finally { setLoadingDraft(false); }
  }

  async function sendReply() {
    if (!selected || !draft.trim()) return;
    setSending(true); setNotice('');
    try {
      const response = await fetch('/api/reputacao/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item: selected, text: draft.trim() }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Não foi possível enviar a resposta.');
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: 'respondido' as const } : item));
      setNotice('Resposta enviada pelo canal oficial.');
    } catch (error: any) { setNotice(error?.message || 'Falha ao enviar resposta.'); }
    finally { setSending(false); }
  }

  const urgent = items.filter((item) => item.priority === 'urgente' || item.priority === 'alta').length;
  const waiting = items.filter((item) => item.status !== 'respondido').length;
  const negativeGoogle = items.filter((item) => item.channel === 'google' && item.rating !== null && item.rating <= 3).length;

  return (
    <>
      <section className="reputation-metrics">
        <article><span>Precisam de atenção</span><strong>{urgent}</strong><small>alta ou urgente</small></article>
        <article><span>Aguardando resposta</span><strong>{waiting}</strong><small>todos os canais</small></article>
        <article><span>Google crítico</span><strong>{negativeGoogle}</strong><small>avaliações até 3 estrelas</small></article>
        <article><span>RA aguardando</span><strong>{data.reclameAqui.waitingReplies ?? '—'}</strong><small>{data.reclameAqui.source === 'live' ? 'dados do Reclame Aqui' : 'canal ainda não conectado'}</small></article>
      </section>

      <section className="channel-strip" aria-label="Status dos canais">
        {data.channels.map((channel) => <button key={channel.channel} type="button" className={`channel-status ${channel.state}`} onClick={() => setFilter(channel.channel)}><span className="channel-status-dot"/><strong>{channel.label}</strong><small>{channel.state === 'ready' ? 'conectado' : channel.state === 'partial' ? 'parcial' : 'pendente'}</small></button>)}
      </section>

      <div className="reputation-layout">
        <section className="panel reputation-queue">
          <div className="panel-head reputation-head"><div><p className="eyebrow">FILA ÚNICA</p><h2>Reputação e mensagens</h2></div><div className="reputation-filters"><button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos</button><button className={filter === 'google' ? 'active' : ''} onClick={() => setFilter('google')}>Google</button><button className={filter === 'instagram' ? 'active' : ''} onClick={() => setFilter('instagram')}>Instagram</button><button className={filter === 'reclame_aqui' ? 'active' : ''} onClick={() => setFilter('reclame_aqui')}>Reclame Aqui</button></div></div>
          <div className="reputation-list">
            {visible.map((item) => <button type="button" className={`reputation-item ${selected?.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => choose(item)}><span className={`channel-glyph ${item.channel}`} aria-hidden="true">{item.channel === 'google' ? 'G' : item.channel === 'instagram' ? 'IG' : item.channel === 'reclame_aqui' ? 'RA' : 'WA'}</span><span className="reputation-item-body"><span className="reputation-item-top"><strong>{item.title}</strong><time>{relativeTime(item.createdAt)}</time></span><span className="reputation-author">{item.author}{item.rating ? ` · ${stars(item.rating)}` : ''}</span><span className="reputation-preview">{item.message}</span><span className="reputation-tags"><i className={`priority-tag ${item.priority}`}>{item.priority}</i><i className="channel-tag">{channelLabels[item.channel]}</i>{item.requiresApproval && <i className="approval-tag">aprovação humana</i>}</span></span></button>)}
            {!visible.length && <div className="empty-state">Nenhum item nesse canal agora.</div>}
          </div>
        </section>

        <aside className="panel reputation-detail">
          {selected ? <><div className="reputation-detail-head"><div><p className="eyebrow">{channelLabels[selected.channel].toUpperCase()}</p><h2>{selected.title}</h2><span>{selected.author} · {relativeTime(selected.createdAt)}</span></div><span className={`priority-tag large ${selected.priority}`}>{selected.priority}</span></div><div className="customer-message"><p>{selected.message}</p></div>{selected.rating && <div className="rating-row"><span>Nota registrada</span><strong>{selected.rating}/5</strong></div>}<div className="safety-note"><strong>{selected.requiresApproval ? 'Resposta exige aprovação' : 'Resposta assistida'}</strong><span>A IA pode redigir, mas não pode inventar prazo, preço, culpa, dano, status físico ou promessa.</span></div><div className="reply-composer"><div className="composer-head"><strong>Resposta</strong><button type="button" onClick={generateDraft} disabled={loadingDraft}>{loadingDraft ? 'Gerando...' : draft ? 'Gerar novamente' : 'Gerar rascunho com IA'}</button></div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Gere um rascunho ou escreva a resposta aqui." rows={7}/><div className="composer-actions"><span>{selected.canReply ? 'Canal permite resposta' : 'Resposta direta ainda não conectada'}</span><button type="button" className="primary" disabled={!draft.trim() || sending || !selected.canReply} onClick={sendReply}>{sending ? 'Enviando...' : 'Aprovar e responder'}</button></div>{notice && <p className="composer-notice">{notice}</p>}</div></> : <div className="empty-state">Selecione um atendimento para analisar.</div>}
        </aside>
      </div>

      <section className="panel ra-overview"><div className="panel-head"><div><p className="eyebrow">RECLAME AQUI</p><h2>Indicadores de reputação</h2></div><span className="source-chip">{data.reclameAqui.source === 'live' ? 'dados reais' : 'não conectado'}</span></div><div className="ra-grid"><div><span>Índice de reputação</span><strong>{data.reclameAqui.reputationScore ?? '—'}</strong></div><div><span>Nota do consumidor</span><strong>{data.reclameAqui.consumerScore ?? '—'}</strong></div><div><span>Respondidas</span><strong>{data.reclameAqui.answeredPercent !== null ? `${data.reclameAqui.answeredPercent}%` : '—'}</strong></div><div><span>Resolvidas</span><strong>{data.reclameAqui.resolvedPercent !== null ? `${data.reclameAqui.resolvedPercent}%` : '—'}</strong></div><div><span>Reclamações recebidas</span><strong>{data.reclameAqui.complaintsReceived ?? '—'}</strong></div><div><span>Tempo médio de resposta</span><strong>{data.reclameAqui.avgReplyDays !== null ? `${data.reclameAqui.avgReplyDays}d` : '—'}</strong></div></div>{!!data.reclameAqui.topProblems.length && <div className="ra-problems"><span>Principais motivos</span>{data.reclameAqui.topProblems.map((problem) => <i key={problem}>{problem}</i>)}</div>}</section>
    </>
  );
}
