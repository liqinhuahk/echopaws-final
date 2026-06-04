import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const contactToEmail = process.env.CONTACT_TO_EMAIL || gmailUser;

    if (!gmailUser || !gmailAppPassword || !contactToEmail) {
      return NextResponse.json(
        { error: 'Contact email service is not configured.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"EchoPaws Contact" <${gmailUser}>`,
      to: contactToEmail,
      replyTo: email,
      subject: `[EchoPaws Contact] ${subject || 'New message'}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject || '-'}

Message:
${message}
      `,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.7;">
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject || '-')}</p>
          <p><strong>Message:</strong></p>
          <div style="white-space:pre-wrap;border:1px solid #eee;padding:12px;border-radius:8px;">
            ${escapeHtml(message)}
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to send message.',
      },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
