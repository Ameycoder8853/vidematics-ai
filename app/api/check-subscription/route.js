// app/api/check-subscription/route.js

import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Extract the name part from the email (before the '@')
    const customerId = email.split('@')[0]; // This will use the part before '@'

    // Debugging: Log the extracted customerId
    console.log("Extracted customerId:", customerId);

    // Create Razorpay instance with your credentials
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Fetch all subscriptions for the email
    const subscriptions = await razorpay.subscriptions.all();

    // Log the subscriptions for debugging
    console.log("All Razorpay Subscriptions:", subscriptions);

    // Find the subscription that matches the customer's extracted customer_id
    const userSubscription = subscriptions.items.find(
      (subscription) => subscription.customer_id === customerId
    );

    if (userSubscription) {
      // Log the user's subscription details for debugging
      console.log("User's Subscription:", userSubscription);

      if (userSubscription.status === 'active') {
        return NextResponse.json({
          status: 'success',
          message: 'You already have a Pro plan.',
          subscriptionStatus: 'active',
        });
      } else {
        return NextResponse.json({
          status: 'failure',
          message: `Your subscription status is ${userSubscription.status}. Please check your payment.`,
          subscriptionStatus: userSubscription.status,
        });
      }
    } else {
      // No subscription found for the customer ID
      return NextResponse.json({
        status: 'failure',
        message: 'No subscription found for this user.',
        subscriptionStatus: 'inactive',
      });
    }
  } catch (error) {
    console.error('Error checking subscription:', error);

    // Return failure if there is an error in fetching the subscription
    return NextResponse.json({
      status: 'failure',
      message: 'Internal server error while checking subscription.',
    });
  }
}
