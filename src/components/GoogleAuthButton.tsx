import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { AlertCircle } from "lucide-react";

type GoogleAuthButtonProps = {
  onCredential: (credential: string) => Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
};

export default function GoogleAuthButton({
  onCredential,
  onError,
  disabled = false,
}: GoogleAuthButtonProps) {
  const hasClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleSuccess = async (response: CredentialResponse) => {
    if (disabled) return;
    if (!response.credential) {
      onError("Google did not return a sign-in credential. Please try again.");
      return;
    }
    await onCredential(response.credential);
  };

  if (!hasClientId) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
        <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>Google sign-in needs a client ID before it can be used.</span>
      </div>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError("Google sign-in failed. Please try again.")}
        width="100%"
        size="large"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}
