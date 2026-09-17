import type { Metadata } from 'next';
import styles from './site.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Seu carro novo de novo',
  description: 'Funilaria, pintura e recuperação automotiva em Lauro de Freitas. Atendimento particular e todas as seguradoras.',
};

const insurers = [
  'Bradesco Seguros',
  'Tokio Marine',
  'MSIG',
  'Allianz',
  'Suhai',
  'SulAmérica',
  'Generali',
  'Liberty',
  'Azul Seguros',
  'HDI',
  'Porto',
];

const process = [
  {
    number: '01',
    title: 'Avaliação',
    kicker: 'Entender antes de executar.',
    text: 'O processo começa com leitura do dano, orientação clara e definição do que precisa acontecer no veículo.',
  },
  {
    number: '02',
    title: 'Preparação',
    kicker: 'A base do acabamento final.',
    text: 'Desmontagem, funilaria e preparação de pintura entram em sequência para devolver forma e precisão às superfícies.',
  },
  {
    number: '03',
    title: 'Pintura',
    kicker: 'Cor, uniformidade e controle.',
    text: 'Aplicação de pintura e refino visual com atenção à leitura da cor, cobertura e acabamento.',
  },
  {
    number: '04',
    title: 'Finalização',
    kicker: 'O detalhe muda a entrega.',
    text: 'Montagem, polimento, revisão visual e acabamento encerram o ciclo antes do veículo voltar para a rua.',
  },
];

const services = [
  ['Funilaria & pintura', 'Recuperação de forma e acabamento com preparação cuidadosa em cada etapa.'],
  ['Martelinho de ouro', 'Correção de amassados quando o reparo permite preservar a originalidade da peça.'],
  ['Pintura de rodas', 'Renovação visual das rodas com preparação, correção estética e acabamento.'],
  ['Polimento', 'Refino da pintura e recuperação do brilho para uma leitura visual mais uniforme.'],
  ['Higienização', 'Cuidado interno e externo para completar a experiência de entrega.'],
];

function Brand() {
  return (
    <div className={styles.brand} aria-label="Pint Services Car Center">
      <span className={styles.brandMark} aria-hidden="true"><span /></span>
      <span className={styles.brandCopy}>
        <strong>Pint Services</strong>
        <small>car center</small>
      </span>
    </div>
  );
}

