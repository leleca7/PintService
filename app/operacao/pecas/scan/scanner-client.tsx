'use client';

import { useEffect, useRef, useState } from 'react';
import { receiveScannedPart } from './actions';

type Item={
  id:string;codigo:string;descricao:string;quantidade:number;recebidas:number;
  numeroPedido:string;fornecedor:string;placa:string;modelo:string;
};

export default function ScannerClient() {
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const [code,setCode]=useState('');
  const [items,setItems]=useState<Item[]>([]);
  const [message,setMessage]=useState('Digite um código ou use a câmera quando disponível.');
  const [camera,setCamera]=useState(false);

  async function lookup(value:string) {
    const clean=value.trim();
    if(!clean) return;
    setCode(clean);
    const response=await fetch('/api/pecas/codigo/'+encodeURIComponent(clean),{cache:'no-store'});
    const data=await response.json();
    setItems(Array.isArray(data.items)?data.items:[]);
    setMessage(data.items?.length?'Código localizado. Confira veículo e peça antes de registrar.':'Nenhum item de pedido encontrado com esse código.');
  }

  useEffect(()=>{
    if(!camera) return;
    let stream:MediaStream|null=null;
    let stopped=false;
    let timer:number|undefined;
    (async()=>{
      try{
        const BarcodeDetectorCtor=(window as any).BarcodeDetector;
        if(!BarcodeDetectorCtor){
          setMessage('Este navegador não oferece leitura automática de código. Use o campo manual.');
          setCamera(false);
          return;
        }
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});
        if(videoRef.current){
          videoRef.current.srcObject=stream;
          await videoRef.current.play();
        }
        const detector=new BarcodeDetectorCtor({formats:['code_128','code_39','ean_13','ean_8','qr_code','data_matrix']});
        const tick=async()=>{
          if(stopped||!videoRef.current) return;
          try{
            const found=await detector.detect(videoRef.current);
            if(found?.[0]?.rawValue){
              await lookup(String(found[0].rawValue));
              setCamera(false);
              return;
            }
          }catch{}
          timer=window.setTimeout(tick,500);
        };
        void tick();
      }catch{
        setMessage('Não consegui abrir a câmera. Use o campo manual.');
        setCamera(false);
      }
    })();
    return()=>{
      stopped=true;
      if(timer) window.clearTimeout(timer);
      stream?.getTracks().forEach(track=>track.stop());
    };
  },[camera]);

  return <div style={{display:'grid',gap:16}}>
    <form onSubmit={(event)=>{event.preventDefault();void lookup(code);}} style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Código da peça / etiqueta" style={{minWidth:260,padding:'12px 14px',border:'1px solid #d9dde3',borderRadius:10}}/>
      <button type="submit" style={{padding:'12px 16px',border:0,borderRadius:10,fontWeight:800,cursor:'pointer'}}>Localizar</button>
      <button type="button" onClick={()=>setCamera(v=>!v)} style={{padding:'12px 16px',border:'1px solid #d9dde3',borderRadius:10,fontWeight:800,cursor:'pointer',background:'transparent'}}>
        {camera?'Fechar câmera':'Ler com câmera'}
      </button>
    </form>
    {camera&&<video ref={videoRef} muted playsInline style={{width:'100%',maxWidth:480,borderRadius:14,background:'#111'}}/>}
    <p style={{margin:0,opacity:.7}}>{message}</p>
    <div style={{display:'grid',gap:10}}>
      {items.map(item=><article key={item.id} style={{border:'1px solid #d9dde3',borderRadius:14,padding:14,display:'grid',gap:8}}>
        <strong>{item.descricao}</strong>
        <span>{item.modelo||'Veículo'} · {item.placa||'sem placa'}</span>
        <small>{item.fornecedor||'Fornecedor não informado'} · Pedido {item.numeroPedido||'sem número'} · Recebidas {item.recebidas}/{item.quantidade}</small>
        <form action={receiveScannedPart}>
          <input type="hidden" name="id" value={item.id}/>
          <button type="submit" disabled={item.recebidas>=item.quantidade} style={{padding:'10px 12px',border:0,borderRadius:10,fontWeight:800,cursor:'pointer'}}>
            {item.recebidas>=item.quantidade?'Recebimento completo':'Confirmar +1 unidade recebida'}
          </button>
        </form>
      </article>)}
    </div>
  </div>;
}
