import type { Metadata } from 'next';
import styles from './site.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Car Center',
  description: 'Funilaria, pintura e recuperação automotiva em Lauro de Freitas, Bahia.',
};

const services = [
  {
    number: '01',
    title: 'Funilaria e pintura',
    text: 'Recuperação de peças e superfícies com preparação cuidadosa, pintura e acabamento orientados ao resultado final.',
  },
  {
    number: '02',
    title: 'Martelinho de ouro',
    text: 'Correção de amassados com abordagem precisa para preservar ao máximo a originalidade da peça quando o reparo permite.',
  },
  {
    number: '03',
    title: 'Pintura de rodas',
    text: 'Renovação visual das rodas com preparação, correção estética e acabamento consistente com o conjunto do veículo.',
  },
  {
    number: '04',
    title: 'Polimento',
    text: 'Refino do acabamento e recuperação do brilho para valorizar a pintura e entregar uma leitura visual mais uniforme.',
  },
  {
    number: '05',
    title: 'Higienização',
    text: 'Cuidado interno e externo pensado para completar a experiência de entrega do veículo.',
  },
  {
    number: '06',
    title: 'Recuperação automotiva',
    text: 'Uma sequência organizada de reparo, pintura, montagem e acabamento para devolver o carro com atenção a cada etapa.',
  },
];

const process = [
  ['01', 'Avaliação', 'Entendimento do dano, escopo do reparo e orientação inicial do atendimento.'],
  ['02', 'Preparação', 'Desmontagem, funilaria e preparação de pintura conforme a necessidade do veículo.'],
  ['03', 'Execução', 'Pintura, correções e montagem seguindo uma sequência de produção organizada.'],
  ['04', 'Acabamento', 'Polimento, revisão visual e finalização antes da entrega.'],
];

function Brand() {
  return (
    <div className={styles.brand} aria-label="Pint Services Car Center">
      <span className={styles.brandMark} aria-hidden="true">
        <span />
      </span>
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
        <a href="#top" className={styles.brandLink} aria-label="Ir para o início">
          <Brand />
        </a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#processo">Processo</a>
          <a href="#sobre">Sobre</a>
          <a href="#contato" className={styles.navCta}>Fale com a Pint</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER</p>
          <h1>Precisão que devolve forma, acabamento e confiança.</h1>
          <p className={styles.heroText}>
            Funilaria, pintura e recuperação automotiva com uma rotina organizada,
            cuidado técnico e atenção ao acabamento em cada etapa do processo.
          </p>
          <div className={styles.heroActions}>
            <a href="#servicos" className={styles.primary}>Conheça os serviços</a>
            <a href="#processo" className={styles.secondary}>Como trabalhamos</a>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.heroGrid} />
          <div className={styles.carSilhouette}>
            <span className={styles.carRoof} />
            <span className={styles.carBody} />
            <span className={styles.wheelLeft} />
            <span className={styles.wheelRight} />
          </div>
          <div className={styles.visualLabel}>RECUPERAÇÃO · PINTURA · ACABAMENTO</div>
        </div>
      </section>

      <section className={styles.introStrip} aria-label="Diferenciais">
        <div>
          <span>Especialidade</span>
          <strong>Funilaria &amp; pintura</strong>
        </div>
        <div>
          <span>Atendimento</span>
          <strong>Seguradoras &amp; particulares</strong>
        </div>
        <div>
          <span>Localização</span>
          <strong>Lauro de Freitas · BA</strong>
        </div>
      </section>

      <section id="servicos" className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>SERVIÇOS</p>
            <h2>Cuidado completo do reparo ao acabamento.</h2>
          </div>
          <p className={styles.sectionLead}>
            Uma apresentação clara do que a Pint Services já comunica publicamente e do que faz parte da sua rotina de recuperação automotiva.
          </p>
        </div>

        <div className={styles.servicesGrid}>
          {services.map((service) => (
            <article key={service.number} className={styles.serviceCard}>
              <span className={styles.serviceNumber}>{service.number}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <span className={styles.serviceLine} />
            </article>
          ))}
        </div>
      </section>

      <section id="processo" className={styles.processSection}>
        <div className={styles.processIntro}>
          <p className={styles.eyebrow}>PROCESSO</p>
          <h2>O resultado final começa em uma sequência bem executada.</h2>
          <p>
            O veículo avança por etapas definidas. Isso melhora a leitura do serviço,
            organiza a produção e mantém o foco no que precisa acontecer até a entrega.
          </p>
        </div>
        <div className={styles.processList}>
          {process.map(([number, title, text]) => (
            <article key={number} className={styles.processItem}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="sobre" className={styles.aboutSection}>
        <div className={styles.aboutStatement}>
          <p className={styles.eyebrow}>PINT SERVICES</p>
          <h2>Não é só reparar. É cuidar da experiência do carro até a entrega.</h2>
        </div>
        <div className={styles.aboutCopy}>
          <p>
            A proposta visual desta página acompanha a própria marca: preto e grafite como base,
            branco para leitura e o dourado da Pint Services como destaque. A mesma lógica orienta
            a apresentação do serviço — menos ruído, mais clareza, técnica e percepção de cuidado.
          </p>
          <p>
            A versão definitiva pode receber fotos reais da estrutura, antes e depois, equipe,
            avaliações, seguradoras parceiras e integração direta com WhatsApp e Maps.
          </p>
        </div>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div>
          <p className={styles.eyebrow}>ATENDIMENTO</p>
          <h2>Seu carro merece um processo à altura do resultado.</h2>
        </div>
        <div className={styles.contactSide}>
          <p>Atendimento em Lauro de Freitas, Bahia.</p>
          <a href="#servicos" className={styles.primary}>Solicitar uma avaliação</a>
          <small>Na publicação final, este CTA será conectado ao WhatsApp oficial da Pint Services.</small>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand />
        <div>
          <strong>pintservices.com.br</strong>
          <span>Lauro de Freitas · Bahia</span>
        </div>
        <a href="#top">Voltar ao início ↑</a>
      </footer>
    </main>
  );
}
