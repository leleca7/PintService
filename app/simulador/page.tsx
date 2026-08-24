'use client';

import { useState } from 'react';

type Message = { from: 'cliente' | 'bot'; text: string };

const scenarios = [
  { label: 'Status do carro', text: 'Oi, queria saber como está meu carro', reply: 'Claro 😊 Pode me informar a placa do veículo?' },
  { label: 'Enviar placa', text: 'ABC1D23', reply: 'Seu Toyota Corolla (ABC1D23) está registrado na etapa de Pintura. Essa informação vem do sistema; se você precisar de uma confirmação física de agora, eu posso pedir para a equipe verificar.' },
  { label: 'Pedir foto', text: 'Consegue me mandar uma foto dele?', reply: 'Vou pedir uma foto atual do ABC1D23 para a equipe. Criei uma tarefa específica e, quando o funcionário confirmar a foto, eu continuo com você automaticamente por aqui.' },
  { label: 'Confirmar etapa', text: 'Ele já entrou na cabine de pintura agora?', reply: 'Essa informação precisa de confirmação física. Já deixei uma verificação para o setor responsável e te aviso por aqui assim que a equipe confirmar.' },
  { label: 'Vistoria', text: 'Precisa marcar vistoria da seguradora?', reply: 'Para vistorias de seguradoras e associações, não é necessário agendamento. O atendimento é por ordem de chegada, das 8h às 16h.' },
  { label: 'Orçamento', text: 'Quanto fica para pintar a lateral?', reply: 'O valor depende da avaliação do veículo e do serviço. Registrei seu pedido para uma pessoa da oficina continuar com você por aqui.' },
  { label: 'Falar com humano', text: 'Quero falar com uma pessoa sobre o prazo', reply: 'Entendi. Encaminhei sua mensagem para o atendimento humano e as respostas automáticas ficam pausadas enquanto uma pessoa assume.' },
];

export default function SimulatorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Olá! 👋 Sou o assistente da PintService. Posso ajudar com andamento do veículo, vistoria, fotos e solicitações de atendimento.' },
  ]);

  function runScenario(index: number) {
    const scenario = scenarios[index];
    setMessages((current) => [...current, { from: 'cliente', text: scenario.text }, { from: 'bot', text: scenario.reply }]);
  }

  return (
    <main className="sim-page">
      <section className="sim-copy">
        <a className="back-link" href="/">← Voltar ao painel</a>
        <p className="eyebrow">SIMULADOR SEM API</p>
        <h1>Veja como o cliente vai conversar com a PintService.</h1>
        <p>Esta tela não gasta OpenAI nem envia WhatsApp. Ela reproduz as regras que o sistema real vai seguir quando as integrações forem conectadas.</p>
        <div className="scenario-grid">
          {scenarios.map((scenario, index) => <button key={scenario.label} onClick={() => runScenario(index)}>{scenario.label}<span>→</span></button>)}
        </div>
        <div className="guardrail-card"><strong>🛡 IA com limites</strong><p>Preço, prazo e fatos físicos nunca são inventados. O sistema usa dados registrados ou cria uma tarefa para uma pessoa confirmar.</p></div>
      </section>

      <section className="phone-shell" aria-label="Simulação de conversa no WhatsApp">
        <div className="phone-top"><div className="phone-avatar">PS</div><div><strong>PintService</strong><span>online</span></div><b>•••</b></div>
        <div className="phone-chat">
          <div className="encryption">🔒 Demonstração do atendimento automatizado</div>
          {messages.map((message, index) => <div key={`${message.from}-${index}`} className={`bubble ${message.from}`}><p>{message.text}</p><small>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{message.from === 'cliente' ? ' ✓✓' : ''}</small></div>)}
        </div>
        <div className="phone-input"><span>＋</span><div>Mensagem</div><span>🎙</span></div>
      </section>
    </main>
  );
}
