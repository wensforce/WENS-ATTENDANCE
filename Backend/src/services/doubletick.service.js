const ENDPOINT = "https://public.doubletick.io/whatsapp/message/template";

const toInternational = (mobile) => {
  const digits = String(mobile ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const sendTemplate = async (to, templateName, placeholders) => {
  const apiKey = process.env.DOUBLETICK_API_KEY;
  const from = process.env.DOUBLETICK_FROM;

  if (!apiKey || !from) {
    console.error("[doubletick] API key or sender number is missing");
    return;
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            from: toInternational(from),
            to: toInternational(to),
            content: {
              templateName,
              language: "en",
              templateData: {
                body: {
                  placeholders,
                },
              },
            },
          },
        ],
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[doubletick] send failed", response.status, body);
      return;
    }

    console.log("[doubletick] sent", body);
  } catch (err) {
    console.error("[doubletick] request error", err);
  }
};