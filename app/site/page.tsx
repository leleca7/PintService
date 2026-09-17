import type { Metadata } from 'next';
import styles from './site.module.css';
import extra from './immersive-extra.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Seu carro novo de novo',
  description: 'Funilaria, repintura e recuperação automotiva em Lauro de Freitas. Atendimento particular e todas as seguradoras.',
};

const stages = [
  {
    number: '01',
    kicker: 'AVALIAÇÃO',
    title: 'Primeiro, entender o que precisa voltar à forma.',
    text: 'O reparo começa pela leitura do dano, definição do escopo e organização do que precisa acontecer antes de o veículo avançar.',
  },
  {
    number: '02',
    kicker: 'PREPARAÇÃO',
    title: 'A superfície certa muda todo o resultado final.',
    text: 'Desmontagem, funilaria e preparação de pintura constroem a base para um acabamento consistente, sem atalhos entre uma etapa e outra.',
  },
  {
    number: '03',
    kicker: 'PINTURA',
    title: 'Cor, cobertura e leitura visual precisam conversar.',
    text: 'A pintura entra quando a base está pronta. O objetivo é devolver uniformidade, brilho e presença ao conjunto do veículo.',
  },
  {
    number: '04',
    kicker: 'FINALIZAÇÃO',
    title: 'O carro só termina quando a entrega faz sentido.',
    text: 'Montagem, polimento, revisão visual e acabamento fecham o processo antes de o veículo voltar para a rua.',
  },
];

const services = [
  ['01', 'Funilaria & repintura', 'Recuperação de forma, preparação de superfície, pintura e acabamento em uma sequência única de trabalho.'],
  ['02', 'Martelinho de ouro', 'Correção localizada de amassados quando o tipo de dano permite preservar melhor a peça e o acabamento original.'],
  ['03', 'Rodas & acabamento', 'Pintura de rodas, polimento e cuidados finais para devolver leitura uniforme ao conjunto do veículo.'],
  ['04', 'Higienização', 'Cuidado interno e externo para que a percepção de entrega acompanhe o resultado do reparo.'],
];

const trustPillars = [
  ['01', 'Equipe qualificada', 'Técnica e experiência aplicadas ao cuidado de cada veículo, do diagnóstico à finalização.'],
  ['02', 'Estrutura e equipamentos', 'Ambiente de trabalho e equipamentos adequados para apoiar um processo de reparo organizado.'],
  ['03', 'Transparência no orçamento', 'Clareza sobre o que será feito, quais etapas estão envolvidas e como o reparo será conduzido.'],
  ['04', 'Prazo de entrega', 'Compromisso com acompanhamento e comunicação para que o cliente saiba onde o serviço está e o que falta.'],
];

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

