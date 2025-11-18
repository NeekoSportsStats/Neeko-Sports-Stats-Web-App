import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting map (IP -> array of timestamps)
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 5;
const HOUR_IN_MS = 3600000;

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
}

// HTML escape function to prevent XSS attacks
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const now = Date.now();
    const hourAgo = now - HOUR_IN_MS;

    // Clean up old timestamps and get recent requests
    const recentRequests = (rateLimitMap.get(clientIp) || [])
      .filter(timestamp => timestamp > hourAgo);

    if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Record this request
    recentRequests.push(now);
    rateLimitMap.set(clientIp, recentRequests);

    const { name, email, message }: ContactEmailRequest = await req.json();

    // Validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (name.length > 100 || email.length > 255 || message.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Field length exceeds maximum allowed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to Neeko
    const emailResponse = await resend.emails.send({
      from: "Neeko Sports Stats <onboarding@resend.dev>",
      to: ["Neekotrading@gmail.com"],
      replyTo: email,
      subject: `Contact Form: Message from ${escapeHtml(name)}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    // Log detailed error server-side only
    console.error("Error in send-contact-email function:", error);
    
    // Return generic error to client (security best practice)
    return new Response(
      JSON.stringify({ 
        error: "Failed to send message. Please try again later."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
