import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithCredential,
  signInWithPopup,
  Auth
} from 'firebase/auth';
import { Platform } from 'react-native';

export const configureGoogleSignIn = () => {
  if (Platform.OS !== 'web') {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // Added for iOS support
      offlineAccess: true,
    });
  }
};

export const signInWithGoogle = async (auth: Auth) => {
  if (Platform.OS === 'web') {
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Web Google Sign-In Error:', error);
      throw error;
    }
  }

  try {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const credential = GoogleAuthProvider.credential(idToken);
    return await signInWithCredential(auth, credential);
  } catch (error) {
    console.error('Native Google Sign-In Error:', error);
    throw error;
  }
};

export const signInWithApple = async (auth: Auth) => {
  if (Platform.OS === 'web') {
    // Apple Sign-In on web usually requires more complex redirect setup, 
    // but for testing purposes we'll use a standard OAuthProvider popup
    try {
      const provider = new OAuthProvider('apple.com');
      return await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Web Apple Sign-In Error:', error);
      throw error;
    }
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    
    const { identityToken } = credential;
    if (!identityToken) throw new Error('Apple Sign-In failed: No identity token');

    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
      idToken: identityToken,
    });
    
    return await signInWithCredential(auth, firebaseCredential);
  } catch (error) {
    console.error('Native Apple Sign-In Error:', error);
    throw error;
  }
};

export const isAppleAuthAvailable = async () => {
  if (Platform.OS === 'web') return true; // Assume available for popup test
  if (Platform.OS !== 'ios') return false;
  return await AppleAuthentication.isAvailableAsync();
};