export default function PintServicesSite() {
  return (
    <main id="top" className={styles.site}>
      <header className={styles.header}>
        <a href="#top" className={styles.brandLink} aria-label="Ir para o início"><Brand /></a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#processo">Processo</a>
          <a href="#servicos">Serviços</a>
          <a href="#seguradoras">Seguradoras</a>
          <a href="#contato" className={styles.navCta}>Solicitar orçamento</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden="true">
          <div className={styles.heroGlow} />
          <div className={styles.heroCar}>
            <span className={styles.carRoof} />
            <span className={styles.carBody} />
            <span className={styles.wheelLeft} />
            <span className={styles.wheelRight} />
          </div>
          <span className={styles.heroWord}>PINT</span>
        </div>

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>FUNILARIA · PINTURA · CAR CENTER</p>
          <h1>
            <span>SEU CARRO</span>
            <span className={styles.heroAccent}>NOVO DE NOVO.</span>
          </h1>
          <div className={styles.heroBottom}>
            <p>Atendimento particular e todas as seguradoras em Lauro de Freitas.</p>
            <a href="#contato" className={styles.roundLink} aria-label="Ir para contato">↘</a>
          </div>
        </div>

        <div className={styles.scrollCue} aria-hidden="true">
          <span>SCROLL TO DISCOVER</span>
          <i />
        </div>
      </section>

      <section className={styles.manifesto}>
        <div className={styles.manifestoLabel}>PINT SERVICES / 01</div>
        <div className={styles.manifestoText}>
          <p>Seu carro não entra apenas para ser reparado.</p>
          <h2>Ele entra em um processo pensado para devolver <em>forma, acabamento e confiança.</em></h2>
        </div>
      </section>

      <section id="processo" className={styles.processSection}>
        <div className={styles.processSticky}>
          <p className={styles.eyebrow}>DO DANO À ENTREGA</p>
          <h2>Um processo.<br />Quatro movimentos.</h2>
          <div className={styles.processVisual} aria-hidden="true">
            <div className={styles.panelLine} />
            <span>01</span><span>02</span><span>03</span><span>04</span>
          </div>
        </div>

        <div className={styles.processSteps}>
          {process.map((step) => (
            <article key={step.number} className={styles.processStep}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div>
                <p className={styles.stepKicker}>{step.kicker}</p>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.proofSection}>
        <div className={styles.proofHeadline}>
          <p className={styles.eyebrow}>POR QUE A PINT</p>
          <h2>Estrutura, técnica e compromisso para você ter confiança do início ao fim.</h2>
        </div>
        <div className={styles.proofRail}>
          <article><span>01</span><strong>Equipe qualificada</strong><p>Técnica e experiência para cuidar de cada etapa do reparo.</p></article>
          <article><span>02</span><strong>Estrutura & equipamentos</strong><p>Ambiente e ferramentas adequadas para execução e acabamento.</p></article>
          <article><span>03</span><strong>Transparência</strong><p>Clareza sobre o que será feito e acompanhamento do processo.</p></article>
          <article><span>04</span><strong>Prazo de entrega</strong><p>Organização para conduzir o veículo até a entrega com compromisso.</p></article>
        </div>
      </section>

      <section id="servicos" className={styles.servicesSection}>
        <div className={styles.servicesIntro}>
          <p className={styles.eyebrow}>SERVIÇOS / 02</p>
          <h2>Do reparo bruto ao último reflexo da pintura.</h2>
        </div>
        <div className={styles.serviceScenes}>
          {services.map(([title, text], index) => (
            <article key={title} className={styles.serviceScene}>
              <div className={styles.sceneNumber}>0{index + 1}</div>
              <div className={styles.sceneCopy}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <div className={styles.sceneGraphic} aria-hidden="true"><span /></div>
            </article>
          ))}
        </div>
      </section>

      <section id="seguradoras" className={styles.insurersSection}>
        <div className={styles.insurersTop}>
          <p className={styles.eyebrow}>SEGURADORAS / 03</p>
          <h2>Teve problema com o carro?<br /><span>A Pint resolve.</span></h2>
          <p>Trabalhamos com todas as seguradoras e também atendemos clientes particulares.</p>
        </div>
        <div className={styles.marquee} aria-label="Seguradoras atendidas">
          <div className={styles.marqueeTrack}>
            {[...insurers, ...insurers].map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}
          </div>
        </div>
      </section>

      <section className={styles.statementSection}>
        <p>PINT SERVICES</p>
        <h2>O carro volta para a rua.<br /><em>A sensação é de carro novo.</em></h2>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div className={styles.contactHeadline}>
          <p className={styles.eyebrow}>SOLICITE SEU ORÇAMENTO</p>
          <h2>Vamos colocar seu carro de volta no lugar certo.</h2>
          <a className={styles.whatsappButton} href="https://wa.me/5571994000097" target="_blank" rel="noreferrer">
            Chamar no WhatsApp <span>↗</span>
          </a>
        </div>

        <div className={styles.contactGrid}>
          <div>
            <span>Telefone</span>
            <a href="tel:+557135087781">(71) 3508-7781</a>
            <a href="tel:+5571994000097">(71) 99400-0097</a>
          </div>
          <div>
            <span>Horário</span>
            <p>Segunda a sexta · 08:00–17:00</p>
            <p>Sábado · 08:00–12:00</p>
          </div>
          <div>
            <span>Endereço</span>
            <p>Rua Leonardo R. da Silva, 480 · Galpão 03</p>
            <p>Pitangueiras · Lauro de Freitas · BA · 42701-420</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand />
        <p>Seu carro novo de novo.</p>
        <div><strong>pintservices.com.br</strong><a href="#top">Voltar ao topo ↑</a></div>
      </footer>
    </main>
  );
}
