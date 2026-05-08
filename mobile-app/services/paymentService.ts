import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';

// This is a placeholder for your backend endpoint
// In a real app, you'd have a Cloud Function or Node.js server that creates the PaymentIntent
const API_URL = 'https://your-backend-api.com'; 

export const initializePayment = async (amount: number, currency: string = 'usd') => {
  try {
    // 1. Fetch PaymentIntent client secret from your backend
    // For testing/prototyping, you might simulate this or use a test endpoint
    /*
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency }),
    });
    const { clientSecret } = await response.json();
    */
    
    // TEMPORARY: For the initial SDK setup, we'll simulate a successful setup
    // You'll need to replace this with a real clientSecret from Stripe later
    const clientSecret = 'pi_test_placeholder_secret'; 

    // 2. Initialize the Payment Sheet
    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Weather Dashboard Pro',
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        name: 'Jane Doe',
      }
    });

    if (error) {
      console.error('Error initializing payment sheet:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Payment initialization failed:', e);
    return false;
  }
};

export const openPaymentSheet = async () => {
  const { error } = await presentPaymentSheet();

  if (error) {
    if (error.code === 'Canceled') {
      // Customer canceled - no need to show alert
      return false;
    }
    Alert.alert(`Error code: ${error.code}`, error.message);
    return false;
  } else {
    Alert.alert('Success', 'Your order is confirmed!');
    return true;
  }
};
