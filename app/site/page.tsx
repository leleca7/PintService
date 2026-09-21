import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { getOfficeProfile } from '@/lib/office-profile';
import SiteMotion from './site-motion';
import SiteAssistant from './site-assistant';
import styles from './site.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Funilaria, pintura e recuperação automotiva',
  description: 'Funilaria, pintura, acabamento, polimento e recuperação automotiva em Lauro de Freitas, Bahia.',
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

const imagery = {
  hero: 'https://images.pexels.com/photos/33814680/pexels-photo-33814680.jpeg?auto=compress&cs=tinysrgb&w=2000',
  paint: 'https://images.pexels.com/photos/30250199/pexels-photo-30250199.jpeg?auto=compress&cs=tinysrgb&w=1800',
  workshop: 'https://images.pexels.com/photos/10162530/pexels-photo-10162530.jpeg?auto=compress&cs=tinysrgb&w=1800',
};

const featuredServices = [
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
    label: 'Refino · brilho · entrega',
  },
];

const insuranceFlow = [
  {
    number: '01',
    title: 'Contato inicial',
    text: 'Informe o dano e a seguradora. A equipe confirma o atendimento e orienta o próximo passo.',
  },
  {
    number: '02',
    title: 'Vistoria e autorização',
    text: 'Quando o reparo envolve seguro, vistoria e autorização seguem as regras da seguradora responsável.',
  },
  {
    number: '03',
    title: 'Reparo',
    text: 'Após a liberação necessária, o veículo entra no fluxo de preparação, execução e acabamento.',
  },
  {
    number: '04',
    title: 'Entrega',
    text: 'A equipe conclui o acabamento, faz a conferência final e combina a entrega com o cliente.',
  },
];

const process = [
  {
    number: '01',
    title: 'Avaliação',
    text: 'Entendimento da avaria, definição do escopo e orientação inicial do atendimento.',
  },
  {
    number: '02',
    title: 'Preparação',
    text: 'Desmontagem, correção da lataria e preparação da superfície conforme a necessidade do veículo.',
  },
  {
    number: '03',
    title: 'Reparo',
    text: 'Execução da funilaria, pintura e demais intervenções previstas para o serviço.',
  },
  {
    number: '04',
    title: 'Acabamento',
    text: 'Montagem, polimento, revisão visual e conferência do resultado.',
  },
  {
    number: '05',
    title: 'Entrega',
    text: 'Conferência final e alinhamento da entrega com o cliente.',
  },
];