function Brand() {
  return (
    <div className={styles.brand} aria-label="Pint Services Car Center">
      <img
        src="/pint-services-logo.webp"
        alt="Pint Services Car Center"
        width={360}
        height={100}
        style={{ width: 'clamp(158px, 14vw, 205px)', height: 'auto', display: 'block' }}
      />
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
          <a href="#contato" className={styles.navCta}>Fale com a Pint <span>↗</span></a>
        </nav>
      </header>

      <section className={styles.hero} aria-label="Apresentação Pint Services">
        <div className={styles.heroShade} />
        <div className={styles.heroNoise} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER · LAURO DE FREITAS</p>
          <h1>
            <span>Seu carro.</span>
            <span className={styles.heroGold}>Novo de novo.</span>
          </h1>
          <div className={styles.heroBottom}>
            <p>
              Especialista em repintura e funilaria automotiva. Atendimento particular e todas as seguradoras,
              com um processo conduzido do diagnóstico ao acabamento final.
            </p>
            <a href="#processo" className={styles.circleLink} aria-label="Conhecer o processo">↓</a>
          </div>
        </div>
        <div className={styles.heroIndex}>01 / 06</div>
        <div className={styles.scrollLabel}>ROLE PARA DESCOBRIR</div>
      </section>

      <section id="sobre" className={styles.manifesto}>
        <div className={styles.manifestoLabel}>ESTRUTURA · TÉCNICA · COMPROMISSO</div>
        <div className={styles.manifestoCopy}>
          <p className={styles.eyebrow}>PINT SERVICES</p>
          <h2>
            O reparo pode começar no dano.
            <span> Mas a experiência termina na confiança.</span>
          </h2>
          <p className={styles.manifestoText}>
            A proposta é simples: cuidar do carro com técnica, explicar o processo com clareza e conduzir cada etapa
            com organização até a entrega. É isso que transforma um reparo em confiança do início ao fim.
          </p>
        </div>
        <div className={styles.manifestoFacts}>
          <div><span>01</span><strong>Funilaria &amp; repintura</strong><small>Especialidade central</small></div>
          <div><span>02</span><strong>Particular &amp; seguradoras</strong><small>Atendimento</small></div>
          <div><span>03</span><strong>Lauro de Freitas · BA</strong><small>Localização</small></div>
        </div>
      </section>

      <section id="seguradoras" className={extra.insurersSection}>
        <div className={extra.insurersIntro}>
          <p className={styles.eyebrow}>SEGURADORAS</p>
          <h2>Teve problema com o seu carro? A Pint resolve.</h2>
          <p>Atendemos particular e todas as seguradoras. Acione sua seguradora e leve o veículo para uma avaliação com a equipe Pint Services.</p>
        </div>
        <div className={extra.insurerRail} aria-label="Seguradoras atendidas">
          {insurers.map((insurer, index) => (
            <div key={insurer} className={extra.insurerItem}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{insurer}</strong>
            </div>
          ))}
        </div>
        <p className={extra.insurerNote}>Marcas listadas com base nos materiais institucionais já publicados pela própria Pint Services.</p>
      </section>

      <section id="processo" className={styles.story}>
        <div className={styles.storyVisual} aria-hidden="true">
          <div className={styles.storyPhoto} />
          <div className={styles.storyOverlay} />
          <div className={styles.storyCaption}>
            <span>PROCESSO PINT</span>
            <strong>Forma → superfície → cor → entrega</strong>
          </div>
        </div>

        <div className={styles.storySteps}>
          <div className={styles.storyIntro}>
            <p className={styles.eyebrow}>DO DANO À ENTREGA</p>
            <h2>O carro avança. A narrativa acompanha.</h2>
          </div>
          {stages.map((stage) => (
            <article key={stage.number} className={styles.storyStep}>
              <span className={styles.storyNumber}>{stage.number}</span>
              <div>
                <p className={styles.stageKicker}>{stage.kicker}</p>
                <h3>{stage.title}</h3>
                <p>{stage.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={extra.trustSection} aria-label="Por que escolher a Pint Services">
        <div className={extra.trustIntro}>
          <p className={styles.eyebrow}>ESCOLHA CONFIANÇA</p>
          <h2>Quatro coisas que precisam estar certas antes de entregar a chave.</h2>
        </div>
        <div className={extra.trustGrid}>
          {trustPillars.map(([number, title, text]) => (
            <article key={number} className={extra.trustCard}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.transitionScene} aria-label="Precisão no acabamento">
        <div className={styles.transitionImage} />
        <div className={styles.transitionVeil} />
        <div className={styles.transitionCopy}>
          <p className={styles.eyebrow}>PRECISÃO NO DETALHE</p>
          <h2>Não basta parecer pronto de longe.</h2>
          <p>Preparação, repintura e acabamento são onde o resultado começa a se sustentar de verdade.</p>
        </div>
        <span className={styles.transitionWord}>PINT</span>
      </section>

      <section id="servicos" className={styles.servicesSection}>
        <div className={styles.servicesTitle}>
          <p className={styles.eyebrow}>SERVIÇOS</p>
          <h2>Um car center pensado para recuperar o conjunto.</h2>
        </div>
        <div className={styles.servicesList}>
          {services.map(([number, title, text]) => (
            <article key={number} className={styles.serviceRow}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <b aria-hidden="true">↗</b>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.beforeAfter}>
        <div className={styles.beforePanel}>
          <span>ANTES</span>
          <strong>Intervenção.</strong>
        </div>
        <div className={styles.afterPanel}>
          <span>DEPOIS</span>
          <strong>Presença.</strong>
        </div>
        <div className={styles.compareLine}><i /></div>
        <div className={styles.compareCopy}>
          <p className={styles.eyebrow}>ANTES / DEPOIS</p>
          <h2>A diferença precisa ser percebida.</h2>
          <p>Esta área está preparada para receber casos reais da Pint Services com comparação visual interativa.</p>
        </div>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div className={styles.contactTopline}>
          <span>PINT SERVICES</span>
          <span>LAURO DE FREITAS · BA</span>
        </div>
        <div className={styles.contactCore}>
          <p className={styles.eyebrow}>ATENDIMENTO</p>
          <h2>Seu carro.<br />Nosso processo.<br /><span>Novo de novo.</span></h2>
          <div className={extra.contactActions}>
            <a
              href="https://wa.me/5571994000097?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Pint%20Services%20e%20gostaria%20de%20solicitar%20uma%20avalia%C3%A7%C3%A3o."
              className={styles.contactButton}
              target="_blank"
              rel="noreferrer"
            >
              Solicitar avaliação <span>↗</span>
            </a>
            <a href="tel:+557135087781" className={extra.contactSecondary}>Ligar agora · (71) 3508-7781</a>
          </div>
        </div>

        <div className={extra.contactInfoGrid}>
          <div className={extra.contactInfoBlock}>
            <span>ENDEREÇO</span>
            <strong>Rua Leonardo R da Silva, Pitangueiras, 480 · Galpão 03</strong>
            <small>Lauro de Freitas · BA · 42701-420</small>
          </div>
          <div className={extra.contactInfoBlock}>
            <span>HORÁRIO</span>
            <strong>Segunda a sexta · 8:00 — 17:00</strong>
            <small>Sábado · 8:00 — 12:00</small>
          </div>
          <div className={extra.contactInfoBlock}>
            <span>CONTATO</span>
            <strong>(71) 3508-7781</strong>
            <small>WhatsApp · (71) 99400-0097</small>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand />
        <div className={styles.footerCenter}>
          <strong>pintservices.com.br</strong>
          <span>Seu carro novo de novo</span>
        </div>
        <div className={styles.footerRight}>
          <a href="#top">Topo ↑</a>
          <small>Fotografias temporárias de referência: Unsplash.</small>
        </div>
      </footer>
    </main>
  );
}
