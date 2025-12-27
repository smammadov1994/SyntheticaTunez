import * as ExpoCrypto from 'expo-crypto';

/**
 * Minimal WebCrypto polyfill for React Native / Expo Go to support Supabase PKCE (S256).
 *
 * Supabase auth-js uses:
 * - `crypto.getRandomValues(...)` for PKCE verifier entropy
 * - `crypto.subtle.digest('SHA-256', ...)` for PKCE challenge (S256)
 *
 * When `crypto.subtle` is missing, Supabase falls back to `plain`, which can break OAuth flows.
 */
function ensureCrypto() {
  if (typeof globalThis.crypto !== 'object' || globalThis.crypto === null) {
    globalThis.crypto = {};
  }

  // Provide a best-effort getRandomValues. This is synchronous, so we cannot use ExpoCrypto.getRandomBytesAsync here.
  // Supabase will still work with this; for production builds you should prefer a real WebCrypto implementation.
  if (typeof globalThis.crypto.getRandomValues !== 'function') {
    globalThis.crypto.getRandomValues = (typedArray) => {
      if (!typedArray || typeof typedArray.length !== 'number') {
        throw new TypeError('crypto.getRandomValues: expected a typed array');
      }
      for (let i = 0; i < typedArray.length; i++) {
        typedArray[i] = Math.floor(Math.random() * 256);
      }
      return typedArray;
    };
  }

  if (typeof globalThis.crypto.subtle !== 'object' || globalThis.crypto.subtle === null) {
    globalThis.crypto.subtle = {};
  }

  if (typeof globalThis.crypto.subtle.digest !== 'function') {
    globalThis.crypto.subtle.digest = async (algorithm, data) => {
      const algoName = typeof algorithm === 'string' ? algorithm : algorithm?.name;
      if (algoName !== 'SHA-256') {
        throw new Error(`crypto.subtle.digest: unsupported algorithm ${String(algoName)}`);
      }

      // `data` is typically a Uint8Array from TextEncoder.encode(verifier)
      let bytes;
      if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
      } else if (ArrayBuffer.isView(data)) {
        bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      } else {
        throw new TypeError('crypto.subtle.digest: expected ArrayBuffer or ArrayBufferView');
      }

      // Supabase hashes UTF-8 encoded verifier. The verifier is ASCII-safe, so a basic decode is sufficient.
      let text;
      try {
        if (typeof TextDecoder !== 'undefined') {
          text = new TextDecoder('utf-8').decode(bytes);
        } else {
          text = String.fromCharCode(...bytes);
        }
      } catch {
        text = String.fromCharCode(...bytes);
      }

      const hex = await ExpoCrypto.digestStringAsync(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        text,
        { encoding: ExpoCrypto.CryptoEncoding.HEX }
      );

      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.substr(i * 2, 2), 16);
      }
      return out.buffer;
    };
  }
}

ensureCrypto();


