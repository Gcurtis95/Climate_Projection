import Link from "next/link";

export default function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-red-300/70">
        Projection failed
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white">We couldn&apos;t fetch that one</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{message}</p>
      <Link
        href="/"
        className="mt-6 rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white/80 transition-colors hover:border-teal-300/40 hover:text-teal-200"
      >
        Back to map
      </Link>
    </div>
  );
}
