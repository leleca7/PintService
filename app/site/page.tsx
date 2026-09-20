import type { Metadata } from 'next';
import { getOfficeProfile } from '@/lib/office-profile';
import styles from './site.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Funilaria, pintura e recuperação automotiva',
  description: 'Funilaria, pintura, martelinho de ouro, polimento e recuperação automotiva em Lauro de Freitas, Bahia.',
  openGraph: {
    title: 'Pint Services | Car Center',
    description: 'Precisão, processo e acabamento em recuperação automotiva.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pint Services | Car Center',
    description: 'Precisão, processo e acabamento em recuperação automotiva.',
  },
};

const services = [
  {
    number: '01',
    title: 'Funilaria e pintura',
    text: 'Recuperação de peças e superfícies com preparação cuidadosa, pintura e acabamento orientados ao resultado final.',
    tag: 'Estrutura · superfície · cor',
  },
  {
    number: '02',
    title: 'Martelinho de ouro',
    text: 'Correção precisa de amassados quando o reparo permite preservar a peça e reduzir intervenções desnecessárias.',
    tag: 'Precisão · preservação',
  },
  {
    number: '03',
    title: 'Pintura de rodas',
    text: 'Preparação, correção estética e pintura para renovar o conjunto visual do veículo com acabamento consistente.',
    tag: 'Detalhe · acabamento',
  },
  {
    number: '04',
    title: 'Polimento',
    text: 'Refino da superfície e recuperação de brilho para uma leitura mais uniforme da pintura.',
    tag: 'Refino · brilho',
  },
  {
    number: '05',
    title: 'Higienização',
    text: 'Cuidado interno e externo pensado para completar a experiência de entrega.',
    tag: 'Cuidado · entrega',
  },
  {
    number: '06',
    title: 'Recuperação automotiva',
    text: 'Uma sequência coordenada de desmontagem, reparo, pintura, montagem e acabamento.',
    tag: 'Processo completo',
  },
];

const process = [
  {
    number: '01',
    title: 'Avaliação',
    text: 'Entendimento do dano, escopo do reparo e orientação inicial do atendimento.',
  },
  {
    number: '02',
    title: 'Preparação',
    text: 'Desmontagem, funilaria e preparação de pintura conforme a necessidade do veículo.',
  },
  {
    number: '03',
    title: 'Execução',
    text: 'Pintura, correções e montagem seguindo uma sequência de produção organizada.',
  },
  {
    number: '04',
    title: 'Acabamento',
    text: 'Polimento, revisão visual, limpeza e conferência antes da entrega.',
  },
];

function Brand() {
  return (
    <span className={styles.brand} aria-label="Pint Services Car Center">
      <span className={styles.brandMark} aria-hidden="true">
        <span className={styles.brandCut} />
      </span>
      <span className={styles.brandCopy}>
        <strong>Pint Services</strong>
        <small>car center</small>
      </span>
    </span>
  );
}

function Arrow() {
  return <span aria-hidden="true" className={styles.arrow}>↗</span>;
}

