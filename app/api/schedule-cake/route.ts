import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const frostingPalette: Record<string, string> = {
  "#f5a6bf": "strawberry pink",
  "#fff0c9": "vanilla cream",
  "#c9b8ef": "lavender",
  "#b9dfc8": "mint",
};
const cakePalette: Record<string, string> = {
  "#f2bdd0": "berry pink",
  "#f4dfb8": "cream",
  "#c5d3f3": "blueberry",
  "#d0dfb5": "pistachio",
};
const toppingOptions = new Set(["🍓", "🍒", "⭐", "🤍", "🕯️", "🐰"]);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

function emailHtml(input: {
  note: string;
  inscription: string;
  frosting: string;
  cakeColor: string;
  toppings: string[];
}) {
  const note = escapeHtml(input.note).replace(/\n/g, "<br>");
  const inscription = escapeHtml(input.inscription || "Happy birthday!");
  const frosting = frostingPalette[input.frosting];
  const cake = cakePalette[input.cakeColor];
  const toppings = input.toppings.map(escapeHtml).join("　");
  return `<!doctype html><html><body style="margin:0;background:#fff7f5;font-family:Arial,sans-serif;color:#59434b"><div style="max-width:560px;margin:28px auto;padding:18px"><div style="background:#fff;border:1px solid #f1d6df;border-radius:24px;overflow:hidden;text-align:center"><div style="padding:30px 24px 8px;background:linear-gradient(135deg,#fff0f5,#fff8e9)"><div style="font-size:13px;letter-spacing:3px;color:#bd668c;font-weight:bold">A LITTLE BIRTHDAY SURPRISE</div><h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:31px;color:#71485a">A cake, just for you ♡</h1><p style="color:#9a7886;font-size:14px">Freshly decorated with extra love</p><div style="height:200px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:20px"><div style="position:relative;width:220px;height:140px;background:${input.cakeColor};border-radius:7px 7px 18px 18px;box-shadow:0 13px 22px #70475024"><div style="position:absolute;top:-32px;left:-4px;width:228px;height:66px;border-radius:50%;background:${input.frosting};border:1px solid #eed8dc;box-shadow:inset 0 5px 8px #fff9"><span style="display:block;margin-top:27px;color:#92536e;font:italic 13px Georgia,serif">${inscription}</span><div style="position:absolute;top:-13px;width:100%;font-size:21px">${toppings}</div></div><div style="position:absolute;top:57px;width:100%;color:#fff9f6;font-size:18px">♡　✦　♡</div><div style="position:absolute;bottom:-24px;left:-40px;width:300px;height:48px;border-radius:50%;background:linear-gradient(#fff,#e5e2e3 56%,#fff 68%);border:1px solid #d5d1d1;z-index:-1"></div></div></div></div><div style="padding:22px 30px 30px"><div style="font-size:35px">🎂</div><p style="font-size:16px;line-height:1.65;margin:9px auto 17px">${note}</p><div style="display:inline-block;padding:10px 16px;border-radius:99px;background:#fff0f5;color:#995979;font-size:12px">${cake} cake · ${frosting} frosting</div><p style="margin:24px 0 0;color:#bd7896;font:italic 13px Georgia,serif">Made with frosting & feelings ♡</p></div></div><p style="text-align:center;color:#ad929b;font-size:10px">A digital birthday cake from Bailey&apos;s Cake Mail</p></div></body></html>`;
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ message: "Please sign in before scheduling a cake." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ message: "Please check the cake details and try again." }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ message: "Please check the cake details and try again." }, { status: 400 });
  const data = body as Record<string, unknown>;
  const recipient = typeof data.recipient === "string" ? data.recipient.trim() : "";
  const deliveryAt = typeof data.deliveryAt === "string" ? new Date(data.deliveryAt) : new Date(NaN);
  const note = typeof data.note === "string" ? data.note.trim() : "";
  const inscription = typeof data.inscription === "string" ? data.inscription.trim().slice(0, 32) : "Happy birthday!";
  const frosting = typeof data.frosting === "string" && frostingPalette[data.frosting] ? data.frosting : "#f5a6bf";
  const cakeColor = typeof data.cakeColor === "string" && cakePalette[data.cakeColor] ? data.cakeColor : "#f2bdd0";
  const toppings = Array.isArray(data.toppings) ? data.toppings.filter((item): item is string => typeof item === "string" && toppingOptions.has(item)).slice(0, 7) : [];
  if (recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  if (note.length > 500 || !Number.isFinite(deliveryAt.getTime())) return Response.json({ message: "Please check your note and delivery time." }, { status: 400 });
  const now = Date.now();
  if (deliveryAt.getTime() < now + 5 * 60_000) return Response.json({ message: "Choose a delivery time at least 5 minutes from now." }, { status: 400 });
  if (deliveryAt.getTime() > now + 30 * 86400_000) return Response.json({ message: "Cake emails can currently be scheduled up to 30 days ahead. Please choose a closer date." }, { status: 400 });

  const apiKey = env.RESEND_API_KEY;
  const from = env.CAKE_FROM_EMAIL;
  if (!apiKey || !from) return Response.json({ message: "Automatic email delivery is not configured yet. The site owner needs to add a Resend API key and a verified sender address in the site settings." }, { status: 503 });

  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: "A birthday cake just for you ♡",
        html: emailHtml({ note: note || "Wishing you the sweetest day!", inscription, frosting, cakeColor, toppings }),
        scheduled_at: deliveryAt.toISOString(),
      }),
    });
    const resultBody = await result.json().catch(() => ({})) as { id?: string; message?: string };
    if (!result.ok) return Response.json({ message: "The email service could not schedule this cake. Please check the sender setup and try again." }, { status: 502 });
    return Response.json({ id: resultBody.id, scheduledAt: deliveryAt.toISOString() }, { status: 201 });
  } catch {
    return Response.json({ message: "The email service could not be reached. Please try again in a moment." }, { status: 502 });
  }
}
