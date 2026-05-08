import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import Stripe from "stripe";

// Set global options for performance and cost control
setGlobalOptions({maxInstances: 10});

// Define a variable to hold the Stripe instance (lazy initialization)
let stripeInstance: InstanceType<typeof Stripe> | null = null;

const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment.");
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return stripeInstance;
};

/**
 * Creates a Stripe PaymentIntent for the Weather Dashboard Pro upgrade.
 */
export const createPaymentIntent = onCall({
  secrets: ["STRIPE_SECRET_KEY"],
}, async (request) => {
  // 1. Ensure the user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {amount = 499, currency = "usd"} = request.data;

  try {
    // 2. Initialize Stripe lazily and create the PaymentIntent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        userId: request.auth.uid,
        userEmail: request.auth.token.email || "unknown",
        plan: "pro_upgrade_one_time",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info(`Payment created for user ${request.auth.uid}`);

    // 3. Return the clientSecret to the app
    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error: unknown) {
    logger.error("Stripe Error:", error);
    const message = error instanceof Error ? error.message : "Payment failed";
    throw new HttpsError("internal", message);
  }
});
