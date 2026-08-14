import prisma from "../../lib/prisma.js";

async function sendWebhooks(event, payload) {
  const hooks = await prisma.webhook.findMany({ where: { eventType: event } });

  for (const hook of hooks) {
    fireWebhook(hook, event, payload); // fire and forget, don't block response
  }
}

async function fireWebhook(hook, event, payload, attempt = 1) {
  const body = JSON.stringify({ event, data: payload, timestamp: Date.now() });
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    console.log(
      `Webhook sent to ${hook.url} for event ${event}, attempt ${attempt}, body: ${body}, status: ${res.status}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    if (attempt < 3) {
      setTimeout(
        () => fireWebhook(hook, event, payload, attempt + 1),
        attempt * 5000,
      );
    } else {
      console.error(`Webhook failed permanently: ${hook.url}`, err.message);
    }
  }
}

export { sendWebhooks };
