const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: "Method Not Allowed",
      }),
    };
  }

  try {
    const { name, email, phone, message } = JSON.parse(event.body);

    // Save to Supabase
    const { error } = await supabase
      .from("contacts")
      .insert([
        {
          name,
          email,
          phone,
          message,
        },
      ]);

    if (error) {
      console.error(error);

      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Failed to save data to database.",
        }),
      };
    }

    // Send email to yourself
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "📩 New Portfolio Contact",
      html: `
        <h2>New Contact Form Submission</h2>

        <p><strong>Name:</strong> ${name}</p>

        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Phone:</strong> ${phone}</p>

        <p><strong>Message:</strong></p>

        <p>${message}</p>
      `,
    });

    // Auto reply to visitor
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting me",
      html: `
        <h2>Hello ${name},</h2>

        <p>Thank you for contacting me through my portfolio website.</p>

        <p>I have received your message and will reply as soon as possible.</p>

        <br>

        <p>Regards,</p>

        <strong>Manchala Madhan</strong>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Message sent successfully!",
      }),
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: err.message,
      }),
    };
  }
};