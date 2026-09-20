'use client';

import { useEffect } from 'react';

export default function SiteMotion() {
  useEffect(() => {
    const root = document.documentElement;
        const revealItems = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.visible = 'true';
          observer.unobserve(el);
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );
    revealItems.forEach((el) => observer.observe(el));

    const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    const processItems = Array.from(document.querySelectorAll<HTMLElement>('[data-process-step]'));
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      const scrollTop = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewport);
      root.style.setProperty('--page-progress', String(scrollTop / maxScroll));

      for (const el of parallaxItems) {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const normalized = (center - viewport / 2) / viewport;
        const speed = Number(el.dataset.parallax || '0.08');
        const move = Math.max(-90, Math.min(90, -normalized * viewport * speed));
        el.style.setProperty('--parallax-y', `${move.toFixed(2)}px`);
      }

      let best: HTMLElement | null = null;
      let bestDistance = Infinity;
      for (const el of processItems) {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewport * 0.5);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = el;
        }
      }
      processItems.forEach((el) => { el.dataset.active = el === best ? 'true' : 'false'; });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const tiltItems = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
    const cleanups: Array<() => void> = [];

    for (const el of tiltItems) {
      const move = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--tilt-x', `${(-y * 2.4).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(x * 3.2).toFixed(2)}deg`);
      };
      const leave = () => {
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      });
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
