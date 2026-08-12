import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message }: ContactRequest = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, and message are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const cleanName = name.trim().slice(0, 100);
    const cleanEmail = email.trim().slice(0, 255);
    const cleanMessage = message.trim().slice(0, 2000);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
    });

    if (insertError) {
      console.error("contact_submissions insert failed:", insertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to save your message. Please try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailed = false;

    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const to = Deno.env.get("CONTACT_TO_EMAIL") || "hello@metreka.com";
        const from = Deno.env.get("CONTACT_FROM_EMAIL") || "Metreka Contact <onboarding@resend.dev>";

        await resend.emails.send({
          from,
          to: [to],
          replyTo: cleanEmail,
          subject: `New Contact Form Submission from ${cleanName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">New Contact Form Submission</h1>
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
                <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
              </div>
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h3 style="margin-top: 0; color: #333;">Message:</h3>
                <p style="color: #4a5568; white-space: pre-wrap;">${escapeHtml(cleanMessage)}</p>
              </div>
            </div>
          `,
        });
        emailed = true;
      } catch (emailError) {
        // Submission already saved — don't fail the request if outbound email fails
        console.error("Resend send failed:", emailError);
      }
    } else {
      console.warn("RESEND_API_KEY not set; contact saved to contact_submissions only");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: emailed
          ? "Email sent successfully"
          : "Message received. We'll get back to you soon.",
        emailed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
