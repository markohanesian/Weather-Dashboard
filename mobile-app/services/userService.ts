import { db } from './firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface UserPreferences {
  units: string;
  savedCities: any[];
  notificationsOn: boolean;
  dailyReport: boolean;
  suddenAlerts: boolean;
  isPro: boolean;
}

export const syncUserData = async (userId: string, data: Partial<UserPreferences>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    console.error('Error syncing user data:', error);
    throw error;
  }
};

export const fetchUserData = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
