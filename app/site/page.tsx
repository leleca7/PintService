import type { Metadata } from 'next';
import styles from './site.module.css';

export const metadata: Metadata = {
  title: 'Pint Services | Seu carro novo de novo',
  description:
    'Especialista em repintura, funilaria e recuperação automotiva em Lauro de Freitas. Atendimento particular e todas as seguradoras.',
};

const whatsappHref =
  'https://wa.me/5571994000097?text=Ol%C3%A1%2C%20Pint%20Services.%20Quero%20solicitar%20um%20or%C3%A7amento.';

const processChapters = [
  {
    number: '01',
    kicker: 'Leitura do dano',
    title: 'Avaliação',
    text: 'O trabalho começa entendendo o que precisa ser recuperado, quais peças entram no processo e qual sequência faz sentido para o veículo.',
    visual: 'processVisualOne',
  },
  {
    number: '02',
    kicker: 'Forma e estrutura',
    title: 'Funilaria',
    text: 'Correção da carroceria e preparação das superfícies para devolver geometria, alinhamento e base técnica para as próximas etapas.',
    visual: 'processVisualTwo',
  },
  {
    number: '03',
    kicker: 'Base do acabamento',
    title: 'Preparação',
    text: 'Lixamento, correções e preparação de pintura acontecem com atenção ao detalhe. É aqui que o acabamento começa a ser construído.',
    visual: 'processVisualThree',
  },
  {
    number: '04',
    kicker: 'Cor e uniformidade',
    title: 'Pintura',
    text: 'A aplicação entra quando a base está pronta, buscando devolver uniformidade, profundidade e coerência visual ao conjunto.',
    visual: 'processVisualFour',
  },
  {
    number: '05',
    kicker: 'Refino',
    title: 'Polimento',
    text: 'O refino da pintura recupera brilho, corrige marcas do processo e prepara o carro para uma leitura final mais limpa e uniforme.',
    visual: 'processVisualFive',
  },
  {
    number: '06',
    kicker: 'Última leitura',
    title: 'Montagem & acabamento',
    text: 'Montagem, limpeza e revisão visual fecham o ciclo. O carro só está pronto quando a entrega faz sentido por inteiro.',
    visual: 'processVisualSix',
  },
];

const services = [
  {
    index: '01',
    eyebrow: 'Recuperação de carroceria',
    title: 'Funilaria & repintura',
    text: 'Da correção da chapa ao acabamento final, com processo organizado para recuperar forma, cor e apresentação do veículo.',
    visual: 'serviceVisualOne',
    reverse: false,
  },
  {
    index: '02',
    eyebrow: 'Correção precisa',
    title: 'Martelinho de ouro',
    text: 'Para amassados em que a técnica permite preservar ao máximo a originalidade da peça e reduzir intervenções desnecessárias.',
    visual: 'serviceVisualTwo',
    reverse: true,
  },
  {
    index: '03',
    eyebrow: 'Refino e presença',
    title: 'Polimento & higienização',
    text: 'Brilho, uniformidade e cuidado de entrega para completar a experiência de recuperação do carro por dentro e por fora.',
    visual: 'serviceVisualThree',
    reverse: false,
  },
  {
    index: '04',
    eyebrow: 'Detalhe que muda o conjunto',
    title: 'Pintura de rodas',
    text: 'Preparação e renovação visual das rodas para devolver coerência estética ao conjunto e valorizar o acabamento do veículo.',
    visual: 'serviceVisualFour',
    reverse: true,
  },
];

const differentiators = [
  {
    number: '01',
    title: 'Equipe qualificada',
    text: 'Técnica e experiência para conduzir o reparo com atenção ao que cada veículo realmente precisa.',
  },
  {
    number: '02',
    title: 'Estrutura e equipamentos',
    text: 'Ambiente de trabalho preparado para organizar as etapas de funilaria, pintura e acabamento.',
  },
  {
    number: '03',
    title: 'Transparência no orçamento',
    text: 'Escopo e etapas explicados com clareza para que o cliente entenda o serviço antes de avançar.',
  },
  {
    number: '04',
    title: 'Previsibilidade de entrega',
    text: 'Prazo comunicado com responsabilidade e acompanhamento do processo até a finalização do veículo.',
  },
];

const insurers = [
  'Bradesco Seguros',
  'Tokio Marine',
  'MSIG',
  'Allianz',
  'Suhai',
  'SulAmérica',
  'Generali',
  'Liberty',
  'Azul Seguros',
  'HDI',
  'Porto',
];

