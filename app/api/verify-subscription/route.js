import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '../../../configs/db'; // Adjust path to your db config
import { Users } from '../../../configs/schema';
import { eq } from 'drizzle-orm';

export async function POST(request) {
  try {
    const { subscriptionId, email } = await request.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const subscriptionDetails = await razorpay.subscriptions.fetch(subscriptionId);

    console.log("Razorpay Subscription Details:", subscriptionDetails);

    // Check if subscription is active
    if (subscriptionDetails.email === email && subscriptionDetails.status === 'active') {

      // Extract the "Next Due On" date and format it
      const nextDueOn = new Date(subscriptionDetails.next_due_on * 1000).toISOString();

      // Update subscription details in Neon DB
      await db.update(Users)
        .set({
          subscription: true,
          subscriptionEndDate: nextDueOn, // Update with the formatted next due date
          credits: 600, // Reset or update credits
        })
        .where(eq(Users.email, email));

      return NextResponse.json({ status: 'success', message: 'Subscription is active.' });
    }

    return NextResponse.json({
      status: 'failure',
      message: 'Subscription verification failed.',
    });

  } catch (error) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json({
      status: 'failure',
      message: 'Internal server error while verifying subscription.',
    });
  }
}
