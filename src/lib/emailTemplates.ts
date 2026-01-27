import crypto from "crypto";
const resetToken = crypto.randomBytes(32).toString("hex");
const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

export const createVerificationEmailTemplate = (
  name: string,
  verificationLink: string,
  logoUrl = "https://cdn-ilajomb.nitrocdn.com/gWJKpISSLBBlydPBhhjanjBqpwDoDDew/assets/images/optimized/rev-4f4120a/council.science/wp-content/uploads/2023/03/image-6.png"
) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;
};