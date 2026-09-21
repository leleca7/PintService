import core from '@/app/components/precision-atelier-core.module.css';
import admin from '@/app/components/precision-atelier-admin.module.css';
import { resetSiteMedia, updateSiteMedia } from './actions';

type MediaMeta = {
  nome_arquivo?: unknown;
  mime?: unknown;
  atualizado_em?: unknown;
} | null;

type Props = {
  state: {
    processo: boolean;
    resultado: boolean;
    processoMeta: MediaMeta;
    resultadoMeta: MediaMeta;
  };
};

export default function SiteMediaSettings({state}:Props){
  const items=[
    {
      slot:'processo',
      title:'Processo real',
      description:'Trecho curto de cabine, preparação ou pintura. Aparece junto da seção Como funciona.',
      active:state.processo,
      meta:state.processoMeta,
    },
    {
      slot:'resultado',
      title:'Resultado real',
      description:'Antes, processo e resultado final de um veículo. Aparece como prova visual depois dos serviços.',
      active:state.resultado,
      meta:state.resultadoMeta,
    },
  ] as const;

  return (
    <section className={core.section}>
      <div className={core.sectionHead}>
        <div><p>VÍDEOS DO SITE</p><h2>Conteúdo real da oficina</h2></div>
        <span className={core.count}>{Number(state.processo)+Number(state.resultado)}/2</span>
      </div>

      <div className={admin.infoGrid}>
        {items.map((item)=>(
          <article className={admin.infoCard} key={item.slot}>
            <p>{item.active?'ATIVO NO SITE':'AGUARDANDO VÍDEO'}</p>
            <h2>{item.title}</h2>
            <p>{item.description}</p>

            {item.active ? (
              <video
                src={`/api/site/media/${item.slot}`}
                muted
                playsInline
                controls
                preload="metadata"
                style={{marginTop:14,width:'100%',maxHeight:310,objectFit:'cover',background:'#090a0b',borderRadius:12}}
              />
            ) : null}

            <form action={updateSiteMedia} encType="multipart/form-data" style={{display:'grid',gap:10,marginTop:16}}>
              <input type="hidden" name="slot" value={item.slot}/>
              <input
                type="file"
                name="media"
                accept="video/mp4,video/webm"
                required
                style={{padding:10,border:'1px solid var(--line,#d9dde3)',borderRadius:10}}
              />
              <small>MP4 ou WEBM · até 8 MB. Recomendado: 5–10 s, sem áudio, vertical e comprimido.</small>
              {item.meta?.nome_arquivo ? <small>Atual: {String(item.meta.nome_arquivo)}</small> : null}
              <div><button className={core.button} type="submit">{item.active?'Substituir vídeo':'Salvar vídeo'}</button></div>
            </form>

            {item.active ? (
              <form action={resetSiteMedia} style={{marginTop:10}}>
                <input type="hidden" name="slot" value={item.slot}/>
                <button className={core.button} type="submit">Remover do site</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