function Brand() {
  return (
    <span className={styles.brand} aria-label="Pint Services Car Center">
      <img
        src="/api/site/logo"
        alt="Pint Services Car Center"
        className={styles.brandImage}
      />
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: office.googleRating,
      reviewCount: office.googleReviewCount,
      bestRating: 5,
    },
  };

  return (
    <main id="top" className={styles.site}>
      <SiteMotion />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <div className={styles.progressRail} aria-hidden="true"><span /></div>

      <header className={styles.header}>
        <a href="#top" className={styles.brandLink} aria-label="Pint Services — início">
          <Brand />
        </a>

        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#processo">Como funciona</a>
          <a href="#seguro">Seguro</a>
          <a href="#sobre">A Pint</a>
          <a href="#localizacao">Localização</a>
        </nav>

        <a href="#contato" className={styles.headerCta}>
          Atendimento <Arrow />
        </a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroBeam} aria-hidden="true" />
        <div className={styles.heroGhost} aria-hidden="true">PINT</div>

        <div className={styles.heroCopy} data-reveal>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER · LAURO DE FREITAS</p>
          <div className={styles.heroTitle}>
            <span>BATEU OU</span>
            <span>RISCOU?</span>
          </div>
          <p className={styles.heroText}>
            Funilaria, pintura e recuperação automotiva com um processo claro,
            do primeiro diagnóstico ao acabamento final.
          </p>
          <div className={styles.heroActions}>
            <a href="#servicos" className={styles.primary}>
              Conhecer os serviços <Arrow />
            </a>
            <a href="#processo" className={styles.secondary}>
              Como funciona
            </a>
          </div>
        </div>

        <div className={styles.heroVisual} data-reveal>
          <div className={styles.heroImageWrap}>
            <Image
              className={styles.heroImage}
              src={imagery.hero}
              alt="Carro em ambiente profissional de pintura automotiva"
              fill
              priority
              sizes="(max-width: 980px) 100vw, 62vw"
            />
          </div>
          <div className={styles.heroCaption}>
            <span>RECUPERAÇÃO AUTOMOTIVA</span>
            <strong>Funilaria · pintura · acabamento</strong>
          </div>
        </div>

        <div className={styles.heroFacts} data-reveal>
          <div><small>01</small><span>ESPECIALIDADE</span><strong>Funilaria &amp; pintura</strong></div>
          <div><small>02</small><span>FLUXO</span><strong>Processo por etapas</strong></div>
          <div><small>03</small><span>ATENDIMENTO</span><strong>Seguradoras &amp; particulares</strong></div>
        </div>
      </section>

      <section id="servicos" className={styles.servicesSection}>
        <div className={styles.sectionIntroGrid} data-reveal>
          <div>
            <p className={styles.eyebrow}>SERVIÇOS</p>
            <h2>Soluções para <span>recuperar seu carro.</span></h2>
          </div>
          <div className={styles.introCopy}>
            <p>
              Da correção da lataria ao acabamento final, o serviço é definido de acordo com a avaria
              e com o que o veículo realmente precisa.
            </p>
            <a href="#processo">Entender como funciona <Arrow /></a>
          </div>
        </div>

        <div className={styles.featuredGrid}>
          {featuredServices.map((service, index) => (
            <article
              key={service.number}
              className={styles.featuredCard}
              data-reveal
              style={{ '--delay': `${index * 90}ms` } as CSSProperties}
            >
              <div className={styles.cardMedia}>
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  sizes="(max-width: 980px) 100vw, 33vw"
                  className={styles.cardImage}
                />
                <div className={styles.cardShade} />
              </div>
              <div className={styles.cardIndex}>{service.number}</div>
              <div className={styles.cardCopy}>
                <span>{service.label}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
              <div className={styles.cardArrow}><Arrow /></div>
            </article>
          ))}
        </div>


      </section>

      <section id="processo" className={styles.processSection}>
        <div className={styles.processBackdrop} aria-hidden="true">PROCESSO</div>
        <div className={styles.processSticky} data-reveal>
          <p className={styles.eyebrow}>FLUXO</p>
          <h2>Você sabe o que acontece antes da entrega.</h2>
          <p>
            O reparo avança por etapas: avaliação, preparação, execução, acabamento e entrega.
          </p>
        </div>

        <div className={styles.processList}>
          {process.map((item) => (
            <article key={item.number} className={styles.processItem} data-process-step data-reveal>
              <div className={styles.processNumber}>{item.number}</div>
              <div className={styles.processBody}>
                <small>PINT SERVICES · PROCESSO</small>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <span className={styles.processLine} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>


      <section id="seguro" className={styles.insurerSection}>
        <div className={styles.insurerIntro} data-reveal>
          <p className={styles.eyebrow}>REPARO PELO SEGURO</p>
          <h2>Um fluxo mais claro, <span>do sinistro à entrega.</span></h2>
          <p>
            O processo pode variar conforme a seguradora. Por isso, a equipe confirma o atendimento
            antes de apresentar qualquer companhia como parceira ou atendida.
          </p>
        </div>

        <div className={styles.insuranceFlowGrid}>
          {insuranceFlow.map((step) => (
            <article key={step.number} className={styles.insuranceFlowCard} data-reveal>
              <span>{step.number}</span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </article>
          ))}
          <article className={styles.insuranceFlowCta} data-reveal>
            <small>PRECISA DE ORIENTAÇÃO?</small>
            <strong>Use o Assistente Pint</strong>
            <p>A triagem no canto da tela organiza o contexto antes de abrir o WhatsApp.</p>
          </article>
        </div>
      </section>

      <section id="sobre" className={styles.aboutSection}>
        <div className={styles.aboutVisual} data-reveal>
          <div className={styles.aboutFrame}>
            <Image
              className={styles.aboutImage}
              src={imagery.workshop}
              alt="Carro em oficina automotiva moderna durante serviço"
              fill
              sizes="(max-width: 980px) 100vw, 48vw"
            />
            <div className={styles.aboutPhotoShade} />
            <span className={styles.aboutOutline}>PINT</span>
            <span className={styles.aboutBadge}>CAR CENTER · BA</span>
          </div>
        </div>

        <div className={styles.aboutContent} data-reveal>
          <p className={styles.eyebrow}>A PINT SERVICES</p>
          <h2>Cuidamos do carro todo. <span>Não só da peça danificada.</span></h2>
          <p>
            A Pint Services atua em recuperação automotiva para clientes particulares e operações com seguradoras.
            O foco é combinar técnica, organização e acabamento em um processo claro do início à entrega.
          </p>
          <div className={styles.aboutFacts}>
            <div><span>01</span><strong>Processo organizado</strong><small>Cada fase tem uma função dentro do resultado.</small></div>
            <div><span>02</span><strong>Acabamento como etapa</strong><small>O serviço não termina quando a pintura seca.</small></div>
            <div><span>03</span><strong>Atendimento direto</strong><small>Avaliação e orientação com a equipe da oficina.</small></div>
          </div>
        </div>
      </section>

      <section className={styles.trustSection} aria-label="Sinais de confiança da Pint Services">
        <div className={styles.trustIntro} data-reveal>
          <p className={styles.eyebrow}>POR QUE CONFIAR</p>
          <h2>Confiança começa pelo que <span>você consegue verificar.</span></h2>
          <p>
            Processo explicado, atendimento local e informações públicas acessíveis antes de deixar o veículo na oficina.
          </p>
        </div>

        <div className={styles.trustGrid}>
          <article data-reveal>
            <span>PROCESSO</span>
            <strong>Etapas claras</strong>
            <p>Avaliação, preparação, reparo, acabamento e entrega organizados em uma sequência definida.</p>
          </article>
          <article data-reveal>
            <span>ATENDIMENTO</span>
            <strong>Particular & seguro</strong>
            <p>A equipe orienta o caminho inicial de acordo com o tipo de atendimento do veículo.</p>
          </article>
          <article data-reveal>
            <span>REPUTAÇÃO PÚBLICA</span>
            <strong>{office.googleReviewCount} avaliações no Google</strong>
            <p>A nota atual é pública e pode ser acompanhada diretamente no perfil da empresa.</p>
            <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer">
              Ver perfil no Google <Arrow />
            </a>
          </article>
          <article data-reveal>
            <span>LOCAL</span>
            <strong>Lauro de Freitas</strong>
            <p>Endereço, telefone, horários e rota reunidos no próprio site para facilitar a visita.</p>
          </article>
        </div>
      </section>

      <section id="localizacao" className={styles.locationSection}>
        <div className={styles.locationCopy} data-reveal>
          <p className={styles.eyebrow}>LOCALIZAÇÃO</p>
          <h2>Vilas do Atlântico.<br/><span>Lauro de Freitas.</span></h2>
          <p>
            R. Leonardo Rodrigues da Silva, 480 — Vilas do Atlântico, Lauro de Freitas — BA.
          </p>
          <div className={styles.locationMeta}>
            <div><small>TELEFONE</small><strong>{office.publicPhone}</strong></div>
            <div><small>HORÁRIOS</small><strong>{office.hours}</strong></div>
          </div>
          <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer" className={styles.locationCta}>
            Abrir rota no Google Maps <Arrow />
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
          <a
            href={office.googleBusinessUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.mapExpandLink}
            aria-label="Abrir a localização completa da Pint Services no Google Maps"
          >
            <span>Ver mapa completo <Arrow /></span>
          </a>
          <div className={styles.mapPinCard}>
            <span>PINT SERVICES</span>
            <strong>CAR CENTER</strong>
            <small>Vilas do Atlântico · BA</small>
          </div>
        </div>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div className={styles.contactAccent} aria-hidden="true" />
        <div className={styles.contactCopy} data-reveal>
          <p className={styles.eyebrow}>ATENDIMENTO</p>
          <h2>Fale com a Pint.</h2>
          <p>
            Use os canais oficiais para tirar dúvidas, falar sobre seu veículo ou combinar o próximo passo com a equipe.
          </p>
        </div>

        <div className={styles.contactPanel} data-reveal>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.contactPrimary}>
            <span><small>WHATSAPP</small><strong>Falar com a equipe</strong></span>
            <Arrow />
          </a>
          <a href={telHref} className={styles.contactRow}><span>Telefone</span><strong>{office.publicPhone}</strong></a>
          <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer" className={styles.contactRow}><span>Localização</span><strong>Vilas do Atlântico · Lauro de Freitas</strong></a>
          <a href={office.instagramUrl} target="_blank" rel="noreferrer" className={styles.contactRow}><span>Instagram</span><strong>{office.instagramHandle}</strong></a>
          <div className={styles.contactRow}><span>Horários</span><strong>{office.hours}</strong></div>
        </div>
      </section>

      <SiteAssistant phone={office.publicPhone} />

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Brand />
          <p>Funilaria, pintura e recuperação automotiva em Lauro de Freitas, Bahia.</p>
        </div>
        <div className={styles.footerNav}>
          <a href="#servicos">Serviços</a>
          <a href="#processo">Como funciona</a>
          <a href="#seguro">Seguro</a>
          <a href="#sobre">A Pint</a>
          <a href="#localizacao">Localização</a>
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
