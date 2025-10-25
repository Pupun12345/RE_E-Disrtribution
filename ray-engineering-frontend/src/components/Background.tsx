"use client";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ✅ Background Image */}
      <Image
        src="/background.jpg"  
        alt="Background"
        fill
        priority
        className="object-cover object-center"
      />

      {/* ✅ Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50"></div>

      

      {/* 🔥 Glow Effects */}
      <motion.div
        className="absolute top-10 left-1/4 w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-500/70"
        animate={{ y: [0, -20, 0], opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
      <motion.div
        className="absolute top-1/3 left-2/3 w-2 h-2 bg-orange-500 rounded-full shadow-lg shadow-orange-600/70"
        animate={{ y: [0, -25, 0], opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
    </div>
  );
}
