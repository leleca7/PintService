export default function Loading() {
  return (
    <main className="loading-page" aria-live="polite" aria-busy="true">
      <div className="loading-card">
        <div className="brand-mark">PS</div>
        <div><p className="eyebrow">PINTSERVICE</p><h1>Carregando operação...</h1><p>Buscando veículos, conversas e tarefas.</p></div>
      </div>
    </main>
  );
}
