'use client';

import { FormEvent, useMemo, useState } from 'react';

type Message = { from: 'cliente' | 'bot'; text: string; meta?: string };
type LabResponse = {
  reply?: string;
  error?: string;
  model?: string;
  vehicleSourceConnected?: boolean;
  plan?: {
    intent: string;
    action: string;
    priority: string;
    needsHuman: boolean;
    confidence: number;
    plate: string;
    reason: string;
  };
};

const scenarios = [
  { label: 'Horário', text: 'Qual é o horário de funcionamento?' },
  { label: 'Endereço', text: 'Onde fica a Pint Services?' },
  { label: 'Instagram', text: 'Qual é o Instagram de vocês?' },
  { label: 'Status do carro', text: 'Oi, queria saber como está meu carro' },
  { label: 'Pedir foto', text: 'Consegue me mandar uma foto atual do carro?' },
  { label: 'Vistoria', text: 'Precisa marcar vistoria da seguradora?' },
  { label: 'Orçamento', text: 'Quanto fica para pintar a lateral?' },
  { label: 'Reclamação', text: 'Estou esperando há dias e quero falar com o gerente sobre o prazo' },
];

export default function SimulatorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Laboratório interno pronto. Digite como se fosse um cliente da Pint Services; nenhuma mensagem será enviada ao WhatsApp.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [plateContext, setPlateContext] = useState('');
  const [lastPlan, setLastPlan] = useState<LabResponse['plan']>();
  const [model, setModel] = useState('');

  const history = useMemo(() => messages.slice(-10).map((message) => ({
    origem: message.from,
    mensagem: message.text,
  })), [messages]);

  async function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;

    setLoading(true);
    setInput('');
    setMessages((current) => [...current, { from: 'cliente', text: clean }]);

    try {
      const response = await fetch('/api/simulador/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, history, plateContext }),
      });
      const data = await response.json() as LabResponse;
      if (!response.ok) throw new Error(data.error || 'Falha ao consultar a IA.');

      if (data.plan?.plate) setPlateContext(data.plan.plate);
      setLastPlan(data.plan);
      setModel(data.model || '');
      setMessages((current) => [...current, {
        from: 'bot',
        text: data.reply || 'A IA não retornou uma resposta.',
        meta: data.plan ? `${data.plan.action} · ${Math.round(data.plan.confidence * 100)}%` : undefined,
      }]);
    } catch (error: any) {
      setMessages((current) => [...current, {
        from: 'bot',
        text: error?.message || 'Não foi possível executar o teste.',
        meta: 'configuração necessária',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <main className="sim-page">
      <section className="sim-copy">
        <a className="back-link" href="/">← Voltar ao painel</a>
        <p className="eyebrow">LABORATÓRIO DA IA</p>
        <h1>Teste a IA antes de ligar o WhatsApp.</h1>
        <p>Agora esta tela usa o mesmo roteador de atendimento preparado para o WhatsApp, mas sem enviar mensagem externa e sem criar atendimento real. É o lugar seguro para ajustar respostas, regras e encaminhamentos.</p>

        <div className="lab-state-row">
          <span className="lab-state"><b>IA</b>{model ? `modelo ${model}` : 'aguardando configuração'}</span>
          <span className="lab-state"><b>WhatsApp</b>desligado neste laboratório</span>
        </div>

        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <button key={scenario.label} disabled={loading} onClick={() => void sendMessage(scenario.text)}>
              {scenario.label}<span>→</span>
            </button>
          ))}
        </div>

        <div className="guardrail-card">
          <strong>IA com limites operacionais</strong>
          <p>Preço, prazo, chegada de peça e fatos físicos não são inventados. Status depende da fonte oficial de veículos; dúvidas de risco, reclamação e baixa confiança vão para humano.</p>
        </div>

        {lastPlan && (
          <div className="decision-card">
            <div><small>ação</small><strong>{lastPlan.action}</strong></div>
            <div><small>intenção</small><strong>{lastPlan.intent}</strong></div>
            <div><small>prioridade</small><strong>{lastPlan.priority}</strong></div>
            <div><small>confiança</small><strong>{Math.round(lastPlan.confidence * 100)}%</strong></div>
            <p>{lastPlan.needsHuman ? 'Encaminhamento humano recomendado pela IA.' : 'A IA pode seguir dentro das regras atuais.'}</p>
          </div>
        )}
      </section>

      <section className="phone-shell" aria-label="Laboratório de conversa da IA">
        <div className="phone-top"><div className="phone-avatar">PS</div><div><strong>Pint Services</strong><span>laboratório interno</span></div><b>•••</b></div>
        <div className="phone-chat">
          <div className="encryption">Teste interno · nada é enviado para clientes</div>
          {messages.map((message, index) => (
            <div key={`${message.from}-${index}`} className={`bubble ${message.from}`}>
              <p>{message.text}</p>
              {message.meta && <em>{message.meta}</em>}
              <small>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{message.from === 'cliente' ? ' ✓✓' : ''}</small>
            </div>
          ))}
          {loading && <div className="bubble bot thinking"><p>IA analisando intenção e regras...</p></div>}
        </div>
        <form className="phone-input" onSubmit={submit}>
          <span>＋</span>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Digite como um cliente..." disabled={loading} />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar teste">➤</button>
        </form>
      </section>
    </main>
  );
}
