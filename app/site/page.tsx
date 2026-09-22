import type { Metadata } from 'next';
import Image from 'next/image';
import { getOfficeProfile } from '@/lib/office-profile';
import SiteAssistant from './site-assistant';
import SiteMotion from './site-motion';
import styles from './site.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Funilaria e pintura automotiva',
  description: 'Funilaria, pintura, martelinho de ouro, polimento e recuperação automotiva em Lauro de Freitas, Bahia.',
  openGraph: {
    title: 'Pint Services | Car Center',
    description: 'Funilaria, pintura e recuperação automotiva em Lauro de Freitas.',
    type: 'website',
    locale: 'pt_BR',
  },
};

const imagery = {
  hero: 'https://images.pexels.com/photos/33814680/pexels-photo-33814680.jpeg?auto=compress&cs=tinysrgb&w=2200',
  paint: 'https://images.pexels.com/photos/30250199/pexels-photo-30250199.jpeg?auto=compress&cs=tinysrgb&w=1800',
  workshop: 'https://images.pexels.com/photos/10162530/pexels-photo-10162530.jpeg?auto=compress&cs=tinysrgb&w=1800',
};

const services = [
  {
    number: '01',
    title: 'Funilaria & pintura',
    text: 'Recuperação de avarias, preparação e pintura para devolver forma, cor e acabamento ao veículo.',
    image: imagery.hero,
  },
  {
    number: '02',
    title: 'Martelinho de ouro',
    text: 'Correção de amassados quando a técnica é indicada, preservando a pintura original sempre que possível.',
    image: imagery.paint,
  },
  {
    number: '03',
    title: 'Polimento & acabamento',
    text: 'Refino da superfície, revisão visual e acabamento final para valorizar o resultado do reparo.',
    image: imagery.workshop,
  },
];

const process = [
  { number: '01', title: 'Avaliação', text: 'Entendemos o dano e orientamos o melhor caminho para o atendimento.' },
  { number: '02', title: 'Reparação', text: 'Funilaria, preparação e desmontagem conforme a necessidade real do veículo.' },
  { number: '03', title: 'Pintura & acabamento', text: 'Pintura, montagem, polimento e ajustes finais entram na mesma jornada.' },
  { number: '04', title: 'Conferência & entrega', text: 'O veículo passa por revisão final antes da liberação ao cliente.' },
];

