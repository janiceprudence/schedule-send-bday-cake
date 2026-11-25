"use client";

import { useMemo, useRef, useState } from "react";

const frostingColors = [
  { name: "Strawberry", value: "#f5a6bf" },
  { name: "Vanilla", value: "#fff0c9" },
  { name: "Lavender", value: "#c9b8ef" },
  { name: "Mint", value: "#b9dfc8" },
];
const cakeColors = [
  { name: "Berry", value: "#f2bdd0" },
  { name: "Cream", value: "#f4dfb8" },
  { name: "Blueberry", value: "#c5d3f3" },
  { name: "Pistachio", value: "#d0dfb5" },
];
const toppings = ["🍓", "🍒", "⭐", "🤍", "🕯️", "🐰"];

function dateLocal(days = 1) {
  const date = new Date(Date.now() + days * 86400000);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const panels = Array.from({ length: 48 }, (_, index) => {
  const angle = index * 7.5;
  const shade = 10 - 10 * Math.cos((angle + 35) * Math.PI / 180);
  return {
    transform: `rotateY(${angle}deg) translateZ(84px)`,
    background: `color-mix(in srgb, var(--cake), #704252 ${shade}%)`,
  };
});

type CakePreviewProps = {
  frosting: string;
  cakeColor: string;
  inscription: string;
  toppings: string[];
};

function CakePreview({ frosting, cakeColor, inscription, toppings }: CakePreviewProps) {
  const [view, setView] = useState({ yaw: 0, pitch: -27 });
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  function orbit(x: number, y: number) {
    setView(({ yaw, pitch }) => ({
      yaw: (yaw + x) % 360,
      pitch: Math.max(-85, Math.min(-4, pitch + y)),
    }));
  }

  return (
    <div
      className="cake-stage"
      role="group"
      tabIndex={0}
      aria-label="Interactive birthday cake preview"
      aria-describedby="cake-preview-hint"
      style={{ "--cake": cakeColor, "--frosting": frosting } as React.CSSProperties}
      onPointerDown={(event) => {
        if (event.button !== 0 || drag.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        const previous = drag.current;
        if (previous?.id !== event.pointerId) return;
        orbit((event.clientX - previous.x) * 0.7, (event.clientY - previous.y) * 0.45);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }}
      onLostPointerCapture={(event) => {
        if (drag.current?.id === event.pointerId) drag.current = null;
      }}
      onKeyDown={(event) => {
        switch (event.key) {
          case "ArrowLeft": orbit(-12, 0); break;
          case "ArrowRight": orbit(12, 0); break;
          case "ArrowUp": orbit(0, -8); break;
          case "ArrowDown": orbit(0, 8); break;
          case "Home": setView({ yaw: 0, pitch: -27 }); break;
          default: return;
        }
        event.preventDefault();
      }}
    >
      <div className="cake-camera" aria-hidden="true">
        <div className="cake-model" style={{ transform: `rotateX(${view.pitch}deg) rotateY(${view.yaw}deg)` }}>
          <div className="cake-plate" />
          {panels.map((style, index) => (
            <div className="cake-panel" key={index} style={style}>
              {index % 4 === 0 && <span className="cake-drip" />}
              {index % 6 === 0 && <span className="cake-star">&#10022;</span>}
            </div>
          ))}
          <div className="cake-surface">
            <div className="cake-inscription">{inscription || "your message"}</div>
            {toppings.map((item, index) => {
              const angle = index * 360 / toppings.length;
              return <span className="cake-decoration" key={item} style={{
                transform: `rotate(${angle}deg) translateY(-60px) rotate(${-angle}deg)`,
              }}>{item}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Home() {
  const [frosting, setFrosting] = useState(frostingColors[0].value);
  const [cakeColor, setCakeColor] = useState(cakeColors[0].value);
  const [selectedToppings, setSelectedToppings] = useState(["🍓", "🍒", "⭐", "🤍", "🕯️"]);
  const [inscription, setInscription] = useState("Happy birthday!");
  const [recipient, setRecipient] = useState("");
  const [deliveryAt, setDeliveryAt] = useState(dateLocal());
  const [note, setNote] = useState("Wishing you the sweetest day!");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);

  const maxDate = useMemo(() => dateLocal(30), []);
  const previewToppings = selectedToppings.slice(0, 7);

  function toggleTopping(item: string) {
    setSelectedToppings((current) => current.includes(item) ? current.filter((x) => x !== item) : [...current, item]);
  }

  async function schedule() {
    setBusy(true);
    setError(false);
    setStatus("");
    try {
      const response = await fetch("/api/schedule-cake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, deliveryAt, note, inscription, frosting, cakeColor, toppings: selectedToppings }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : "";
        throw new Error(message || "Could not schedule the cake email.");
      }
      setStatus(`Cake scheduled for ${new Date(deliveryAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} ✨`);
      setConfirming(false);
    } catch (caught) {
      setError(true);
      setStatus(caught instanceof Error ? caught.message : "Could not schedule the cake email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bakery-page">
      <div className="sparkle sparkle-one">✦</div><div className="sparkle sparkle-two">✧</div><div className="sparkle sparkle-three">✦</div>
      <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">♡</span> Bailey&apos;s Cake Mail</a><span className="top-note">made with frosting & feelings</span></header>
      <section className="hero" id="top">
        <div className="eyebrow"><span>✿</span> THE LITTLE BIRTHDAY BAKERY <span>✿</span></div>
        <h1>Make a cake.<br/><em>Send a little love.</em></h1>
        <p>Decorate a tiny birthday masterpiece, then schedule it to land in someone&apos;s inbox on their big day.</p>
      </section>

      <section className="studio" aria-label="Cake designer">
        <div className="studio-heading"><div><span className="step">01 — YOUR CAKE</span><h2>Decorate the good stuff</h2></div><span className="tiny-stamp">♡ baked<br/>for you ♡</span></div>
        <div className="design-grid">
          <div className="preview-wrap">
            <div className="preview-label">YOUR CAKE PREVIEW <span>✦</span></div>
            <CakePreview frosting={frosting} cakeColor={cakeColor} inscription={inscription} toppings={previewToppings} />
            <p className="preview-hint" id="cake-preview-hint">Drag or use arrow keys to rotate the cake. Press Home to reset.</p>
          </div>

          <div className="controls">
            <div className="control-group"><label className="control-title">Cake color</label><div className="swatches">{cakeColors.map((item) => <button key={item.value} className={`swatch ${cakeColor === item.value ? "selected" : ""}`} style={{ background: item.value }} aria-label={item.name} title={item.name} onClick={() => setCakeColor(item.value)} />)}</div></div>
            <div className="control-group"><label className="control-title">Frosting</label><div className="swatches">{frostingColors.map((item) => <button key={item.value} className={`swatch ${frosting === item.value ? "selected" : ""}`} style={{ background: item.value }} aria-label={item.name} title={item.name} onClick={() => setFrosting(item.value)} />)}</div></div>
            <div className="control-group"><label className="control-title">Sprinkle on some joy</label><div className="topping-list">{toppings.map((item) => <button key={item} className={`topping ${selectedToppings.includes(item) ? "picked" : ""}`} onClick={() => toggleTopping(item)} aria-pressed={selectedToppings.includes(item)}>{item}</button>)}</div></div>
            <div className="control-group"><label className="control-title" htmlFor="inscription">Cake message <span className="limit">{inscription.length}/32</span></label><input id="inscription" className="field" maxLength={32} value={inscription} onChange={(e) => setInscription(e.target.value)} placeholder="Happy birthday!" /></div>
            <div className="mini-note">♡ <span>Your cake can be sweet. Your message can be unhinged.</span></div>
          </div>
        </div>
      </section>

      <section className="send-card">
        <div className="send-copy"><span className="step">02 — SEND ON THE BIG DAY</span><h2>Put a little cake<br/>in their inbox</h2><p>Pick who it&apos;s for and when it should arrive. We&apos;ll handle the digital sprinkles.</p><div className="mail-doodle">✉ <span>delivered with love</span></div></div>
        <form className="send-form" onSubmit={(e) => { e.preventDefault(); setStatus(""); setError(false); setConfirming(true); }}>
          <label htmlFor="recipient">Their email</label><input id="recipient" className="field" type="email" required maxLength={254} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="friend@example.com" />
          <label htmlFor="delivery">Birthday delivery date & time</label><input id="delivery" className="field" type="datetime-local" required min={dateLocal(0)} max={maxDate} value={deliveryAt} onChange={(e) => setDeliveryAt(e.target.value)} /><small className="field-hint">Uses your local time · schedule up to 30 days ahead.</small>
          <label htmlFor="note">Your note</label><textarea id="note" className="field textarea" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write something lovely..." />
          <button className="send-button" type="submit">Review your cake <span>♡</span></button>
          <p className="privacy-note">Their email is only used to deliver this cake.</p>
        </form>
      </section>

      {status && <div className={`status ${error ? "error" : "success"}`} role="status">{status}</div>}
      <footer>BAILEY&apos;S LITTLE BAKERY <span>·</span> a tiny treat for a big day</footer>

      {confirming && <div className="modal-backdrop" role="presentation" onClick={() => !busy && setConfirming(false)}><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}><div className="modal-icon">🎂</div><span className="step">ONE LAST LOOK</span><h2 id="confirm-title">Ready to send this sweet thing?</h2><p>Your cake will be emailed to <strong>{recipient}</strong> on <strong>{new Date(deliveryAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</strong>.</p><div className="confirm-message">“{note || "A birthday cake, just for you!"}”</div><div className="modal-actions"><button className="secondary-button" onClick={() => setConfirming(false)} disabled={busy}>Keep decorating</button><button className="send-button" onClick={schedule} disabled={busy}>{busy ? "Scheduling…" : "Schedule the cake ♡"}</button></div><small>By scheduling, you confirm this recipient and delivery time.</small></section></div>}
    </main>
  );
}
