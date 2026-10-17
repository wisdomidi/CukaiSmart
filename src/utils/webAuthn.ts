/**
 * Web Authentication API (WebAuthn) helper for Biometric Authentication
 * Supports Fingerprint, Face ID, Touch ID, Windows Hello, and Passkeys.
 */

export interface WebAuthnVerificationResult {
  success: boolean;
  credentialId?: string;
  error?: string;
  authenticatorType?: string;
}

/**
 * Check if WebAuthn / Platform Authenticator (Fingerprint/Face ID) is available
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {
    return false;
  }

  try {
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    }
    return true;
  } catch (err) {
    console.warn('Error checking platform authenticator availability:', err);
    return false;
  }
}

/**
 * Perform Biometric Authentication using WebAuthn API (navigator.credentials.get / create)
 */
export async function authenticateWithBiometrics(
  userEmail: string = 'taxpayer@cukaismart.my',
  userName: string = 'Malaysian Taxpayer'
): Promise<WebAuthnVerificationResult> {
  if (!window.PublicKeyCredential || !navigator.credentials) {
    return {
      success: false,
      error: 'Web Authentication API is not supported in this browser.',
    };
  }

  // Generate random 32-byte challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // User ID buffer
  const userId = new TextEncoder().encode(userEmail);

  // Prepare PublicKeyCredentialCreationOptions / RequestOptions
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge.buffer,
    rp: {
      name: 'CukaiSmart LHDN Tax Vault',
      id: window.location.hostname || 'localhost',
    },
    user: {
      id: userId.buffer,
      name: userEmail,
      displayName: userName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Fingerprint / Face ID / Touch ID / Windows Hello
      userVerification: 'preferred',
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
  };

  try {
    // Attempt WebAuthn Credential Creation (Registration / Verification prompt)
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null;

    if (credential) {
      const rawIdBuffer = new Uint8Array(credential.rawId);
      const credentialId = Array.from(rawIdBuffer)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      return {
        success: true,
        credentialId,
        authenticatorType: 'WebAuthn Platform Biometrics (Fingerprint / Face Scan)',
      };
    } else {
      return {
        success: false,
        error: 'Biometric verification returned empty credential.',
      };
    }
  } catch (err: any) {
    console.warn('WebAuthn primary attempt failed or cancelled:', err);

    // If WebAuthn fails due to iframe policy / domain mismatch / user cancel,
    // attempt credential assertion fallback or return detailed error for fallback UX
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Biometric authentication request was declined or timed out.',
      };
    }

    if (
      err.name === 'InvalidStateError' ||
      err.name === 'NotSupportedError' ||
      err.name === 'SecurityError'
    ) {
      // Security or origin constraint (e.g. cross-origin iframe in dev sandbox)
      return {
        success: false,
        error: `Environment constraint: ${err.message || 'WebAuthn origin restricted'}. Using secure session fallback.`,
      };
    }

    return {
      success: false,
      error: err.message || 'WebAuthn biometric scan error.',
    };
  }
}
