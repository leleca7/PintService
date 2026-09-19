import Link from 'next/link';
import AppShell from '@/app/components/app-shell';
import styles from '@/app/components/precision-atelier-core.module.css';
import ScannerClient from './scanner-client';

export default function PartsScanPage() {
  return <AppShell active="operacao" source="live">
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.kicker}>PEÇAS · LEITURA RÁPIDA</p>
          <h1 className={styles.title}>Escanear peça</h1>
          <p className={styles.subtitle}>Leia a etiqueta/código, confira o veículo e registre o recebimento sem procurar manualmente o pedido.</p>
        </div>
        <Link className={styles.button} href="/operacao/pecas">Voltar às peças</Link>
      </header>
      <section className={styles.section}>
        <ScannerClient/>
      </section>
    </div>
  </AppShell>;
}
