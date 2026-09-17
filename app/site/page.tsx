import type { Metadata } from 'next';
import styles from './site.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Car Center',
  description: 'Funilaria, pintura e recuperação automotiva em Lauro de Freitas, Bahia.',
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
    text: 'A pintura entra quando a base está pronta. O objetivo é devolver uniformidade e presença ao conjunto do veículo.',
  },
  {
    number: '04',
    kicker: 'FINALIZAÇÃO',
    title: 'O carro só termina quando a entrega faz sentido.',
    text: 'Montagem, polimento, revisão visual e acabamento fecham o processo antes de o veículo voltar para a rua.',
  },
];

const services = [
  ['01', 'Funilaria & pintura', 'Recuperação de forma, preparação de superfície, pintura e acabamento em uma sequência única de trabalho.'],
  ['02', 'Martelinho de ouro', 'Correção localizada de amassados quando o tipo de dano permite preservar melhor a peça e o acabamento original.'],
  ['03', 'Rodas & acabamento', 'Pintura de rodas, polimento e cuidados finais para devolver leitura uniforme ao conjunto do veículo.'],
  ['04', 'Higienização', 'Cuidado interno e externo para que a percepção de entrega acompanhe o resultado do reparo.'],
];

function Brand() {
  return (
    <div className={styles.brand} aria-label="Pint Services Car Center">
      <span className={styles.brandMark} aria-hidden="true"><span /></span>
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
        <a href="#top" className={styles.brandLink} aria-label="Ir para o início"><Brand /></a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#processo">Processo</a>
          <a href="#servicos">Serviços</a>
          <a href="#sobre">Sobre</a>
          <a href="#contato" className={styles.navCta}>Fale com a Pint <span>↗</span></a>
        </nav>
      </header>

      <section className={styles.hero} aria-label="Apresentação Pint Services">
        <div className={styles.heroShade} />
        <div className={styles.heroNoise} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER · LAURO DE FREITAS</p>
          <h1>
            <span>De volta</span>
            <span>à forma.</span>
            <span className={styles.heroGold}>De volta à estrada.</span>
          </h1>
          <div className={styles.heroBottom}>
            <p>
              Funilaria, pintura e recuperação automotiva conduzidas por etapas —
              do primeiro diagnóstico ao último detalhe antes da entrega.
            </p>
            <a href="#processo" className={styles.circleLink} aria-label="Conhecer o processo">↓</a>
          </div>
        </div>
        <div className={styles.heroIndex}>01 / 05</div>
        <div className={styles.scrollLabel}>ROLE PARA DESCOBRIR</div>
      </section>

      <section id="sobre" className={styles.manifesto}>
        <div className={styles.manifestoLabel}>UMA OFICINA. UM PROCESSO.</div>
        <div className={styles.manifestoCopy}>
          <p className={styles.eyebrow}>PINT SERVICES</p>
          <h2>
            O reparo pode começar no dano.
            <span> Mas a experiência termina na confiança.</span>
          </h2>
          <p className={styles.manifestoText}>
            Cada veículo passa por uma sequência de avaliação, preparação, execução e acabamento.
            Menos ruído entre etapas. Mais clareza sobre o que precisa acontecer até a entrega.
          </p>
        </div>
        <div className={styles.manifestoFacts}>
          <div><span>01</span><strong>Funilaria &amp; pintura</strong><small>Especialidade central</small></div>
          <div><span>02</span><strong>Seguradoras &amp; particulares</strong><small>Atendimento</small></div>
          <div><span>03</span><strong>Lauro de Freitas · BA</strong><small>Localização</small></div>
        </div>
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

      <section className={styles.transitionScene} aria-label="Precisão no acabamento">
        <div className={styles.transitionImage} />
        <div className={styles.transitionVeil} />
        <div className={styles.transitionCopy}>
          <p className={styles.eyebrow}>PRECISÃO NO DETALHE</p>
          <h2>Não basta parecer pronto de longe.</h2>
          <p>Preparação e acabamento são onde o resultado começa a se sustentar de verdade.</p>
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
          <p>Na versão final, esta área recebe casos reais da Pint Services com comparação visual interativa.</p>
        </div>
      </section>

      <section id="contato" className={styles.contactSection}>
        <div className={styles.contactTopline}>
          <span>PINT SERVICES</span>
          <span>LAURO DE FREITAS · BA</span>
        </div>
        <div className={styles.contactCore}>
          <p className={styles.eyebrow}>ATENDIMENTO</p>
          <h2>Seu carro.<br />Nosso processo.<br /><span>Sua confiança de volta.</span></h2>
          <a href="#top" className={styles.contactButton}>Solicitar avaliação <span>↗</span></a>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand />
        <div className={styles.footerCenter}>
          <strong>pintservices.com.br</strong>
          <span>Site conceito · direção imersiva</span>
        </div>
        <div className={styles.footerRight}>
          <a href="#top">Topo ↑</a>
          <small>Fotografias temporárias de referência: Unsplash.</small>
        </div>
      </footer>
    </main>
  );
}
