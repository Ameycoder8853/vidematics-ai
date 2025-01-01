"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { db } from '../../db';
import { Users } from '../../../configs/schema';
import { eq } from 'drizzle-orm';

const Upgrade = () => {
  const { user } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [hasSubscription, setHasSubscription] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      const userEmail = user?.primaryEmailAddress?.emailAddress || '';
      setEmail(userEmail);

      // Extract name by removing the domain from the email
      const extractedName = userEmail.split('@')[0];
      setName(extractedName);

      // Check if user already has a subscription
      checkSubscriptionStatus(userEmail);
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [user]);

  const checkSubscriptionStatus = async (email) => {
    try {
      const response = await fetch("/api/check-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      setHasSubscription(data.status === "active");
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setHasSubscription(false); // Default to false in case of error
    }
  };

  const handleUpgrade = async () => {
    if (!isScriptLoaded) {
      alert("Razorpay script not loaded. Please try again.");
      return;
    }

    try {
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }), // Send email and name only
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (data?.subscriptionId) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: data.subscriptionId,
          name: "Videomatic AI",
          description: "Pro Plan Subscription",
          handler: async function (response) {
            alert("Payment Successful!");
            console.log("Razorpay Response:", response);

            // Verify and activate subscription
            const verificationResponse = await fetch(
              "/api/verify-subscription",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  subscriptionId: data.subscriptionId,
                  email,
                }),
              }
            );

            if (verificationResponse.ok) {
              alert("Subscription activated successfully!");

              // Update credits and subscription status in Neon DB
              await updateUserCredits(email);
              router.push("/dashboard");
            } else {
              console.error("Subscription activation failed");
              alert("Something went wrong while activating your subscription.");
            }
          },
          prefill: {
            name: name,
            email: email,
          },
          theme: {
            color: "#3399cc",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        alert("Failed to create subscription. Please try again.");
      }
    } catch (error) {
      console.error("Error upgrading:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const updateUserCredits = async (email) => {
    try {
      // First, set credits to 0
      await db.update(Users).set({ credits: 0 }).where(eq(Users.email, email));
      console.log("Credits set to 0.");

      // Now, add 600 credits and update subscription status to true
      await db.update(Users)
        .set({
          credits: 600,
          subscription: true,
        })
        .where(eq(Users.email, email));

      console.log("Credits updated to 600 and subscription set to true.");
    } catch (error) {
      console.error("Error updating user credits:", error);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 px-4 min-h-screen">
      <div className="max-w-md rounded-lg bg-white shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
          {hasSubscription === null
            ? "Loading..."
            : hasSubscription
            ? "You already have a Pro Plan"
            : "Upgrade to Pro"}
        </h1>

        {hasSubscription === false && (
          <div>
            <p className="text-gray-600 text-center mb-6">
              Unlock the full potential of our AI Video Generator.
            </p>

            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Pro Plan</h2>
              <p className="text-gray-600 mb-4">₹999 / month</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Generate up to 60 videos per month</li>
                <li>High-quality video rendering</li>
                <li>Priority support</li>
              </ul>
            </div>

            <button
              onClick={handleUpgrade}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Upgrade Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upgrade;
