"use client";

import { motion } from "framer-motion";

const words = ["БЫСТРЫЙ", "БЕЗОПАСНЫЙ", "АНОНИМНЫЙ", "БЕЗЛИМИТНЫЙ", "МОЛНИЕНОСНЫЙ"];

export function FlashMarquee() {
  return (
    <section className="py-8 border-y border-white/10 overflow-hidden">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex whitespace-nowrap"
      >
        {[...words, ...words, ...words, ...words].map((word, i) => (
          <span
            key={i}
            className="mx-8 text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400/50 to-cyan-400/50"
          >
            {word}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
