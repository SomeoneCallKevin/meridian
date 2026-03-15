"use client";

import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-[#07090E]/70 transition-all ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-8 flex items-center justify-between">
        <a
          href="#"
          className="font-display text-[26px] text-t-primary no-underline tracking-tight"
        >
          Meridian<span className="text-accent-green">.</span>
        </a>
        <div className="flex items-center gap-9">
          <a
            href="#features"
            className="text-sm text-t-secondary hover:text-t-primary transition-colors hidden md:block"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-t-secondary hover:text-t-primary transition-colors hidden md:block"
          >
            How it works
          </a>
          <a
            href="#signals"
            className="text-sm text-t-secondary hover:text-t-primary transition-colors hidden md:block"
          >
            Signals
          </a>
          <button className="px-6 py-2.5 bg-accent-green text-deep text-sm font-semibold rounded-full hover:bg-[#2EE89A] hover:shadow-[0_0_30px_rgba(34,214,138,0.25)] transition-all">
            Get early access
          </button>
        </div>
      </div>
    </nav>
  );
}