function Brand() {
  return (
    <span className={styles.brand} aria-label="Pint Services Car Center">
      <span className={styles.brandMark} aria-hidden="true"><span/></span>
      <span className={styles.brandCopy}><strong>Pint Services</strong><small>car center</small></span>
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
      <SiteMotion/>
      <SiteAssistant phone={office.publicPhone}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}/>

      <header className={styles.header}>
        <a href="#top" className={styles.brandLink}><Brand/></a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#processo">Processo</a>
          <a href="#sobre">A Pint</a>
          <a href="#contato">Contato</a>
        </nav>
        <a href="#assistente-pint" data-assistant-open className={styles.headerCta}>
          Avaliar veículo <Arrow/>
        </a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image
            className={styles.heroImage}
            src={imagery.hero}
            alt="Veículo em ambiente automotivo"
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroShade}/>
        </div>

        <div className={styles.heroContent} data-reveal>
          <p className={styles.eyebrow}>PINT SERVICES · LAURO DE FREITAS</p>
          <h1>REDEFINA<br/><span>O REPARO.</span></h1>
          <p className={styles.heroText}>
            Funilaria e pintura automotiva para clientes particulares e atendimentos relacionados a seguradoras.
          </p>
          <div className={styles.heroActions}>
            <a href="#assistente-pint" data-assistant-open className={styles.primary}>Avaliar meu veículo <Arrow/></a>
            <a href="#servicos" className={styles.secondary}>Conhecer serviços</a>
          </div>
        </div>

        <div className={styles.heroIndex} aria-hidden="true">
          <span>01</span>
          <i/>
          <small>PINT SERVICES</small>
        </div>
      </section>

      <section className={styles.quickProof}>
        <div><span>ESPECIALIDADE</span><strong>Funilaria & pintura</strong></div>
        <div><span>ATENDIMENTO</span><strong>Particular & seguradoras</strong></div>
        <div><span>LOCALIZAÇÃO</span><strong>Lauro de Freitas · BA</strong></div>
        <div><span>JORNADA</span><strong>Da avaliação à entrega</strong></div>
      </section>

      <section id="servicos" className={styles.servicesSection}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrowDark}>SERVIÇOS</p>
          <h2>O QUE A PINT<br/><span>RESOLVE.</span></h2>
          <p>Três frentes principais. Sem transformar cada etapa da oficina em um serviço diferente.</p>
        </div>

        <div className={styles.serviceGrid}>
          {services.map((service) => (
            <article key={service.number} className={styles.serviceCard} data-reveal>
              <div className={styles.serviceImage}>
                <Image src={service.image} alt={service.title} fill sizes="(max-width: 760px) 100vw, 33vw"/>
              </div>
              <div className={styles.serviceCopy}>
                <span>{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="processo" className={styles.performanceSection}>
        <div className={styles.performanceVisual} data-reveal>
          <Image src={imagery.paint} alt="Processo de pintura automotiva" fill sizes="(max-width: 980px) 100vw, 52vw"/>
          <div className={styles.performanceShade}/>
          <span className={styles.performanceTag}>PINTURA · ACABAMENTO · PRECISÃO</span>
        </div>

        <div className={styles.performanceCopy} data-reveal>
          <p className={styles.eyebrow}>PADRÃO PINT</p>
          <h2>RESULTADO NÃO<br/><span>ACONTECE NO IMPROVISO.</span></h2>
          <p>
            Organização de processo, leitura correta do reparo e atenção ao acabamento trabalham juntas.
            O cliente vê simplicidade; a oficina mantém controle.
          </p>
          <a href="#assistente-pint" data-assistant-open className={styles.darkCta}>Começar avaliação <Arrow/></a>
        </div>
      </section>

      <section className={styles.processSection}>
        <div className={styles.processIntro} data-reveal>
          <p className={styles.eyebrowDark}>COMO FUNCIONA</p>
          <h2>UM CAMINHO.<br/>QUATRO ETAPAS.</h2>
        </div>

        <div className={styles.processGrid}>
          {process.map((item) => (
            <article key={item.number} className={styles.processItem} data-process-step data-reveal>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.resultSection}>
        <div className={styles.resultCopy} data-reveal>
          <p className={styles.eyebrowDark}>DETALHE IMPORTA</p>
          <h2>O REPARO TERMINA<br/><span>NO ACABAMENTO.</span></h2>
          <p>
            A percepção de qualidade está nos detalhes: alinhamento, superfície, brilho, montagem e conferência final.
          </p>
          <a href="#assistente-pint" data-assistant-open className={styles.lightCta}>Avaliar meu veículo <Arrow/></a>
        </div>

        <div className={styles.resultVisual} data-reveal>
          <Image src={imagery.workshop} alt="Ambiente de oficina automotiva" fill sizes="(max-width: 980px) 100vw, 54vw"/>
          <span>PINT SERVICES · CAR CENTER</span>
        </div>
      </section>

      <section id="sobre" className={styles.aboutSection}>
        <div className={styles.aboutVisual} data-reveal>
          <Image src={imagery.hero} alt="Veículo em destaque" fill sizes="(max-width: 980px) 100vw, 48vw"/>
        </div>

        <div className={styles.aboutCopy} data-reveal>
          <p className={styles.eyebrowDark}>A PINT SERVICES</p>
          <h2>TÉCNICA NA OFICINA.<br/><span>CLAREZA NO ATENDIMENTO.</span></h2>
          <p>
            A Pint Services atua em recuperação automotiva em Lauro de Freitas com uma proposta simples:
            organizar o reparo, orientar o cliente e acompanhar o veículo até a entrega.
          </p>
          <div className={styles.aboutFacts}>
            <div><span>01</span><strong>Processo organizado</strong></div>
            <div><span>02</span><strong>Atendimento direto</strong></div>
            <div><span>03</span><strong>Conferência final</strong></div>
          </div>
        </div>
      </section>

      <section className={styles.locationSection}>
        <div className={styles.locationCopy} data-reveal>
          <p className={styles.eyebrow}>ONDE ESTAMOS</p>
          <h2>VILAS DO ATLÂNTICO.<br/><span>LAURO DE FREITAS.</span></h2>
          <p>{office.address}</p>
          <div className={styles.locationMeta}>
            <div><span>TELEFONE</span><strong>{office.publicPhone}</strong></div>
            <div><span>HORÁRIOS</span><strong>{office.hours}</strong></div>
          </div>
          <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer" className={styles.locationCta}>
            Abrir rota <Arrow/>
          </a>
        </div>

        <div className={styles.mapShell} data-reveal>
          <iframe
            title="Mapa da Pint Services em Vilas do Atlântico"
            src="https://www.google.com/maps?q=R.%20Leonardo%20Rodrigues%20da%20Silva%2C%20480%20-%20Vilas%20do%20Atl%C3%A2ntico%2C%20Lauro%20de%20Freitas%20-%20BA&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={styles.mapFrame}
          />
          <div className={styles.mapOverlay}/>
        </div>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div data-reveal>
          <p className={styles.eyebrowDark}>PRÓXIMO PASSO</p>
          <h2>CONTE O QUE<br/>ACONTECEU.</h2>
        </div>
        <div className={styles.contactCopy} data-reveal>
          <p>
            O Assistente Pint organiza o contexto antes de abrir o WhatsApp. A equipe recebe a conversa já com o motivo do contato.
          </p>
          <a href="#assistente-pint" data-assistant-open className={styles.contactPrimary}>Iniciar avaliação <Arrow/></a>
          <div className={styles.contactMeta}>
            <a href={telHref}>{office.publicPhone}</a>
            <a href={office.instagramUrl} target="_blank" rel="noreferrer">{office.instagramHandle}</a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand/>
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
