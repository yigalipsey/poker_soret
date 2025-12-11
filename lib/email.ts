import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const DEFAULT_ADMIN_EMAIL = "yigalipsey1996@gmail.com"; // fallback אם אין מייל במסד נתונים
const URL_PRODUCTION =
  process.env.URL_PRODUCTION || "https://poker-soret-rn26.vercel.app";

// יצירת transporter לשליחת מיילים
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendBuyInRequestEmail(
  userName: string,
  amount: number,
  adminEmail?: string
) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("Email credentials not configured");
    console.error(
      `[sendBuyInRequestEmail] EMAIL_USER: ${
        EMAIL_USER ? "SET" : "NOT SET"
      }, EMAIL_PASS: ${EMAIL_PASS ? "SET" : "NOT SET"}`
    );
    return;
  }

  // שימוש במייל מהמסד נתונים רק אם הוא מוגדר ולא ריק
  // אם אין מייל מוגדר במסד הנתונים, נשתמש ב-DEFAULT רק כ-fallback
  // אבל אם המשתמש הגדיר מייל במסד הנתונים, נשתמש בו בלבד
  let recipientEmail: string | null = null;

  if (adminEmail && adminEmail.trim() !== "") {
    // יש מייל מוגדר במסד הנתונים - נשתמש בו
    recipientEmail = adminEmail.trim();
  } else {
    // אין מייל מוגדר - נשתמש ב-DEFAULT כ-fallback
    recipientEmail = DEFAULT_ADMIN_EMAIL;
  }

  console.log(
    `[sendBuyInRequestEmail] Admin email from DB: ${
      adminEmail || "undefined"
    }, Using: ${recipientEmail}`
  );
  console.log(`[sendBuyInRequestEmail] Email config check:`, {
    EMAIL_USER: EMAIL_USER ? `${EMAIL_USER.substring(0, 3)}***` : "NOT SET",
    EMAIL_PASS: EMAIL_PASS ? "SET" : "NOT SET",
  });

  if (!recipientEmail) {
    console.log("No admin email configured, skipping email send");
    return;
  }

  try {
    // בדיקת תקינות ה-transporter
    try {
      await transporter.verify();
      console.log(`[sendBuyInRequestEmail] Transporter verified successfully`);
    } catch (verifyError: any) {
      console.error(
        `[sendBuyInRequestEmail] Transporter verification failed:`,
        {
          message: verifyError?.message,
          code: verifyError?.code,
        }
      );
      // נמשיך לנסות לשלוח למרות שגיאת verify
    }

    const shekelsAmount = (amount / 100).toFixed(2);
    const formattedAmount = amount.toLocaleString("he-IL");
    const adminUrl = `${URL_PRODUCTION}/admin/games`;

    const mailOptions = {
      from: EMAIL_USER,
      to: recipientEmail,
      subject: `בקשה חדשה לכניסה למשחק - ${userName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981; margin-bottom: 20px;">בקשה חדשה לכניסה למשחק</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #10b981;">
            <p style="margin: 10px 0; font-size: 16px;"><strong>שם המשתמש:</strong> ${userName}</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>סכום מבוקש:</strong> ${formattedAmount} זיטונים (₪${shekelsAmount})</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>תאריך ושעה:</strong> ${new Date().toLocaleString(
              "he-IL"
            )}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              לפתיחת דף הניהול
            </a>
          </div>
          <p style="color: #6b7280; text-align: center; margin-top: 20px; font-size: 14px;">
            או העתק את הקישור: <a href="${adminUrl}" style="color: #10b981;">${adminUrl}</a>
          </p>
        </div>
      `,
      text: `
בקשה חדשה לכניסה למשחק

שם המשתמש: ${userName}
סכום מבוקש: ${formattedAmount} זיטונים (₪${shekelsAmount})
תאריך ושעה: ${new Date().toLocaleString("he-IL")}

לפתיחת דף הניהול: ${adminUrl}

נא לבדוק את הבקשה במערכת הניהול.
      `,
    };

    console.log(`[sendBuyInRequestEmail] Attempting to send email:`, {
      from: EMAIL_USER,
      to: recipientEmail,
      subject: `בקשה חדשה לכניסה למשחק - ${userName}`,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent successfully to ${recipientEmail} for buy-in request from ${userName}`
    );
    console.log(`[sendBuyInRequestEmail] Email result:`, {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response,
      pending: result.pending,
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    console.error(`[sendBuyInRequestEmail] Error details:`, {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      responseCode: error?.responseCode,
    });
    // לא נזרוק שגיאה כדי לא לעצור את תהליך הבקשה
  }
}

export async function sendDepositRequestEmail(
  userName: string,
  amountInShekels: number,
  requestId: string,
  adminEmail?: string
) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("Email credentials not configured");
    return;
  }

  let recipientEmail: string | null = null;

  if (adminEmail && adminEmail.trim() !== "") {
    recipientEmail = adminEmail.trim();
  } else {
    recipientEmail = DEFAULT_ADMIN_EMAIL;
  }

  if (!recipientEmail) {
    console.log("No admin email configured, skipping email send");
    return;
  }

  try {
    const approveUrl = `${URL_PRODUCTION}/admin/bankroll`;
    const formattedAmount = amountInShekels.toLocaleString("he-IL");

    const mailOptions = {
      from: EMAIL_USER,
      to: recipientEmail,
      subject: `בקשה חדשה לטעינת כסף לקופה - ${userName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6; margin-bottom: 20px;">בקשה חדשה לטעינת כסף לקופה</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #8b5cf6;">
            <p style="margin: 10px 0; font-size: 16px;"><strong>שם המשתמש:</strong> ${userName}</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>סכום מבוקש:</strong> ₪${formattedAmount}</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>תאריך ושעה:</strong> ${new Date().toLocaleString(
              "he-IL"
            )}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${approveUrl}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              לפתיחת דף ניהול הקופה
            </a>
          </div>
          <p style="color: #6b7280; text-align: center; margin-top: 20px; font-size: 14px;">
            או העתק את הקישור: <a href="${approveUrl}" style="color: #8b5cf6;">${approveUrl}</a>
          </p>
          <p style="color: #6b7280; text-align: center; margin-top: 10px; font-size: 12px;">
            בדף ניהול הקופה תוכל לראות את כל הבקשות הממתינות ולאשר אותן.
          </p>
        </div>
      `,
      text: `
בקשה חדשה לטעינת כסף לקופה

שם המשתמש: ${userName}
סכום מבוקש: ₪${formattedAmount}
תאריך ושעה: ${new Date().toLocaleString("he-IL")}

לאישור הטעינה: ${approveUrl}

נא לאשר את הבקשה דרך הקישור לעיל.
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent successfully to ${recipientEmail} for deposit request from ${userName}`
    );
  } catch (error: any) {
    console.error("Error sending deposit request email:", error);
  }
}

export async function sendJoinGameRequestEmail(
  userName: string,
  amount: number,
  gameId: string,
  adminEmail?: string
) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("Email credentials not configured");
    return;
  }

  let recipientEmail: string | null = null;

  if (adminEmail && adminEmail.trim() !== "") {
    recipientEmail = adminEmail.trim();
  } else {
    recipientEmail = DEFAULT_ADMIN_EMAIL;
  }

  if (!recipientEmail) {
    console.log("No admin email configured, skipping email send");
    return;
  }

  try {
    const adminUrl = `${URL_PRODUCTION}/admin/games`;
    const formattedAmount = amount.toLocaleString("he-IL");
    const shekelsAmount = (amount / 100).toFixed(2);

    const mailOptions = {
      from: EMAIL_USER,
      to: recipientEmail,
      subject: `בקשה חדשה להצטרפות למשחק - ${userName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6; margin-bottom: 20px;">בקשה חדשה להצטרפות למשחק</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #3b82f6;">
            <p style="margin: 10px 0; font-size: 16px;"><strong>שם המשתמש:</strong> ${userName}</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>סכום מבוקש:</strong> ${formattedAmount} זיטונים (₪${shekelsAmount})</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>תאריך ושעה:</strong> ${new Date().toLocaleString(
              "he-IL"
            )}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              לפתיחת דף ניהול המשחקים
            </a>
          </div>
          <p style="color: #6b7280; text-align: center; margin-top: 20px; font-size: 14px;">
            או העתק את הקישור: <a href="${adminUrl}" style="color: #3b82f6;">${adminUrl}</a>
          </p>
          <p style="color: #6b7280; text-align: center; margin-top: 10px; font-size: 12px;">
            בדף ניהול המשחקים תוכל לראות את כל הבקשות הממתינות ולאשר אותן.
          </p>
        </div>
      `,
      text: `
בקשה חדשה להצטרפות למשחק

שם המשתמש: ${userName}
סכום מבוקש: ${formattedAmount} זיטונים (₪${shekelsAmount})
תאריך ושעה: ${new Date().toLocaleString("he-IL")}

לפתיחת דף ניהול המשחקים: ${adminUrl}

נא לבדוק את הבקשה במערכת הניהול.
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent successfully to ${recipientEmail} for join game request from ${userName}`
    );
  } catch (error: any) {
    console.error("Error sending join game request email:", error);
  }
}
