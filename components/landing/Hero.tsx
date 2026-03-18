import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-[180px] pb-[120px] relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)",
        }}
      />

      {/* Green glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(34,214,138,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 text-center max-w-[1200px] mx-auto px-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-green/10 border border-accent-green/15 rounded-full text-accent-green text-[13px] font-medium mb-8 animate-fade-up">
          <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse-dot" />
          AI-powered trading intelligence
        </div>

        <h1 className="font-display text-[clamp(48px,7vw,88px)] font-normal leading-[1.05] tracking-[-2px] mb-7 animate-fade-up-1">
          Trade with
          <br />
          <em className="italic text-accent-green">clarity</em>, not guesses
        </h1>

        <p className="text-lg text-t-secondary max-w-[560px] mx-auto mb-11 leading-[1.7] animate-fade-up-2">
          Meridian fuses real-time news sentiment, geopolitical analysis, and
          technical indicators into a single confidence score — so you
          understand <em className="text-t-primary">why</em> before you trade.
        </p>

        <div className="flex justify-center gap-4 animate-fade-up-3">
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-green text-deep text-sm font-semibold rounded-full hover:bg-[#2EE89A] hover:shadow-[0_0_30px_rgba(34,214,138,0.25)] hover:-translate-y-0.5 transition-all no-underline">
            Get started free
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/[0.12] text-t-primary text-sm font-medium rounded-full hover:border-t-muted hover:bg-white/[0.03] transition-all"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
