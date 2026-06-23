// Provider-agnostic notification seam. Wire a real SMS provider (Termii or
// Twilio) here using SMS_API_KEY. Until then, dev logs the message so the OTP
// flow is fully testable without a provider account.

export async function sendSms(to: string, message: string): Promise<void> {
  const apiKey = process.env.SMS_API_KEY;

  if (!apiKey) {
    // Dev / unconfigured: log instead of sending so the flow still works.
    console.log(`[SMS:dev] to=${to} :: ${message}`);
    return;
  }

  // TODO: integrate the chosen provider. Example shape (Termii):
  //   await fetch('https://api.ng.termii.com/api/sms/send', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ api_key: apiKey, to, from: 'Maxbuy', sms: message, channel: 'generic' }),
  //   });
  console.log(`[SMS] (provider not yet wired) to=${to} :: ${message}`);
}
