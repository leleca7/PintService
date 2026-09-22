import styles from './site.module.css';

export default function Loading() {
  return (
    <main className={styles.siteLoading} aria-live="polite" aria-busy="true">
      <div className={styles.siteLoadingInner}>
        <div className={styles.siteLoadingMark}>PINT</div>
        <p className={styles.siteLoadingText}>Pint Services · Car Center</p>
      </div>
    </main>
  );
}
