import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { getOfficeProfile } from '@/lib/office-profile';
import SiteMotion from './site-motion';
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

const imagery = {
  hero: 'https://images.pexels.com/photos/33814680/pexels-photo-33814680.jpeg?auto=compress&cs=tinysrgb&w=2000',
  paint: 'https://images.pexels.com/photos/30250199/pexels-photo-30250199.jpeg?auto=compress&cs=tinysrgb&w=1800',
  workshop: 'https://images.pexels.com/photos/10162530/pexels-photo-10162530.jpeg?auto=compress&cs=tinysrgb&w=1800',
};

const featuredServices = [
  {
    number: '01',
    title: 'Funilaria & pintura',
    text: 'Recuperação de peças e superfícies, preparação, correção e pintura em uma sequência coordenada.',
    image: imagery.hero,
    label: 'Estrutura · superfície · cor',
  },
  {
    number: '02',
    title: 'Preparação & execução',
    text: 'Cada intervenção acontece no momento certo: desmontagem, preparação, pintura e montagem.',
    image: imagery.paint,
    label: 'Processo · precisão',
  },
  {
    number: '03',
    title: 'Acabamento final',
    text: 'Polimento, revisão visual, limpeza e conferência antes da entrega ao cliente.',
    image: imagery.workshop,
    label: 'Refino · entrega',
  },
];

const supportingServices = [
  ['04', 'Martelinho de ouro', 'Correção precisa de amassados quando o reparo permite preservar a peça.'],
  ['05', 'Pintura de rodas', 'Renovação estética do conjunto com preparação e acabamento consistentes.'],
  ['06', 'Higienização', 'Cuidado interno e externo pensado para completar a experiência de entrega.'],
];