export default function PintServicesSite() {
  const office = getOfficeProfile();
  const phoneDigits = office.publicPhone.replace(/\D/g, '');
  const telHref = `tel:+${phoneDigits}`;
  const whatsappHref = `https://wa.me/${phoneDigits}`;

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: office.name,
    telephone: office.publicPhone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'R. Leonardo Rodrigues da Silva, 480 - Vilas do Atlântico',
      addressLocality: 'Lauro de Freitas',
      addressRegion: 'BA',
      postalCode: '42700-000',
      addressCountry: 'BR',
    },
    sameAs: [office.instagramUrl],
  };

  return (
    <main id="top" className={styles.site}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <header className={styles.header}>
        <a href="#top" className={styles.brandLink} aria-label="Pint Services — início">
          <Brand />
        </a>

        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#processo">Processo</a>
          <a href="#sobre">A Pint</a>
          <a href="#contato">Contato</a>
        </nav>

        <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.headerCta}>
          Solicitar avaliação <Arrow />
        </a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER · LAURO DE FREITAS</p>
          <h1>
            O reparo termina.
            <span>O padrão fica.</span>
          </h1>
          <p className={styles.heroText}>
            Funilaria, pintura e recuperação automotiva conduzidas como um processo:
            diagnóstico, preparação, execução, acabamento e conferência.
          </p>
          <div className={styles.heroActions}>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.primary}>
              Falar com a equipe <Arrow />
            </a>
            <a href="#processo" className={styles.secondary}>
              Ver como trabalhamos
            </a>
          </div>
          <div className={styles.heroFootnote}>
            <span>Seguradoras</span>
            <span>Particulares</span>
            <span>Recuperação completa</span>
          </div>
        </div>

        <div className={styles.heroStage} aria-hidden="true">
          <div className={styles.stageNoise} />
          <div className={styles.stageGlow} />
          <div className={styles.paintBooth}>
            <span className={styles.boothTop} />
            <span className={styles.boothLeft} />
            <span className={styles.boothRight} />
            <span className={styles.boothFloor} />
          </div>
          <div className={styles.car}>
            <span className={styles.carCabin} />
            <span className={styles.carShoulder} />
            <span className={styles.carLower} />
            <span className={styles.wheelOne} />
            <span className={styles.wheelTwo} />
            <span className={styles.carHighlight} />
          </div>
          <div className={styles.stageIndex}>
            <strong>01</strong>
            <span>PRECISÃO EM CADA CAMADA</span>
          </div>
          <div className={styles.stageWord}>PINT</div>
        </div>
      </section>

      <section className={styles.signalBar} aria-label="Diferenciais">
        <div>
          <span className={styles.signalLabel}>ESPECIALIDADE</span>
          <strong>Funilaria &amp; pintura</strong>
        </div>
        <div>
          <span className={styles.signalLabel}>FLUXO</span>
          <strong>Processo por etapas</strong>
        </div>
        <div>
          <span className={styles.signalLabel}>ATENDIMENTO</span>
          <strong>Seguradoras &amp; particulares</strong>
        </div>
        <div>
          <span className={styles.signalLabel}>BASE</span>
          <strong>Lauro de Freitas · BA</strong>
        </div>
      </section>

      <section id="servicos" className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>SERVIÇOS</p>
            <h2>Do dano aparente ao acabamento que devolve presença ao carro.</h2>
          </div>
          <div className={styles.sectionIntro}>
            <p>
              Cada serviço entra no processo certo. Nada de tratar pintura, montagem e acabamento como etapas isoladas.
            </p>
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              Conversar sobre meu veículo <Arrow />
            </a>
          </div>
        </div>

        <div className={styles.servicesGrid}>
          {services.map((service) => (
            <article key={service.number} className={styles.serviceCard}>
              <div className={styles.serviceTop}>
                <span className={styles.serviceNumber}>{service.number}</span>
                <span className={styles.serviceTag}>{service.tag}</span>
              </div>
              <div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
              <span className={styles.cardArrow} aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.manifesto}>
        <div className={styles.manifestoGrid} aria-hidden="true" />
        <div className={styles.manifestoIndex}>PINT / 02</div>
        <div className={styles.manifestoCopy}>
          <p className={styles.eyebrow}>NOSSO PADRÃO</p>
          <h2>Resultado de oficina não acontece no improviso.</h2>
          <p>
            Ele nasce quando cada etapa é executada no momento certo, com leitura clara do que o veículo precisa e atenção ao que será percebido na entrega.
          </p>
        </div>
        <div className={styles.manifestoLayers} aria-hidden="true">
          <span>PREPARAÇÃO</span>
          <span>PINTURA</span>
          <span>ACABAMENTO</span>
        </div>
      </section>

      <section id="processo" className={styles.processSection}>
        <div className={styles.processSticky}>
          <p className={styles.eyebrow}>PROCESSO</p>
          <h2>Quatro movimentos. Um resultado coerente.</h2>
          <p>
            O veículo avança por uma sequência definida. Isso organiza a produção e concentra a equipe no próximo passo necessário.
          </p>
          <div className={styles.processMeter}>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className={styles.processList}>
          {process.map((item) => (
            <article key={item.number} className={styles.processItem}>
              <div className={styles.processNumber}>{item.number}</div>
              <div className={styles.processBody}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <span className={styles.processDot} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section id="sobre" className={styles.aboutSection}>
        <div className={styles.aboutVisual} aria-hidden="true">
          <div className={styles.aboutFrame}>
            <span className={styles.aboutScan} />
            <span className={styles.aboutAxis} />
            <span className={styles.aboutBadge}>CAR CENTER · BA</span>
          </div>
        </div>
        <div className={styles.aboutContent}>
          <p className={styles.eyebrow}>A PINT SERVICES</p>
          <h2>Mais do que reparar uma peça. Cuidar da leitura do carro inteiro.</h2>
          <p>
            A Pint Services atua em recuperação automotiva para clientes particulares e operações com seguradoras.
            O foco é combinar técnica, organização e acabamento em um processo claro do início à entrega.
          </p>
          <div className={styles.aboutFacts}>
            <div>
              <span>01</span>
              <strong>Processo organizado</strong>
              <small>Cada fase tem uma função dentro do resultado.</small>
            </div>
            <div>
              <span>02</span>
              <strong>Acabamento como etapa</strong>
              <small>O serviço não termina quando a pintura seca.</small>
            </div>
            <div>
              <span>03</span>
              <strong>Atendimento direto</strong>
              <small>Avaliação e orientação com a equipe da oficina.</small>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div className={styles.contactCopy}>
          <p className={styles.eyebrow}>ATENDIMENTO</p>
          <h2>Conte o que aconteceu com o seu carro.</h2>
          <p>
            A equipe orienta o próximo passo, seja para avaliação, reparo particular ou atendimento relacionado a seguradora.
          </p>
        </div>

        <div className={styles.contactPanel}>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.contactPrimary}>
            <span>
              <small>WHATSAPP</small>
              <strong>Falar com a Pint Services</strong>
            </span>
            <Arrow />
          </a>
          <a href={telHref} className={styles.contactRow}>
            <span>Telefone</span>
            <strong>{office.publicPhone}</strong>
          </a>
          <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer" className={styles.contactRow}>
            <span>Localização</span>
            <strong>Vilas do Atlântico · Lauro de Freitas</strong>
          </a>
          <a href={office.instagramUrl} target="_blank" rel="noreferrer" className={styles.contactRow}>
            <span>Instagram</span>
            <strong>{office.instagramHandle}</strong>
          </a>
          <div className={styles.contactRow}>
            <span>Horários</span>
            <strong>{office.hours}</strong>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Brand />
          <p>Funilaria, pintura e recuperação automotiva em Lauro de Freitas, Bahia.</p>
        </div>
        <div className={styles.footerNav}>
          <a href="#servicos">Serviços</a>
          <a href="#processo">Processo</a>
          <a href="#sobre">A Pint</a>
          <a href="#contato">Contato</a>
        </div>
        <div className={styles.footerEnd}>
          <span>© {new Date().getFullYear()} Pint Services</span>
          <a href="#top">Voltar ao topo ↑</a>
        </div>
      </footer>
    </main>
  );
}
