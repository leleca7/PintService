import { ImageResponse } from 'next/og';

export const alt = 'Pint Services Car Center — recuperação automotiva em Lauro de Freitas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '62px 68px',
          background: '#070808',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 430,
            height: 430,
            right: 20,
            top: 80,
            borderRadius: 999,
            background: 'rgba(189,149,88,.12)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 54, height: 54, background: '#bd9558', display: 'flex' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: 25, letterSpacing: -1 }}>Pint Services</strong>
            <span style={{ marginTop: 5, fontSize: 12, letterSpacing: 4, color: '#8f928f' }}>CAR CENTER</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
          <span style={{ color: '#bd9558', fontSize: 17, letterSpacing: 5, fontWeight: 700 }}>
            LAURO DE FREITAS · BAHIA
          </span>
          <div style={{ marginTop: 22, fontSize: 72, lineHeight: .96, letterSpacing: -5, fontWeight: 650, display: 'flex', flexDirection: 'column' }}>
            <span>O reparo termina.</span>
            <span style={{ color: '#e1c18f' }}>O padrão fica.</span>
          </div>
          <div style={{ marginTop: 30, color: '#a5a7a3', fontSize: 22 }}>
            Funilaria · pintura · recuperação automotiva
          </div>
        </div>

        <div style={{ display: 'flex', gap: 30, color: '#676a67', fontSize: 14, letterSpacing: 2 }}>
          <span>SEGURADORAS</span>
          <span>PARTICULARES</span>
          <span>PROCESSO POR ETAPAS</span>
        </div>
      </div>
    ),
    size,
  );
}