const insurers = [
  { name: 'Bradesco Seguros', short: 'BRADESCO', detail: 'Seguradora registrada na operação Pint Services' },
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
          <a href="#processo">Processo</a>
          <a href="#sobre">A Pint</a>
          <a href="#contato">Contato</a>
        </nav>

        <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.headerCta}>
          Solicitar avaliação <Arrow />
        </a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroBeam} aria-hidden="true" data-parallax="0.035" />
        <div className={styles.heroGhost} aria-hidden="true">PINT</div>

        <div className={styles.heroCopy} data-reveal>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER · LAURO DE FREITAS</p>
          <div className={styles.heroTitle}>
            <span>REDEFINA</span>
            <span>O REPARO.</span>
          </div>
          <p className={styles.heroText}>
            Funilaria, pintura e recuperação automotiva conduzidas como um processo.
            Do dano aparente ao acabamento que devolve presença ao carro.
          </p>
          <div className={styles.heroActions}>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.primary}>
              Solicitar avaliação <Arrow />
            </a>
            <a href="#processo" className={styles.secondary}>
              Conhecer o processo
            </a>
          </div>
        </div>

        <div className={styles.heroVisual} data-tilt data-reveal>
          <div className={styles.heroImageWrap} data-parallax="0.075">
            <Image
              className={styles.heroImage}
              src={imagery.hero}
              alt="Carro em ambiente profissional de pintura automotiva"
              fill
              priority
              sizes="(max-width: 980px) 100vw, 62vw"
            />
          </div>
          <div className={styles.heroPhotoShade} aria-hidden="true" />
          <div className={styles.heroOrbit} aria-hidden="true" />
          <div className={styles.heroCorner}>PINT / 01</div>
          <div className={styles.heroCaption}>
            <span>PROCESSO REAL</span>
            <strong>Pintura · acabamento · controle visual</strong>
          </div>
        </div>

        <div className={styles.heroFacts} data-reveal>
          <div><small>01</small><span>ESPECIALIDADE</span><strong>Funilaria &amp; pintura</strong></div>
          <div><small>02</small><span>FLUXO</span><strong>Processo por etapas</strong></div>
          <div><small>03</small><span>ATENDIMENTO</span><strong>Seguradoras &amp; particulares</strong></div>
        </div>
      </section>

      <section className={styles.marquee} aria-label="Especialidades Pint Services">
        <div className={styles.marqueeTrack}>
          <span>FUNILARIA</span><i>×</i><span>PINTURA</span><i>×</i><span>PRECISÃO</span><i>×</i><span>ACABAMENTO</span><i>×</i>
          <span>FUNILARIA</span><i>×</i><span>PINTURA</span><i>×</i><span>PRECISÃO</span><i>×</i><span>ACABAMENTO</span><i>×</i>
        </div>
      </section>

      <section id="servicos" className={styles.servicesSection}>
        <div className={styles.sectionIntroGrid} data-reveal>
          <div>
            <p className={styles.eyebrow}>SERVIÇOS / 01</p>
            <h2>Construído para <span>recuperar.</span></h2>
          </div>
          <div className={styles.introCopy}>
            <p>
              A Pint trata o reparo como uma sequência, não como tarefas isoladas.
              Técnica, organização e acabamento trabalham juntos.
            </p>
            <a href={whatsappHref} target="_blank" rel="noreferrer">Conversar sobre meu veículo <Arrow /></a>
          </div>
        </div>

        <div className={styles.featuredGrid}>
          {featuredServices.map((service, index) => (
            <article
              key={service.number}
              className={styles.featuredCard}
              data-reveal
              data-tilt
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

        <div className={styles.supportingStrip}>
          {supportingServices.map(([number, title, text], index) => (
            <article key={number} data-reveal style={{ '--delay': `${index * 80}ms` } as CSSProperties}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.statementSection}>
        <div className={styles.statementPhoto} data-parallax="0.06">
          <Image
            src={imagery.paint}
            alt="Técnico realizando pintura automotiva"
            fill
            sizes="100vw"
            className={styles.statementImage}
          />
          <div className={styles.statementShade} />
        </div>
        <div className={styles.statementGrid} aria-hidden="true" />
        <div className={styles.statementCopy} data-reveal>
          <p className={styles.eyebrow}>NOSSO PADRÃO / 02</p>
          <h2>
            RESULTADO NÃO
            <span>ACONTECE NO</span>
            <strong>IMPROVISO.</strong>
          </h2>
          <p>
            Ele nasce quando cada etapa é executada no momento certo e com atenção ao que será percebido na entrega.
          </p>
        </div>
      </section>

      <section id="processo" className={styles.processSection}>
        <div className={styles.processBackdrop} aria-hidden="true">PROCESSO</div>
        <div className={styles.processSticky} data-reveal>
          <p className={styles.eyebrow}>FLUXO / 03</p>
          <h2>Quatro movimentos. Um resultado coerente.</h2>
          <p>
            O veículo avança por uma sequência definida. Isso organiza a produção e concentra a equipe no próximo passo necessário.
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
                <small>PINT SERVICES · ETAPA {item.number}</small>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <span className={styles.processLine} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section id="sobre" className={styles.aboutSection}>
        <div className={styles.aboutVisual} data-reveal data-tilt>
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
          <p className={styles.eyebrow}>A PINT SERVICES / 04</p>
          <h2>Mais do que reparar uma peça. <span>Cuidar da leitura do carro inteiro.</span></h2>
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

      <section className={styles.insurerSection}>
        <div className={styles.insurerIntro} data-reveal>
          <p className={styles.eyebrow}>SEGURADORAS / 05</p>
          <h2>Atendimento que conversa com <span>quem protege o seu carro.</span></h2>
          <p>
            A Pint Services também atua em reparos vinculados a seguradoras. Abaixo estão as companhias já registradas na operação atual.
          </p>
        </div>
        <div className={styles.insurerRail}>
          {insurers.map((insurer) => (
            <article key={insurer.name} className={styles.insurerCard} data-reveal>
              <div className={styles.insurerMonogram}>{insurer.short.slice(0, 2)}</div>
              <div>
                <small>SEGURADORA</small>
                <strong>{insurer.name}</strong>
                <span>{insurer.detail}</span>
              </div>
              <Arrow />
            </article>
          ))}
          <article className={styles.insurerCardMuted} data-reveal>
            <small>OUTRA SEGURADORA?</small>
            <strong>Consulte a equipe</strong>
            <a href={whatsappHref} target="_blank" rel="noreferrer">Verificar atendimento <Arrow /></a>
          </article>
        </div>
      </section>

      <section className={styles.locationSection}>
        <div className={styles.locationCopy} data-reveal>
          <p className={styles.eyebrow}>LOCALIZAÇÃO / 06</p>
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

        <div className={styles.mapShell} data-reveal data-tilt>
          <iframe
            title="Mapa da Pint Services em Vilas do Atlântico"
            src="https://www.google.com/maps?q=R.%20Leonardo%20Rodrigues%20da%20Silva%2C%20480%20-%20Vilas%20do%20Atl%C3%A2ntico%2C%20Lauro%20de%20Freitas%20-%20BA&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={styles.mapFrame}
          />
          <div className={styles.mapOverlay} aria-hidden="true" />
          <div className={styles.mapPinCard}>
            <span>PINT SERVICES</span>
            <strong>CAR CENTER</strong>
            <small>Vilas do Atlântico · BA</small>
          </div>
          <div className={styles.mapCrosshair} aria-hidden="true">+</div>
        </div>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div className={styles.contactAccent} aria-hidden="true" />
        <div className={styles.contactCopy} data-reveal>
          <p className={styles.eyebrow}>ATENDIMENTO / 07</p>
          <h2>Seu carro. Nosso próximo projeto.</h2>
          <p>
            Conte o que aconteceu. A equipe orienta o próximo passo para avaliação, reparo particular ou atendimento relacionado a seguradora.
          </p>
        </div>

        <div className={styles.contactPanel} data-reveal>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.contactPrimary}>
            <span><small>WHATSAPP</small><strong>Falar com a Pint Services</strong></span>
            <Arrow />
          </a>
          <a href={telHref} className={styles.contactRow}><span>Telefone</span><strong>{office.publicPhone}</strong></a>
          <a href={office.googleBusinessUrl} target="_blank" rel="noreferrer" className={styles.contactRow}><span>Localização</span><strong>Vilas do Atlântico · Lauro de Freitas</strong></a>
          <a href={office.instagramUrl} target="_blank" rel="noreferrer" className={styles.contactRow}><span>Instagram</span><strong>{office.instagramHandle}</strong></a>
          <div className={styles.contactRow}><span>Horários</span><strong>{office.hours}</strong></div>
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
          <span className={styles.photoCredit}>Fotografias ilustrativas · Pexels</span>
          <a href="#top">Voltar ao topo ↑</a>
        </div>
      </footer>
    </main>
  );
}
