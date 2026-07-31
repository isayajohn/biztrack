import { Loader2 } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f7faf9] px-4 text-ink">
      <div className="flex flex-col items-center gap-4">
        <BrandLogo className="h-auto w-52 max-w-full" />
        <div className="flex items-center gap-2 text-sm font-bold text-ink/60">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          Checking session...
        </div>
      </div>
    </div>
  );
}
