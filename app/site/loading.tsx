export default function SiteLoading() {
  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        background: '#060707',
        color: '#f7f7f4',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div style={{ display: 'grid', justifyItems: 'center', gap: 20 }}>
        <img
          src="/pint-services-logo.webp"
          alt="Pint Services Car Center"
          width={360}
          height={100}
          style={{ width: 'min(240px, 64vw)', height: 'auto', display: 'block' }}
        />
        <span
          style={{
            color: '#BD9558',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '.2em',
          }}
        >
          CARREGANDO EXPERIÊNCIA
        </span>
      </div>
    </main>
  );
}
