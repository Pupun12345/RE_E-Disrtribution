"use client";
import Link from "next/link";
import Image from "next/image";
import { all_routes } from "@/data/allroutes";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-white">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-4 relative z-10">
        <div className="flex items-center space-x-3">
          <Image
            src="/ray-log.png"
            alt="Ray Engineering"
            width={50}
            height={50}
          />
          <h1 className="text-2xl font-bold">Ray Engineering</h1>
        </div>
        <span className="text-sm italic">Where Quality Comes First</span>
      </header>

      {/* Main */}
      <main className="flex flex-col items-center mt-20 text-center px-6 relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold drop-shadow-lg">
          Ray Engineering – Procurement & Industrial Service Solutions
        </h2>

        <div className="flex flex-col md:flex-row gap-12 mt-16 text-xl font-semibold">
          {/* Vendor Registration */}
          <Link href={all_routes.VendorGateway}>
            <button
              className="px-8 py-3 rounded-lg font-bold text-black bg-cyan-400 
              relative overflow-hidden transition-all duration-300 
              hover:scale-110 hover:text-white 
              hover:bg-gradient-to-r hover:from-cyan-400 hover:to-pink-500 
              hover:shadow-[0_0_15px_#22d3ee,0_0_30px_#ec4899]"
            >
              Vendor Gateway
            </button>
          </Link>

          <Link
            href={`${all_routes.Login}?redirect=${all_routes.Distribution}`}
          >
            <button
              className="px-8 py-3 rounded-lg font-bold text-black bg-cyan-400 
            relative overflow-hidden transition-all duration-300 hover:scale-110 hover:text-white
             hover:bg-gradient-to-r hover:from-cyan-400 hover:to-purple-500 
             hover:shadow-[0_0_15px_#22d3ee,0_0_30px_#a855f7]"
            >
              E-Distribution
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto mb-10 text-center relative z-10">
        <p className="text-lg font-semibold text-yellow-300 drop-shadow">
          WILL to WIN <span className="text-white">RAY ENGINEERING</span>
        </p>
      </footer>
    </div>
  );
}
