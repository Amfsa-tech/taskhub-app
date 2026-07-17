import * as SecureStore from 'expo-secure-store';
import { ApiError } from '@/lib/api/client';
import { registerUser, registerTasker, verifyEmail } from './auth-api';
import type { AccountType } from './types';

const DEV_EMAIL_KEY_PREFIX = 'taskhub.dev.email.';

/**
 * Automates logging in or signing up a developer/test account.
 * Uses a unique email saved in SecureStore to keep session persistence,
 * but falls back to generating a new unique email if login fails (e.g. database wipe/reset).
 */
export async function loginOrCreateDevAccount(
  role: AccountType,
  signIn: (type: AccountType, payload: any) => Promise<any>
) {
  const storeKey = `${DEV_EMAIL_KEY_PREFIX}${role}`;
  const password = 'Password123!';
  
  // Try retrieving a previously registered dev email
  let emailAddress = await SecureStore.getItemAsync(storeKey);

  if (emailAddress) {
    try {
      await signIn(role, { emailAddress, password });
      return; // Success!
    } catch (err) {
      // If login with saved email failed, clear it and fall through to generate a new one
      await SecureStore.deleteItemAsync(storeKey);
    }
  }

  // Generate a unique email
  const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  emailAddress = `dev.${role}.${randomSuffix}@taskhub.com`;

  // Register
  if (role === 'user') {
    const res = await registerUser({
      fullName: `Dev Customer ${randomSuffix}`,
      emailAddress,
      password,
      country: 'NG',
    });
    if (res.emailToken) {
      await verifyEmail({ code: res.emailToken, emailAddress, type: 'user' });
    }
  } else {
    const res = await registerTasker({
      firstName: 'Dev',
      lastName: `Tasker ${randomSuffix}`,
      emailAddress,
      password,
      phoneNumber: `080${Math.floor(10000000 + Math.random() * 90000000)}`, // valid Nigerian phone shape
      country: 'NG',
      residentState: 'Lagos',
      originState: 'Lagos',
      address: '123 Dev Street',
      dateOfBirth: '1990-01-01',
    });
    if (res.emailToken) {
      await verifyEmail({ code: res.emailToken, emailAddress, type: 'tasker' });
    }
  }

  // Login with new credentials
  await signIn(role, { emailAddress, password });

  // Save the successfully logged-in email
  await SecureStore.setItemAsync(storeKey, emailAddress);
}

