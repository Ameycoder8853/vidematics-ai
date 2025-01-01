// /app/api/create-subscription/route.js
import Razorpay from "razorpay";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,
    });

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: "Failed to create Razorpay subscription" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ subscriptionId: subscription.id }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred.",
      }),
      { status: 500 }
    );
  }
}
