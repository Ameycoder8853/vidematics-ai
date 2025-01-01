import { db } from "../../db"; // Replace with your actual database import
import Razorpay from "razorpay";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { subscriptionId, email } = await req.json();

    if (!subscriptionId || !email) {
      return new Response(
        JSON.stringify({ error: "Subscription ID and email are required" }),
        { status: 400 }
      );
    }

    // Update subscription status in your database
    await db.subscriptions.update({
      where: { email },
      data: { status: "active", subscriptionId },
    });

    return new Response(
      JSON.stringify({ message: "Subscription activated successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error activating subscription:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to activate subscription" }),
      { status: 500 }
    );
  }
}

