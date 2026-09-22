'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './site-assistant.module.css';

type Step = 'closed' | 'reason' | 'channel' | 'vehicle' | 'ready';

const reasons = [
  'Batida ou amassado',
  'Risco ou pintura',
  'Seguro / sinistro',
  'Outro assunto',
];

const channels = ['Particular', 'Seguradora'];

export default function SiteAssistant({ phone }: { phone: string }) {
  const [step, setStep] = useState<Step>('closed');
  const [reason, setReason] = useState('');
  const [channel, setChannel] = useState('');
  const [vehicle, setVehicle] = useState('');

  const phoneDigits = phone.replace(/\D/g, '');

  useEffect(() => {
    function openFromSite(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest('[data-assistant-open]');
      if (!trigger) return;
      event.preventDefault();
      setStep('reason');
    }

    document.addEventListener('click', openFromSite);
    return () => document.removeEventListener('click', openFromSite);
  }, []);

  const whatsappHref = useMemo(() => {
    const summary = [
      'Olá! Fiz uma triagem inicial pelo site da Pint Services.',
      '',
      `Motivo: ${reason || 'não informado'}`,
      `Atendimento: ${channel || 'não informado'}`,
      `Veículo / observação: ${vehicle.trim() || 'não informado'}`,
      '',
      channel === 'Seguradora'
        ? 'Quero orientação para atendimento pelo seguro e posso enviar fotos da avaria por aqui.'
        : 'Quero orientação para avaliação/orçamento e posso enviar fotos da avaria por aqui.',
    ].join('\n');

    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(summary)}`;
  }, [channel, phoneDigits, reason, vehicle]);

  function reset() {
    setReason('');
    setChannel('');
    setVehicle('');
    setStep('reason');
  }

  return (
    <div id="assistente-pint" className={styles.shell}>
      {step !== 'closed' && (
        <section className={styles.panel} aria-label="Assistente Pint">
          <header className={styles.header}>
            <div className={styles.identity}>
              <span className={styles.avatar} aria-hidden="true">P</span>
              <div>
                <strong>Assistente Pint</strong>
                <small>Triagem inicial</small>
              </div>
            </div>
            <button type="button" className={styles.close} onClick={() => setStep('closed')} aria-label="Fechar assistente">
              ×
            </button>
          </header>

          <div className={styles.body}>
            {step === 'reason' && (
              <>
                <p className={styles.kicker}>1 de 3</p>
                <h2>O que aconteceu com o seu carro?</h2>
                <p className={styles.helper}>Escolha a opção mais próxima. Não precisa saber o nome técnico do serviço.</p>
                <div className={styles.options}>
                  {reasons.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => {
                        setReason(item);
                        setStep('channel');
                      }}
                    >
                      {item}
                      <span>›</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'channel' && (
              <>
                <p className={styles.kicker}>2 de 3</p>
                <h2>Como será o atendimento?</h2>
                <p className={styles.helper}>Isso ajuda o atendimento a entender o fluxo antes de você chegar no WhatsApp.</p>
                <div className={styles.options}>
                  {channels.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => {
                        setChannel(item);
                        setStep('vehicle');
                      }}
                    >
                      {item}
                      <span>›</span>
                    </button>
                  ))}
                </div>
                <button type="button" className={styles.back} onClick={() => setStep('reason')}>Voltar</button>
              </>
            )}

            {step === 'vehicle' && (
              <>
                <p className={styles.kicker}>3 de 3</p>
                <h2>Qual é o veículo?</h2>
                <p className={styles.helper}>Informe modelo e ano. Se for por seguradora, você também pode colocar o nome dela aqui.</p>
                <textarea
                  className={styles.textarea}
                  value={vehicle}
                  onChange={(event) => setVehicle(event.target.value)}
                  placeholder="Ex.: Honda Civic 2022 · Porto Seguro"
                  rows={3}
                />
                <div className={styles.actions}>
                  <button type="button" className={styles.back} onClick={() => setStep('channel')}>Voltar</button>
                  <button type="button" className={styles.next} onClick={() => setStep('ready')}>Continuar</button>
                </div>
              </>
            )}

            {step === 'ready' && (
              <>
                <p className={styles.kicker}>Resumo pronto</p>
                <h2>Agora o atendimento já recebe o contexto.</h2>
                <div className={styles.summary}>
                  <div><span>Motivo</span><strong>{reason}</strong></div>
                  <div><span>Atendimento</span><strong>{channel}</strong></div>
                  <div><span>Veículo</span><strong>{vehicle.trim() || 'Não informado'}</strong></div>
                </div>
                <p className={styles.helper}>
                  Ao continuar, esse resumo vai no primeiro contato do WhatsApp. Depois você pode mandar as fotos da avaria normalmente.
                </p>
                <a className={styles.whatsapp} href={whatsappHref} target="_blank" rel="noreferrer">
                  Continuar no WhatsApp
                  <span>↗</span>
                </a>
                <button type="button" className={styles.restart} onClick={reset}>Refazer triagem</button>
              </>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setStep((current) => current === 'closed' ? 'reason' : 'closed')}
        aria-expanded={step !== 'closed'}
      >
        <span className={styles.launcherIcon} aria-hidden="true">P</span>
        <span>
          <small>ATENDIMENTO</small>
          <strong>Assistente Pint</strong>
        </span>
      </button>
    </div>
  );
}
