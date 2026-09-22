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
  hero: 'https://images.pexels.com/photos/33814680/pexels-photo-33814680.jpeg?auto=compress&cs=tinysrgb&w=2000',
  paint: 'https://images.pexels.com/photos/30250199/pexels-photo-30250199.jpeg?auto=compress&cs=tinysrgb&w=1800',
  workshop: 'https://images.pexels.com/photos/10162530/pexels-photo-10162530.jpeg?auto=compress&cs=tinysrgb&w=1800',
};

const services = [
  {
    number: '01',
    title: 'Funilaria & pintura',
    text: 'Recuperação de avarias na lataria, preparação e pintura para devolver forma, cor e acabamento ao veículo.',
    image: imagery.hero,
    label: 'Reparação automotiva',
  },
  {
    number: '02',
    title: 'Martelinho de ouro',
    text: 'Correção de amassados quando a técnica é indicada, preservando a pintura original sempre que possível.',
    image: imagery.paint,
    label: 'Correção de amassados',
  },
  {
    number: '03',
    title: 'Polimento & acabamento',
    text: 'Refino da superfície, revisão visual e acabamento final para valorizar o resultado do reparo.',
    image: imagery.workshop,
    label: 'Refino e entrega',
  },
];

const process = [
  {
    number: '01',
    title: 'Avaliação',
    text: 'Entendemos o dano e orientamos o caminho adequado para atendimento particular ou por seguradora.',
  },
  {
    number: '02',
    title: 'Reparação',
    text: 'Desmontagem, funilaria e preparação acontecem conforme a necessidade real do veículo.',
  },
  {
    number: '03',
    title: 'Pintura & acabamento',
    text: 'A execução segue para pintura, montagem, polimento e os ajustes finais do serviço.',
  },
  {
    number: '04',
    title: 'Conferência & entrega',
    text: 'O veículo passa pela revisão final antes de ser liberado para o cliente.',
  },
];

