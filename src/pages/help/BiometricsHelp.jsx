import { Link } from 'react-router-dom';
import HelpLayout from './HelpLayout';

/**
 * ponytail: Biometrics / Passkey Setup Guide — dos and don'ts
 * Help page explaining how to set up fingerprint / face / device PIN login.
 */
export default function BiometricsHelp() {
  return (
    <HelpLayout
      title="Biometric & Passkey Login Setup"
      description="Set up fingerprint, face recognition, or device PIN for fast, password-free sign-in on Omix Store"
    >
      <div className="space-y-8">
        {/* What is it */}
        <section className="fusion-recessed-card p-6">
          <h2 className="text-lg font-bold text-white mb-3">What is Biometric Login?</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Biometric login (also called Passkeys or WebAuthn) lets you sign in using your device&apos;s
            fingerprint scanner, face recognition, or screen lock PIN — instead of typing your password
            every time. It is faster, more secure, and supported on most modern phones and browsers.
          </p>
        </section>

        {/* How to set up */}
        <section className="fusion-recessed-card p-6">
          <h2 className="text-lg font-bold text-white mb-3">How to Set Up Biometric Login</h2>
          <ol className="text-sm text-zinc-400 leading-relaxed space-y-3 list-decimal list-inside">
            <li>Log in to your Omix Store account normally (email + password).</li>
            <li>Go to <Link to="/account" className="text-[var(--seasonal-primary,#1a5632)] font-bold hover:underline">My Account</Link> and scroll to the <strong className="text-white">Security</strong> section.</li>
            <li>Tap <strong className="text-white">Add Biometric Login</strong>.</li>
            <li>Your device will prompt you to verify with fingerprint, face, or PIN.</li>
            <li>Once confirmed, you will see your device listed under Biometric Logins.</li>
            <li>Next time you log in, choose <strong className="text-white">Sign in with Biometric</strong> on the login page.</li>
          </ol>
        </section>

        {/* Dos */}
        <section className="fusion-recessed-card p-6 border-l-4 border-emerald-500">
          <h2 className="text-lg font-bold text-emerald-400 mb-3">Do&apos;s</h2>
          <ul className="text-sm text-zinc-400 leading-relaxed space-y-2 list-disc list-inside">
            <li><strong className="text-white">Do</strong> set up biometric login on your primary device for quick access.</li>
            <li><strong className="text-white">Do</strong> give your biometric a recognizable name (e.g. &quot;My Phone&quot;, &quot;Work Laptop&quot;).</li>
            <li><strong className="text-white">Do</strong> keep your device&apos;s screen lock updated — biometrics rely on it.</li>
            <li><strong className="text-white">Do</strong> add multiple devices if you shop from both phone and laptop.</li>
            <li><strong className="text-white">Do</strong> remove old devices you no longer use from the biometric list.</li>
            <li><strong className="text-white">Do</strong> contact support if you see the error &quot;credential id was not base64url-encoded&quot; — this is a known browser issue we have fixed.</li>
          </ul>
        </section>

        {/* Don'ts */}
        <section className="fusion-recessed-card p-6 border-l-4 border-red-500">
          <h2 className="text-lg font-bold text-red-400 mb-3">Don&apos;ts</h2>
          <ul className="text-sm text-zinc-400 leading-relaxed space-y-2 list-disc list-inside">
            <li><strong className="text-white">Don&apos;t</strong> share your device with others if biometric login is enabled — they can sign in as you.</li>
            <li><strong className="text-white">Don&apos;t</strong> remove your device&apos;s screen lock while biometrics are active — it will stop working.</li>
            <li><strong className="text-white">Don&apos;t</strong> use biometric login on public or shared computers.</li>
            <li><strong className="text-white">Don&apos;t</strong> forget your password — you still need it for sensitive actions like changing payment methods.</li>
            <li><strong className="text-white">Don&apos;t</strong> panic if your fingerprint fails once — your device may ask for your PIN as backup.</li>
          </ul>
        </section>

        {/* Troubleshooting */}
        <section className="fusion-recessed-card p-6">
          <h2 className="text-lg font-bold text-white mb-3">Troubleshooting</h2>
          <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
            <div>
              <p className="font-bold text-white">Biometric option not showing?</p>
              <p>Your browser or device may not support WebAuthn. Use Chrome, Edge, or Safari on a device with fingerprint/face hardware.</p>
            </div>
            <div>
              <p className="font-bold text-white">Getting &quot;credential id was not base64url-encoded&quot;?</p>
              <p>This was a known issue with older versions. Update to the latest Omix Store version and try again.</p>
            </div>
            <div>
              <p className="font-bold text-white">Biometric not recognized?</p>
              <p>Make sure your finger is clean and dry, or try face recognition in good lighting. You can always fall back to password login.</p>
            </div>
          </div>
        </section>

        {/* Security note */}
        <section className="fusion-recessed-card p-6">
          <h2 className="text-lg font-bold text-white mb-3">How Secure is This?</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Biometric data never leaves your device. Omix Store only stores a cryptographic key that
            proves your device verified you — we never see your fingerprint or face data. This is the
            same standard used by banks and government apps worldwide.
          </p>
        </section>
      </div>
    </HelpLayout>
  );
}
