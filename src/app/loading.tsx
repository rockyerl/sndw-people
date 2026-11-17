import Image from "next/image";

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat aplikasi"
      className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-[#F3F6FA] p-4"
    >
      <div className="flex flex-col items-center space-y-4 max-w-xs text-center">
        {/* Brand Icon with Pulse Glow */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full bg-blue-500/20 animate-ping opacity-75" />
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border border-slate-200/80 flex items-center justify-center relative z-10">
            <Image
              src="/brand/sundawa-people-symbol.svg"
              alt="SUNDAWA People"
              width={36}
              height={36}
              className="h-9 w-auto animate-pulse"
              priority
            />
          </div>
        </div>

        {/* Loading Spinner & Label */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-sp-blue border-t-transparent animate-spin" />
            <span className="font-montserrat text-sm font-bold text-slate-800 tracking-tight">
              Memuat Data...
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Menyiapkan sistem SUNDAWA People
          </p>
        </div>
      </div>
    </div>
  );
}