function Brand() {
  return (
    <span className={styles.brand} aria-label="Pint Services Car Center">
      <span className={styles.brandMark} aria-hidden="true"><span className={styles.brandCut}/></span>
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
        <a href="#top" className={styles.brandLink} aria-label="Pint Services — início"><Brand/></a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#processo">Como funciona</a>
          <a href="#sobre">A Pint</a>
          <a href="#contato">Contato</a>
        </nav>
        <a href="#assistente-pint" data-assistant-open className={styles.headerCta}>
          Avaliar meu veículo <Arrow/>
        </a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true"/>
        <div className={styles.heroCopy} data-reveal>
          <p className={styles.eyebrow}>PINT SERVICES · LAURO DE FREITAS</p>
          <div className={styles.heroTitle}>
            <span>FUNILARIA.</span>
            <span>PINTURA.</span>
          </div>
          <p className={styles.heroText}>
            Recuperação automotiva para clientes particulares e atendimento relacionado a seguradoras,
            com uma jornada clara da avaliação à entrega.
          </p>
          <div className={styles.heroActions}>
            <a href="#assistente-pint" data-assistant-open className={styles.primary}>
              Avaliar meu veículo <Arrow/>
            </a>
            <a href="#servicos" className={styles.secondary}>Conhecer os serviços</a>
          </div>
        </div>

        <div className={styles.heroVisual} data-reveal>
          <div className={styles.heroImageWrap}>
            <Image
              className={styles.heroImage}
              src={imagery.hero}
              alt="Veículo em ambiente profissional de recuperação automotiva"
              fill
              priority
              sizes="(max-width: 980px) 100vw, 62vw"
            />
          </div>
          <div className={styles.heroPhotoShade} aria-hidden="true"/>
          <div className={styles.heroCaption}>
            <span>PINT SERVICES</span>
            <strong>Funilaria · pintura · acabamento</strong>
          </div>
        </div>

        <div className={styles.heroFacts} data-reveal>
          <div><small>01</small><span>ESPECIALIDADE</span><strong>Funilaria & pintura</strong></div>
          <div><small>02</small><span>ATENDIMENTO</span><strong>Particular & seguradoras</strong></div>
          <div><small>03</small><span>LOCALIZAÇÃO</span><strong>Lauro de Freitas · BA</strong></div>
        </div>
      </section>

      <section id="servicos" className={styles.servicesSection}>
        <div className={styles.sectionIntroGrid} data-reveal>
          <div>
            <p className={styles.eyebrow}>SERVIÇOS</p>
            <h2>O que a Pint <span>resolve.</span></h2>
          </div>
          <div className={styles.introCopy}>
            <p>
              Serviços apresentados pelo que o cliente procura — sem transformar cada etapa interna da oficina em uma oferta diferente.
            </p>
            <a href="#assistente-pint" data-assistant-open>Quero avaliar meu veículo <Arrow/></a>
          </div>
        </div>

        <div className={styles.featuredGrid}>
          {services.map((service) => (
            <article key={service.number} className={styles.featuredCard} data-reveal>
              <div className={styles.cardMedia}>
                <Image src={service.image} alt={service.title} fill sizes="(max-width: 980px) 100vw, 33vw" className={styles.cardImage}/>
                <div className={styles.cardShade}/>
              </div>
              <div className={styles.cardIndex}>{service.number}</div>
              <div className={styles.cardCopy}>
                <span>{service.label}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="processo" className={styles.processSection}>
        <div className={styles.processBackdrop} aria-hidden="true">PROCESSO</div>
        <div className={styles.processSticky} data-reveal>
          <p className={styles.eyebrow}>COMO FUNCIONA</p>
          <h2>Um caminho claro do problema à entrega.</h2>
          <p>
            O processo aparece aqui uma única vez: simples para o cliente e coerente com a operação da oficina.
          </p>
          <div className={styles.processMeter}>
            {process.map((item) => <span key={item.number}>{item.number}</span>)}
          </div>
        </div>

        <div className={styles.processList}>
          {process.map((item) => (
            <article key={item.number} className={styles.processItem} data-process-step data-reveal>
              <div className={styles.processNumber}>{item.number}</div>
              <div className={styles.processBody}>
                <small>ETAPA {item.number}</small>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <span className={styles.processLine} aria-hidden="true"/>
            </article>
          ))}
        </div>
      </section>

      <section id="sobre" className={styles.aboutSection}>
        <div className={styles.aboutVisual} data-reveal>
          <div className={styles.aboutFrame}>
            <Image
              className={styles.aboutImage}
              src={imagery.workshop}
              alt="Ambiente de oficina automotiva"
              fill
              sizes="(max-width: 980px) 100vw, 48vw"
            />
            <div className={styles.aboutPhotoShade}/>
            <span className={styles.aboutOutline}>PINT</span>
            <span className={styles.aboutBadge}>CAR CENTER · BA</span>
          </div>
        </div>

        <div className={styles.aboutContent} data-reveal>
          <p className={styles.eyebrow}>A PINT SERVICES</p>
          <h2>Técnica na oficina. <span>Clareza no atendimento.</span></h2>
          <p>
            A Pint Services atua em recuperação automotiva em Lauro de Freitas.
            A proposta é simples: organizar o reparo, manter o cliente orientado e cuidar do acabamento até a entrega.
          </p>
          <div className={styles.aboutFacts}>
            <div><span>01</span><strong>Processo organizado</strong><small>O veículo avança por etapas definidas.</small></div>
            <div><span>02</span><strong>Atendimento direto</strong><small>Particular ou seguradora, cada caso começa pela orientação correta.</small></div>
            <div><span>03</span><strong>Conferência final</strong><small>A entrega faz parte do serviço, não é apenas o fim da produção.</small></div>
          </div>
        </div>
      </section>

      <section className={styles.locationSection}>
        <div className={styles.locationCopy} data-reveal>
          <p className={styles.eyebrow}>ONDE ESTAMOS</p>
          <h2>Vilas do Atlântico.<br/><span>Lauro de Freitas.</span></h2>
          <p>{office.address}</p>
          <div className={styles.locationMeta}>
            <div><small>TELEFONE</small><strong>{office.publicPhone}</strong></div>
            <div><small>HORÁRIOS</small><strong>{office.hours}</strong></div>
          </div>
          <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer" className={styles.locationCta}>
            Abrir rota no Google Maps <Arrow/>
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
          <div className={styles.mapOverlay} aria-hidden="true"/>
          <div className={styles.mapPinCard}>
            <span>PINT SERVICES</span>
            <strong>CAR CENTER</strong>
            <small>Vilas do Atlântico · BA</small>
          </div>
        </div>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div className={styles.contactCopy} data-reveal>
          <p className={styles.eyebrow}>PRÓXIMO PASSO</p>
          <h2>Conte o que aconteceu com o seu carro.</h2>
          <p>
            O Assistente Pint organiza três informações antes de abrir o WhatsApp.
            Assim a equipe já recebe o contexto e começa a conversa do ponto certo.
          </p>
        </div>

        <div className={styles.contactPanel} data-reveal>
          <a href="#assistente-pint" data-assistant-open className={styles.contactPrimary}>
            <span><small>ASSISTENTE PINT</small><strong>Iniciar avaliação</strong></span>
            <Arrow/>
          </a>
          <a href={telHref} className={styles.contactRow}><span>Telefone</span><strong>{office.publicPhone}</strong></a>
          <a href={office.instagramUrl} target="_blank" rel="noreferrer" className={styles.contactRow}><span>Instagram</span><strong>{office.instagramHandle}</strong></a>
          <div className={styles.contactRow}><span>Horários</span><strong>{office.hours}</strong></div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Brand/>
          <p>Funilaria, pintura e recuperação automotiva em Lauro de Freitas, Bahia.</p>
        </div>
        <div className={styles.footerNav}>
          <a href="#servicos">Serviços</a>
          <a href="#processo">Como funciona</a>
          <a href="#sobre">A Pint</a>
          <a href="#contato">Contato</a>
        </div>
        <div className={styles.footerEnd}>
          <span>© {new Date().getFullYear()} Pint Services</span>
          <span className={styles.photoCredit}>Fotografias ilustrativas · Pexels</span>
          <a href="#top">Voltar ao topo ↑</a>
        </div>
      </footer>
    </main>
  );
}
