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
      { threshold: 0.1, rootMargin: '0px 0px -4% 0px' },
    );
    revealItems.forEach((el) => observer.observe(el));

    const processItems = Array.from(document.querySelectorAll<HTMLElement>('[data-process-step]'));
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 1;
      const scrollTop = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewport);
      root.style.setProperty('--page-progress', String(scrollTop / maxScroll));

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

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return null;
}
