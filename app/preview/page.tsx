export const dynamic = 'force-static';

const cars = [
  { model: 'Toyota Corolla', plate: 'ABC1D23', client: 'João Santos', stage: 'Pintura' },
  { model: 'Chevrolet Onix', plate: 'QWE4F56', client: 'Mariana Souza', stage: 'Funilaria' },
  { model: 'Honda Civic', plate: 'JKL2M34', client: 'Aline Rocha', stage: 'Montagem' },
];

const tasks = [
  { title: 'Registrar foto atual do veículo', text: 'Equipe de pintura precisa enviar evidência antes do retorno ao cliente.', owner: 'Pintura', status: 'Alta' },
  { title: 'Confirmar chegada de peça', text: 'A IA aguarda confirmação física antes de responder no WhatsApp.', owner: 'Montagem', status: 'Pendente' },
  { title: 'Validar etapa de preparação', text: 'Confirmação humana necessária para atualizar o histórico do carro.', owner: 'Preparação', status: 'Normal' },
];

export default function PreviewPage() {
  return (
    <main className="design-preview">
      <div className="preview-frame">
        <aside className="preview-side">
          <div className="preview-brand"><i className="preview-mark" /><div><strong>PintService</strong><small>Pint Services · car center</small></div></div>
          <div className="preview-nav">
            {['Visão geral','Atendimento','Veículos','Tarefas','Funcionários','Perfis e acessos','Configurações'].map((item) => <span key={item}><i />{item}</span>)}
          </div>
        </aside>

        <section className="preview-main">
          <header className="preview-header">
            <div><p className="eyebrow">OPERAÇÃO DA OFICINA</p><h1>Painel Pint Services</h1><p>Atendimento, produção e equipe em uma única visão operacional.</p></div>
            <div className="preview-status">Preview visual · sem dados reais</div>
          </header>

          <section className="preview-stats">
            <article className="preview-stat"><span>Veículos em produção</span><strong>12</strong></article>
            <article className="preview-stat"><span>Tarefas abertas</span><strong>07</strong></article>
            <article className="preview-stat"><span>Aguardando equipe</span><strong>03</strong></article>
            <article className="preview-stat"><span>Atendimentos hoje</span><strong>18</strong></article>
          </section>

          <section className="preview-grid">
            <article className="preview-panel">
              <div className="preview-panel-head"><div><p className="eyebrow">PRODUÇÃO</p><h2>Veículos em acompanhamento</h2></div><small>Ver todos</small></div>
              <div className="preview-cars">
                {cars.map((car) => <div className="preview-car" key={car.plate}><i className="preview-car-art" /><div><strong>{car.model}</strong><span>{car.plate} · {car.client}</span></div><em>{car.stage}</em></div>)}
              </div>
            </article>

            <article className="preview-panel">
              <div className="preview-panel-head"><div><p className="eyebrow">PRIORIDADES</p><h2>O que precisa ser resolvido</h2></div><small>Fila atual</small></div>
              <div className="preview-tasks">
                {tasks.map((task) => <div className="preview-task" key={task.title}><b>{task.title}</b><p>{task.text}</p><div><span>{task.owner}</span><span>{task.status}</span></div></div>)}
              </div>
            </article>
          </section>

          <section className="preview-integrations" aria-label="Status das integrações">
            <div className="preview-integration"><span>Banco</span><strong><i />Neon Postgres</strong></div>
            <div className="preview-integration"><span>Login</span><strong><i />Neon Auth</strong></div>
            <div className="preview-integration"><span>Inteligência</span><strong><i />OpenAI</strong></div>
            <div className="preview-integration"><span>Atendimento</span><strong><i />WhatsApp Cloud</strong></div>
          </section>
        </section>
      </div>
    </main>
  );
}
