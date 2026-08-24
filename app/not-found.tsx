import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card"><div className="vehicle-big-icon">PS</div><p className="eyebrow">NÃO ENCONTRADO</p><h1>Esse veículo não está disponível.</h1><p>Ele pode ter sido removido ou o endereço pode estar incorreto.</p><Link className="primary action-link" href="/veiculos">Voltar para veículos</Link></div>
    </main>
  );
}
