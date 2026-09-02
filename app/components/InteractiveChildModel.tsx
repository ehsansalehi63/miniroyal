"use client";

import { useEffect, useState } from "react";

const ModelViewer = "model-viewer" as unknown as React.ElementType;

export default function InteractiveChildModel() {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import("@google/model-viewer")
      .then(() => setReady(true))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-[2rem] bg-white/70 p-8 text-center text-sm font-bold text-stone-600">
        <div>
          <p>مدل سه‌بعدی در این مرورگر بارگذاری نشد.</p>
          <p className="mt-2 text-xs font-medium text-stone-500">برای مشاهده، WebGL مرورگر را فعال کنید.</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-[2rem] bg-white/50 text-xs font-bold text-stone-500">
        در حال بارگذاری مدل سه‌بعدی…
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/40 shadow-[0_30px_80px_rgba(54,41,35,.24)]">
      <ModelViewer
        src="/models/miniroyal-child-mannequin.glb"
        alt="مدل سه‌بعدی مانکن کودک مینی رویال"
        camera-controls
        auto-rotate
        rotation-per-second="12deg"
        interaction-prompt="auto"
        shadow-intensity="1"
        shadow-softness="0.8"
        exposure="1.05"
        environment-image="neutral"
        loading="eager"
        reveal="auto"
        style={{ width: "100%", height: "100%", "--poster-color": "transparent" } as React.CSSProperties}
        onError={() => setFailed(true)}
      />
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-[10px] font-black text-stone-700 shadow-lg backdrop-blur">
        برای چرخش لمس کنید یا بکشید
      </div>
    </div>
  );
}
