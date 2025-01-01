import Razorpay from "razorpay";
import crypto from "crypto";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  try {
    const payload = await req.text();  // Get the raw body
    const sigHeader = req.headers.get("X-Razorpay-Signature");  // Get the Razorpay signature from the header

    // Generate the signature from the raw payload and secret
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    // Compare the generated signature with the one sent in the header
    if (generatedSignature !== sigHeader) {
      return new Response(
        JSON.stringify({ error: "Invalid Signature" }),
        { status: 400 }
      );
    }

    const event = JSON.parse(payload);  // Parse the event data

    // Log event for debugging
    console.log("Received Webhook Event: ", event);

    // Handle different events
    switch (event.event) {
      case "subscription.created":
        // Handle new subscription creation
        console.log("New subscription created:", event.payload.subscription);
        break;
      case "payment.captured":
        // Handle successful payment
        console.log("Payment captured:", event.payload.payment.entity);
        break;
      case "payment.failed":
        // Handle failed payment
        console.log("Payment failed:", event.payload.payment.entity);
        break;
      case "subscription.cancelled":
        // Handle subscription cancellation
        console.log("Subscription cancelled:", event.payload.subscription);
        break;
      // Add more events as necessary
      default:
        console.log("Unhandled event type:", event.event);
        break;
    }

    // Send a 200 response to acknowledge receipt of the webhook
    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500 }
    );
  }
}
