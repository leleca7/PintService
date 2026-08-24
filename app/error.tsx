'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="loading-page">
      <div className="loading-card error-card">
        <div className="brand-mark">!</div>
        <div><p className="eyebrow">PINTSERVICE</p><h1>Não foi possível carregar esta tela.</h1><p>Os dados não foram alterados. Tente carregar novamente.</p><button className="primary retry-button" onClick={() => reset()}>Tentar novamente</button></div>
      </div>
    </main>
  );
}
