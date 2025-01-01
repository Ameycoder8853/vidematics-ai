// app/api/payment-success/route.js

import { NextResponse } from 'next/server';
import { db } from '../../../configs/db'; // Replace with your Neon DB instance
import { Users } from '../../../configs/schema'; // Replace with your actual schema or model for Users
import { eq } from 'drizzle-orm'; // Adjust based on your ORM

// Function to update user credits and subscription status
const UpdateUserCredits = async (userDetail, db) => {
  try {
    // First, reset the credits to 0
    const resetCreditsResult = await db.update(Users).set({
      credits: 0, // Set credits to 0
    }).where(eq(Users?.email, userDetail?.primaryEmailAddress?.emailAddress));

    console.log("Credits reset to 0:", resetCreditsResult);

    // Now, add 600 credits and set the subscription column to TRUE
    const updateCreditsResult = await db.update(Users).set({
      credits: 600,  // Set credits to 600
      subscription: true, // Set subscription to TRUE
    }).where(eq(Users?.email, userDetail?.primaryEmailAddress?.emailAddress));

    console.log("Credits updated and subscription activated:", updateCreditsResult);
    
  } catch (error) {
    console.error("Error updating credits and subscription:", error);
  }
};

// POST handler for payment success
export async function POST(request) {
  try {
    const { email, subscriptionId } = await request.json();

    // Get the user details based on email (or another unique identifier)
    const userDetail = await db.select().from(Users).where(eq(Users?.email, email)).first();

    if (!userDetail) {
      return NextResponse.json({ status: 'failure', message: 'User not found' });
    }

    // Call the function to update credits and subscription
    await UpdateUserCredits(userDetail, db);

    return NextResponse.json({ status: 'success', message: 'Subscription and credits updated successfully' });

  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ status: 'failure', message: 'Internal server error' });
  }
}
