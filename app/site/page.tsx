import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { getOfficeProfile } from '@/lib/office-profile';
import SiteMotion from './site-motion';
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
    title: 'Acabamento final & polimento',
    text: 'Polimento, revisão visual e conferência final para entregar o veículo com acabamento consistente.',
    image: imagery.workshop,
    label: 'Acabamento · polimento · entrega',
  },
];

const insurers = [
  { name: 'Bradesco Seguros', logo: 'https://www.google.com/s2/favicons?domain=bradescoseguros.com.br&sz=256' },
  { name: 'Tokio Marine', logo: 'https://www.google.com/s2/favicons?domain=tokiomarine.com.br&sz=256' },
  { name: 'MSIG', logo: 'https://www.google.com/s2/favicons?domain=msig.com.br&sz=256' },
  { name: 'Allianz', logo: 'https://www.google.com/s2/favicons?domain=allianz.com.br&sz=256' },
  { name: 'Suhai Seguradora', logo: 'https://logodownload.org/wp-content/uploads/2022/06/suhai-seguradora-logo.png' },
  { name: 'SulAmérica', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Logotipo_da_SulAm%C3%A9rica.svg' },
  { name: 'Generali', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Generali_wordmark_logo.svg' },
  { name: 'Liberty Seguros', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Logo_Liberty_Insurance.svg' },
  { name: 'Azul Seguros', logo: 'https://www.google.com/s2/favicons?domain=azulseguros.com.br&sz=256' },
  { name: 'HDI Seguros', logo: 'https://www.google.com/s2/favicons?domain=hdiseguros.com.br&sz=256' },
  { name: 'Porto Seguro', logo: 'https://www.google.com/s2/favicons?domain=portoseguro.com.br&sz=256' },
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
      <Image
        src="/pint-services-logo.jpg"
        alt="Pint Services Car Center"
        width={447}
        height={125}
        className={styles.brandImage}
        priority
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
  const scheduleHref = `${whatsappHref}?text=${encodeURIComponent(
    'Olá! Gostaria de solicitar um agendamento para avaliação e possível entrada do veículo. Sei que a data será confirmada pela equipe após a análise do serviço.',
  )}`;

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
        <div className={styles.heroBeam} aria-hidden="true" />
        <div className={styles.heroGhost} aria-hidden="true">PINT</div>

        <div className={styles.heroCopy} data-reveal>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER · LAURO DE FREITAS</p>
          <div className={styles.heroTitle}>
            <span>REDEFINA</span>
            <span>O REPARO</span>
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
          {[0, 1, 2].map((cycle) => (
            <div className={styles.marqueeSet} key={cycle} aria-hidden={cycle > 0}>
              <span>FUNILARIA</span><i>×</i>
              <span>PINTURA</span><i>×</i>
              <span>POLIMENTO</span><i>×</i>
              <span>ACABAMENTO</span><i>×</i>
            </div>
          ))}
        </div>
      </section>

      <section id="servicos" className={styles.servicesSection}>
        <div className={styles.sectionIntroGrid} data-reveal>
          <div>
            <p className={styles.eyebrow}>SERVIÇOS</p>
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

      <section className={styles.statementSection}>
        <div className={styles.statementPhoto}>
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
          <p className={styles.eyebrow}>NOSSO PADRÃO</p>
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
          <p className={styles.eyebrow}>FLUXO</p>
          <h2>Quatro movimentos. Um resultado coerente.</h2>
          <p>
            O veículo avança por uma sequência definida. Isso organiza a produção e concentra a equipe no próximo passo necessário.
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
          <p className={styles.eyebrow}>SEGURADORAS</p>
          <h2>Atendimento que conversa com <span>quem protege o seu carro.</span></h2>
          <p>
            A Pint Services também atua em reparos vinculados a seguradoras. Abaixo estão as companhias já registradas na operação atual.
          </p>
        </div>
        <div className={styles.insurerRail}>
          {insurers.map((insurer) => (
            <article key={insurer.name} className={styles.insurerCard} data-reveal>
              <div className={styles.insurerLogoWrap}>
                <img
                  src={insurer.logo}
                  alt={`Logo ${insurer.name}`}
                  className={styles.insurerLogo}
                  loading="lazy"
                />
              </div>
              <div>
                <small>SEGURADORA</small>
                <strong>{insurer.name}</strong>
                <span>Atendimento vinculado à seguradora</span>
              </div>
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
          <a href={scheduleHref} target="_blank" rel="noreferrer" className={styles.contactSchedule}>
            <span>
              <small>AGENDAMENTO</small>
              <strong>Solicitar data de entrada</strong>
              <em>A confirmação é feita manualmente pela equipe após análise do serviço.</em>
            </span>
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
