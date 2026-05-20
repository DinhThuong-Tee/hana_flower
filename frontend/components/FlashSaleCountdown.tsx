import { useState, useEffect } from "react";

export default function FlashSaleCountdown({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState<{ h: string; m: string; s: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endTime).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(null);
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, "0");
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0");
      const s = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, "0");

      setTimeLeft({ h, m, s });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) return <span className="text-xs uppercase tracking-widest text-ink/40">Flash Sale kết thúc</span>;

  return (
    <div className="flex items-center space-x-2 font-mono tabular-nums">
      <div className="bg-primary text-white px-2 py-1 rounded text-sm font-bold">{timeLeft.h}</div>
      <span className="text-primary font-bold">:</span>
      <div className="bg-primary text-white px-2 py-1 rounded text-sm font-bold">{timeLeft.m}</div>
      <span className="text-primary font-bold">:</span>
      <div className="bg-primary text-white px-2 py-1 rounded text-sm font-bold">{timeLeft.s}</div>
    </div>
  );
}
