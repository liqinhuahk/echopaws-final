import { NextResponse } from 'next/server';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail =
      process.env.CONTACT_FROM_EMAIL || 'EchoPaws Contact <onboarding@resend.dev>';

    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Missing RESEND_API_KEY' },
        { status: 500 }
      );
    }

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Missing CONTACT_TO_EMAIL' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All contact fields are required.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (name.length > 80 || email.length > 120 || subject.length > 140 || message.length > 4000) {
      return NextResponse.json(
        { error: 'One or more fields exceed the allowed length.' },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replaceAll('\n', '<br />');

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; background:#0b0706; color:#f8efe8; padding:24px;">
        <div style="max-width:720px; margin:0 auto; background:linear-gradient(180deg, rgba(19,10,8,0.96), rgba(11,6,5,0.96)); border:1px solid rgba(255,233,220,0.12); border-radius:20px; padding:24px;">
          <div style="font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#efc39e; margin-bottom:12px;">
            EchoPaws Contact Form
          </div>
          <h1 style="margin:0 0 18px; font-size:28px; line-height:1.1; color:#fff7f1;">
            New contact message received
          </h1>

          <div style="display:grid; gap:12px; margin-bottom:20px;">
            <div><strong>Name:</strong> ${safeName}</div>
            <div><strong>Email:</strong> ${safeEmail}</div>
            <div><strong>Subject:</strong> ${safeSubject}</div>
          </div>

          <div style="padding:16px; border-radius:16px; border:1px solid rgba(255,233,220,0.12); background:rgba(255,255,255,0.03);">
            <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#efc39e; margin-bottom:10px;">
              Message
            </div>
            <div style="font-size:14px; line-height:1.8; color:#f8efe8;">
              ${safeMessage}
            </div>
          </div>
        </div>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `EchoPaws Contact: ${subject}`,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return NextResponse.json(
        {
          error:
            resendData?.message ||
            resendData?.error?.message ||
            'Failed to send email via Resend.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: resendData?.id || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown contact form error',
      },
      { status: 500 }
    );
  }
}
