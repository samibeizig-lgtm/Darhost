'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function Loader() {
  const [visible, setVisible] = useState(false);
  const clickTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide after navigation, but always show for at least 500ms
  useEffect(() => {
    if (!visible) return;
    const elapsed = Date.now() - clickTime.current;
    const remaining = Math.max(0, 500 - elapsed);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
      if (anchor.target === '_blank') return;
      clickTime.current = Date.now();
      setVisible(true);
    }
    // Also catch button-triggered router.push via a custom event
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-gray-100">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-[#0F4C8A] inline-block"
            style={{
              animation: 'navdot 0.65s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function NavigationLoader() {
  return (
    <Suspense>
      <Loader />
    </Suspense>
  );
}
