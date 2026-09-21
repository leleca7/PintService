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
        src="data:image/jpeg;base64,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"
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

        <div className={styles.supportingStrip} data-reveal>
          <article>
            <span>04</span>
            <h3>Pintura de rodas</h3>
            <p>Recuperação estética e pintura de rodas conforme avaliação do estado da peça.</p>
          </article>
          <article>
            <span>05</span>
            <h3>Higienização</h3>
            <p>Cuidados de limpeza e higienização para complementar a experiência de entrega do veículo.</p>
          </article>
          <article>
            <span>06</span>
            <h3>Seguro & particular</h3>
            <p>Orientação inicial para entender o caminho do reparo em cada tipo de atendimento.</p>
          </article>
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
