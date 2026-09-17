import type { Metadata } from 'next';
import styles from './site.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Seu carro novo de novo',
  description:
    'Funilaria, pintura e recuperação automotiva em Lauro de Freitas. Atendimento particular e todas as seguradoras.',
};

const whatsappUrl = 'https://wa.me/5571994000097';

const insurers = [
  'Bradesco Seguros',
  'Tokio Marine',
  'MSIG',
  'Allianz',
  'Suhai',
  'SulAmérica',
  'Generali',
  'Liberty Seguros',
  'Azul Seguros',
  'HDI Seguros',
  'Porto Seguro',
];

const phases = [
  ['01', 'Desmontagem'],
  ['02', 'Funilaria'],
  ['03', 'Prep. Pintura'],
  ['04', 'Pintura'],
  ['05', 'Polimento de Pint.'],
  ['06', 'Montagem'],
  ['07', 'Lavagem & Acabamento'],
];

function Brand() {
  return (
    <span className={styles.brand} aria-label="Pint Services Car Center">
      <span className={styles.brandMark} aria-hidden="true">
        <i />
      </span>
      <span className={styles.brandName}>
        <strong>Pint Services</strong>
        <small>car center</small>
      </span>
    </span>
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function PintServicesSite() {
  const ticker = [...insurers, ...insurers];

  return (
    <main id="top" className={styles.site}>
      <header className={styles.header}>
        <a href="#top" className={styles.brandLink} aria-label="Pint Services — início">
          <Brand />
        </a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#experiencia">A Pint</a>
          <a href="#processo">Processo</a>
          <a href="#seguradoras">Seguradoras</a>
          <a href="#contato" className={styles.navCta}>
            Orçamento <Arrow />
          </a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroImage} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={styles.heroTopline}>
          <span>LAURO DE FREITAS · BAHIA</span>
          <span>FUNILARIA · PINTURA · RECUPERAÇÃO</span>
        </div>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER</p>
          <h1>
            <span>SEU CARRO</span>
            <span className={styles.gold}>NOVO DE NOVO.</span>
          </h1>
          <p>
            Técnica, estrutura e cuidado para recuperar o seu carro do início ao fim.
            Atendimento particular e todas as seguradoras.
          </p>
          <div className={styles.heroActions}>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.primaryCta}>
              Solicitar orçamento <Arrow />
            </a>
            <a href="#experiencia" className={styles.textCta}>
              Conhecer a Pint ↓
            </a>
          </div>
        </div>

        <div className={styles.scrollCue} aria-hidden="true">
          <span>SCROLL</span>
          <i />
        </div>
      </section>

      <section className={styles.statement} id="experiencia">
        <p className={styles.sectionIndex}>01 — A PINT SERVICES</p>
        <div className={styles.statementGrid}>
          <h2>
            Não é só reparar.
            <br />
            É <em>devolver confiança.</em>
          </h2>
          <div>
            <p>
              Da avaliação ao acabamento, cada etapa precisa conversar com a próxima.
              Equipe, estrutura, transparência e prazo fazem parte do mesmo serviço.
            </p>
            <span>Seu carro novo de novo.</span>
          </div>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.sceneDark}`}>
        <div className={`${styles.sceneVisual} ${styles.teamVisual}`} aria-hidden="true" />
        <div className={styles.sceneOverlay} aria-hidden="true" />
        <span className={styles.sceneNumber}>01</span>
        <div className={styles.sceneCopy}>
          <p>CONFIANÇA COMEÇA POR QUEM EXECUTA</p>
          <h2>Equipe qualificada.</h2>
          <span>
            Técnica e experiência para conduzir o reparo com atenção em cada detalhe.
          </span>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.sceneLight}`}>
        <div className={`${styles.sceneVisual} ${styles.boothVisual}`} aria-hidden="true" />
        <div className={styles.sceneLightPanel}>
          <span className={styles.sceneNumberLight}>02</span>
          <div className={styles.sceneCopyLight}>
            <p>ESTRUTURA &amp; EQUIPAMENTOS</p>
            <h2>O ambiente também faz parte do resultado.</h2>
            <span>
              Uma estrutura preparada para apoiar as diferentes etapas da recuperação automotiva.
            </span>
          </div>
        </div>
      </section>

      <section className={styles.transparencyScene}>
        <span className={styles.giantWord} aria-hidden="true">CLAREZA</span>
        <div className={styles.transparencyContent}>
          <p className={styles.sectionIndex}>03 — TRANSPARÊNCIA</p>
          <h2>
            Você entende o que será feito.
            <br />
            <em>Antes de acontecer.</em>
          </h2>
          <p>
            Orçamento claro, comunicação direta e acompanhamento do processo para que o cliente saiba como o veículo está evoluindo.
          </p>
        </div>
      </section>

      <section className={`${styles.scene} ${styles.sceneDark}`}>
        <div className={`${styles.sceneVisual} ${styles.aerialVisual}`} aria-hidden="true" />
        <div className={styles.sceneOverlayStrong} aria-hidden="true" />
        <span className={styles.sceneNumber}>04</span>
        <div className={`${styles.sceneCopy} ${styles.sceneCopyWide}`}>
          <p>ESTRUTURA · TÉCNICA · COMPROMISSO</p>
          <h2>Uma operação pensada para o carro avançar.</h2>
          <span>
            Organização de produção e acompanhamento de prazo para conduzir cada veículo até a entrega.
          </span>
        </div>
      </section>

      <section className={styles.process} id="processo">
        <div className={styles.processLead}>
          <p className={styles.sectionIndex}>02 — O PROCESSO</p>
          <h2>Do primeiro toque ao último acabamento.</h2>
          <p>
            Cada veículo percorre uma sequência de produção. O trabalho muda de mãos; o objetivo continua o mesmo.
          </p>
        </div>
        <div className={styles.phaseList}>
          {phases.map(([number, title]) => (
            <div className={styles.phase} key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <i aria-hidden="true">↘</i>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.servicesManifesto}>
        <p>FUNILARIA</p>
        <p className={styles.outlineText}>PINTURA</p>
        <p>POLIMENTO</p>
        <p className={styles.outlineText}>HIGIENIZAÇÃO</p>
        <div>
          <span>RECUPERAÇÃO AUTOMOTIVA</span>
          <span>MARTELINHO DE OURO</span>
          <span>PINTURA DE RODAS</span>
        </div>
      </section>

      <section className={styles.insurers} id="seguradoras">
        <div className={styles.insurerIntro}>
          <p className={styles.sectionIndex}>03 — ATENDIMENTO</p>
          <h2>
            Particular.
            <br />
            <span>E todas as seguradoras.</span>
          </h2>
          <p>
            A Pint Services atende clientes particulares e trabalha com seguradoras para conduzir o reparo do veículo com uma única preocupação: fazer o processo avançar corretamente.
          </p>
        </div>

        <div className={styles.marquee} aria-label={insurers.join(', ')}>
          <div className={styles.marqueeTrack} aria-hidden="true">
            {ticker.map((name, index) => (
              <span key={`${name}-${index}`}>
                {name} <b>✦</b>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta} id="contato">
        <div className={styles.finalEyebrow}>
          <span>PINT SERVICES · LAURO DE FREITAS</span>
          <span>SEG — SEX 08:00–17:00 · SÁB 08:00–12:00</span>
        </div>
        <h2>
          VAMOS DEIXAR
          <br />
          SEU CARRO <em>NOVO DE NOVO?</em>
        </h2>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.bigCta}>
          <span>Solicitar orçamento</span>
          <Arrow />
        </a>

        <div className={styles.contactGrid}>
          <div>
            <small>TELEFONES</small>
            <a href="tel:+557135087781">(71) 3508-7781</a>
            <a href="tel:+5571994000097">(71) 99400-0097</a>
          </div>
          <div>
            <small>ENDEREÇO</small>
            <p>Rua Leonardo R da Silva, Pitangueiras, 480 · Galpão 03</p>
            <p>Lauro de Freitas · BA · 42701-420</p>
          </div>
          <div>
            <small>ATENDIMENTO</small>
            <p>Segunda a sexta · 08:00–17:00</p>
            <p>Sábado · 08:00–12:00</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand />
        <span>© Pint Services Car Center</span>
        <a href="#top">Voltar ao topo ↑</a>
      </footer>
    </main>
  );
}
