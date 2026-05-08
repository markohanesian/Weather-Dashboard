import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

export const initializePayment = async (amount: number, currency: string = 'usd') => {
  try {
    // 1. Call the Firebase Cloud Function to create a PaymentIntent
    const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
    const result = await createPaymentIntent({ amount, currency });
    
    const { clientSecret } = result.data as { clientSecret: string };

    if (!clientSecret) {
      throw new Error('No client secret returned from the server.');
    }

    // 2. Initialize the Payment Sheet
    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Weather Dashboard Pro',
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        name: 'Weather Dashboard User',
      }
    });

    if (error) {
      console.error('Error initializing payment sheet:', error);
      return false;
    }

    return true;
  } catch (e: any) {
    console.error('Payment initialization failed:', e);
    // Provide a more user-friendly error message if it's a Firebase error
    const message = e.message || 'Check your internet connection and try again.';
    Alert.alert('Payment Initialization Failed', message);
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
    Alert.alert('Success', 'Your Pro upgrade is confirmed! Thank you.');
    return true;
  }
};
