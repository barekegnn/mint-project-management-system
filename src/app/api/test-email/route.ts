import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const POST = withErrorHandler(async (req: Request) => {
  const startTime = Date.now();
    const { email } = await req.json();

    Logger.info("Testing email configuration:");
    Logger.info("SMTP_HOST:", process.env.SMTP_HOST);
    Logger.info("SMTP_PORT:", process.env.SMTP_PORT);
    Logger.info("SMTP_USER:", process.env.SMTP_USER);
    Logger.info("SMTP_FROM:", process.env.SMTP_FROM);
    Logger.info("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "***SET***" : "NOT SET");

    const testEmailTemplate = `
      <html>
        <body>
          <h1>Test Email</h1>
          <p>This is a test email to verify your email configuration is working.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to: email,
      subject: "Test Email - Project Management System",
      html: testEmailTemplate,
    });

    Logger.info("Email test result:", result);

    if (result.success) {
      return NextResponse.json({ 
        message: "Test email sent successfully!",
        result 
      });
    } else {
      
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json({ 
        error: "Failed to send test email",
        details: result.error 
      }, { status: 500 });
    }

  
}); 