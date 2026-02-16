import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resend = getResendClient();
  const appUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Live Story <noreply@lifestory.app>',
    to: email,
    subject: 'Reset Your Password - Live Story',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f766e; margin: 0;">Live Story</h1>
          </div>

          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1e293b;">Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetLink}</p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send email');
  }

  return true;
}
