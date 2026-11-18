/** Sends mail through Resend's HTTP API (no SDK, Workers-compatible). */
export async function sendNotificationEmail(
  env: { RESEND_API_KEY: string; MAIL_FROM: string },
  opts: { subject: string; html: string; to: string; replyTo?: string },
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  return res.json();
}
