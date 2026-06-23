const nodemailer = require('nodemailer');

const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'myselfiqraali08@gmail.com';

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendContactEmail({ firstName, lastName, company, email, country, phoneNumber, message }) {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error(
      'Email service is not configured. Set SMTP_USER and SMTP_PASS in the backend environment.'
    );
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;
  const fullName = `${firstName} ${lastName}`.trim();

  const text = [
    'New contact form submission from AIgenie',
    '',
    `Name: ${fullName}`,
    `Email: ${email}`,
    company ? `Company: ${company}` : null,
    country ? `Country: ${country}` : null,
    phoneNumber ? `Phone: ${phoneNumber}` : null,
    '',
    'Message:',
    message,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <h2>New contact form submission from AIgenie</h2>
    <p><strong>Name:</strong> ${fullName}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
    ${country ? `<p><strong>Country:</strong> ${country}</p>` : ''}
    ${phoneNumber ? `<p><strong>Phone:</strong> ${phoneNumber}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  await transporter.sendMail({
    from: `"AIgenie Contact" <${fromEmail}>`,
    to: CONTACT_TO_EMAIL,
    replyTo: email,
    subject: `AIgenie Contact: ${fullName}`,
    text,
    html,
  });
}

module.exports = { sendContactEmail, CONTACT_TO_EMAIL };
