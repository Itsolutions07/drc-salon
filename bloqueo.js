// Bloqueo de entrada de la versión web con Face ID / huella / código del
// teléfono (WebAuthn). Es solo un candado local, como la huella en Android:
// no se manda nada al servidor.
window.drcBloqueo = {
  async disponible() {
    try {
      return !!(window.PublicKeyCredential &&
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
    } catch (e) {
      return false;
    }
  },

  tiene() {
    return !!localStorage.getItem('drc_bloqueo');
  },

  quitar() {
    localStorage.removeItem('drc_bloqueo');
  },

  // Crea la llave en este teléfono (pide Face ID o el código).
  async registrar(nombre) {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'DRC System - Salón' },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: nombre,
          displayName: nombre,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
    const id = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
    localStorage.setItem('drc_bloqueo', id);
    return true;
  },

  // Pide Face ID o el código del teléfono.
  async verificar() {
    const id = localStorage.getItem('drc_bloqueo');
    if (!id) throw new Error('sin-bloqueo');
    const raw = Uint8Array.from(atob(id), (c) => c.charCodeAt(0));
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: raw, transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return true;
  },
};