function Brand() {
  return (
    <span className={styles.brand} aria-label="Pint Services Car Center">
      <img
        src="/pint-services-logo.webp"
        alt="Pint Services Car Center"
        width={360}
        height={100}
      />
    </span>
  );
}

export default function PintServicesSite() {
  return (
    <main id="top" className={styles.site}>
      <a className={styles.skipLink} href="#conteudo">Ir para o conteúdo</a>

      <header className={styles.header}>
        <a href="#top" className={styles.brandLink} aria-label="Pint Services — voltar ao início">
          <Brand />
        </a>
        <nav className={styles.nav} aria-label="Navegação principal">
          <a href="#processo">Processo</a>
          <a href="#servicos">Serviços</a>
          <a href="#diferenciais">Diferenciais</a>
          <a href="#contato" className={styles.navCta}>Orçamento <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroMedia} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroNoise} aria-hidden="true" />

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>PINT SERVICES · CAR CENTER · LAURO DE FREITAS</p>
          <h1 id="hero-title">
            Seu carro.
            <span>Novo de novo.</span>
          </h1>
          <div className={styles.heroBottom}>
            <p>
              Especialista em repintura e funilaria automotiva. Atendimento particular e todas as seguradoras, com um processo conduzido do diagnóstico ao acabamento final.
            </p>
            <div className={styles.heroActions}>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.primaryCta}>
                Solicitar orçamento <span aria-hidden="true">↗</span>
              </a>
              <a href="#processo" className={styles.textCta}>Conhecer o processo <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </div>

        <div className={styles.heroMeta}>
          <span>Funilaria</span><i />
          <span>Repintura</span><i />
          <span>Acabamento</span><i />
          <span>Seguradoras</span>
        </div>
        <div className={styles.scrollCue} aria-hidden="true"><span>ROLE PARA DESCOBRIR</span><i /></div>
      </section>

      <div id="conteudo" />

      <section className={styles.manifesto} aria-labelledby="manifesto-title">
        <p className={styles.eyebrow}>RECUPERAÇÃO AUTOMOTIVA</p>
        <h2 id="manifesto-title">
          O reparo pode começar no dano. <em>A experiência termina na confiança.</em>
        </h2>
        <div className={styles.manifestoBottom}>
          <p>
            A Pint Services combina técnica, estrutura e acompanhamento para devolver forma, acabamento e presença ao veículo — com clareza para o cliente do início ao fim.
          </p>
          <div className={styles.manifestoFacts}>
            <span><b>01</b> Funilaria & repintura</span>
            <span><b>02</b> Particular & seguradoras</span>
            <span><b>03</b> Lauro de Freitas · BA</span>
          </div>
        </div>
      </section>

      <section id="processo" className={styles.processSection} aria-labelledby="process-title">
        <div className={styles.processIntro}>
          <div>
            <p className={styles.eyebrow}>DO DANO À ENTREGA</p>
            <h2 id="process-title">O processo vira narrativa.</h2>
          </div>
          <p>
            Cada etapa prepara a seguinte. O scroll acompanha a mesma lógica: entender, recuperar, preparar, pintar, refinar e entregar.
          </p>
        </div>

        <div className={styles.processStory}>
          {processChapters.map((chapter) => (
            <article className={styles.processChapter} key={chapter.number}>
              <div className={styles.processSticky}>
                <div className={`${styles.processMedia} ${styles[chapter.visual]}`} aria-hidden="true" />
                <div className={styles.processOverlay} aria-hidden="true" />
                <div className={styles.processCounter} aria-hidden="true">
                  <span>{chapter.number}</span><small>/ 06</small>
                </div>
                <div className={styles.processCopy}>
                  <p>{chapter.kicker}</p>
                  <h3>{chapter.title}</h3>
                  <span>{chapter.text}</span>
                </div>
                <div className={styles.processRail} aria-hidden="true"><i /></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="servicos" className={styles.servicesSection} aria-labelledby="services-title">
        <div className={styles.servicesTitleRow}>
          <p className={styles.eyebrow}>SERVIÇOS</p>
          <h2 id="services-title">Grandes cenas. Um mesmo padrão de cuidado.</h2>
          <p>
            Cada serviço ganha espaço para ser entendido como parte da experiência completa de recuperação, sem transformar a página em um catálogo de cards.
          </p>
        </div>

        <div className={styles.servicesStack}>
          {services.map((service) => (
            <article className={`${styles.serviceFeature} ${service.reverse ? styles.serviceReverse : ''}`} key={service.index}>
              <div className={`${styles.serviceMedia} ${styles[service.visual]}`} aria-hidden="true" />
              <div className={styles.serviceCopy}>
                <span className={styles.serviceIndex}>{service.index}</span>
                <p>{service.eyebrow}</p>
                <h3>{service.title}</h3>
                <span>{service.text}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.resultSection} aria-labelledby="result-title">
        <div className={styles.resultHeader}>
          <div>
            <p className={styles.eyebrow}>ANTES / DEPOIS</p>
            <h2 id="result-title">O acabamento final precisa falar por si.</h2>
          </div>
          <p>
            A estrutura está pronta para receber casos reais autorizados da Pint. Nesta prévia, as imagens servem apenas para demonstrar o comportamento visual da comparação.
          </p>
        </div>

        <div className={styles.beforeAfter} aria-label="Demonstração visual da área de antes e depois">
          <figure className={styles.beforePane}>
            <div className={styles.beforeImage} aria-hidden="true" />
            <figcaption><span>ANTES</span><small>Imagem demonstrativa</small></figcaption>
          </figure>
          <figure className={styles.afterPane}>
            <div className={styles.afterImage} aria-hidden="true" />
            <figcaption><span>DEPOIS</span><small>Imagem demonstrativa</small></figcaption>
          </figure>
          <div className={styles.compareLine} aria-hidden="true"><i /></div>
        </div>
      </section>

      <section id="diferenciais" className={styles.differentialsSection} aria-labelledby="differentials-title">
        <div className={styles.differentialsIntro}>
          <p className={styles.eyebrow}>ESCOLHA CONFIANÇA</p>
          <h2 id="differentials-title">Quatro coisas que precisam estar certas antes de entregar a chave.</h2>
          <p>
            A comunicação antiga já trazia os pilares certos. Aqui eles entram sem o visual promocional anterior: mais espaço, tipografia e conteúdo direto.
          </p>
        </div>

        <div className={styles.differentialsList}>
          {differentiators.map((item) => (
            <article key={item.number} className={styles.differentialItem}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.insurersSection} aria-labelledby="insurers-title">
        <div className={styles.insurersIntro}>
          <p className={styles.eyebrow}>PARTICULAR & SEGURADORAS</p>
          <h2 id="insurers-title">Teve problema com o carro? A Pint resolve.</h2>
          <p>Atendimento a clientes particulares e todas as seguradoras.</p>
        </div>
        <div className={styles.insurerRail} aria-label="Seguradoras já presentes em materiais da Pint Services">
          {[...insurers, ...insurers].map((insurer, index) => (
            <span key={`${insurer}-${index}`}>{insurer}</span>
          ))}
        </div>
        <small>Marcas listadas com base em materiais institucionais já publicados pela Pint Services.</small>
      </section>

      <section id="contato" className={styles.contactSection} aria-labelledby="contact-title">
        <div className={styles.contactBackdrop} aria-hidden="true" />
        <div className={styles.contactShade} aria-hidden="true" />

        <div className={styles.contactMain}>
          <p className={styles.eyebrow}>FALE COM A PINT</p>
          <h2 id="contact-title">Seu carro.<br /><span>Novo de novo.</span></h2>
          <p>Solicite uma avaliação e converse diretamente com a equipe sobre o serviço que o seu veículo precisa.</p>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.contactCta}>
            Solicitar orçamento no WhatsApp <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className={styles.contactInfo}>
          <div>
            <span>Endereço</span>
            <p>Rua Leonardo R da Silva, Pitangueiras, 480 — Galpão 03<br />Lauro de Freitas · BA · 42701-420</p>
          </div>
          <div>
            <span>Funcionamento</span>
            <p>Segunda a sexta · 08:00–17:00<br />Sábado · 08:00–12:00</p>
          </div>
          <div>
            <span>Contato</span>
            <p><a href="tel:+557135087781">(71) 3508-7781</a><br /><a href="tel:+5571994000097">(71) 99400-0097</a></p>
          </div>
          <div className={styles.contactLinks}>
            <a href="https://www.instagram.com/pintservicescarcenter/" target="_blank" rel="noreferrer">Instagram ↗</a>
            <a href="https://www.google.com/maps/search/?api=1&query=Rua+Leonardo+R+da+Silva+Pitangueiras+480+Lauro+de+Freitas+BA" target="_blank" rel="noreferrer">Como chegar ↗</a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand />
        <p>Especialista em repintura e funilaria automotiva.</p>
        <div>
          <span>pintservices.com.br</span>
          <a href="#top">Voltar ao topo ↑</a>
          <small>Fotografias temporárias de referência: Unsplash.</small>
        </div>
      </footer>
    </main>
  );
}
