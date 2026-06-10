"use client";

import React from "react";

const Block = ({
  id,
  color = "gray",
  className = "",
}: {
  id: string;
  color?: "gray" | "darkgray" | "magenta" | "yellow";
  className?: string;
}) => {
  const bg =
    color === "magenta"
      ? "bg-[#c415c4]"
      : color === "yellow"
      ? "bg-[#ffcc00]"
      : color === "darkgray"
      ? "bg-[#a3a3a3]"
      : "bg-[#d1d5db]";
  const textCol =
    color === "yellow"
      ? "text-black"
      : color === "magenta"
      ? "text-white"
      : "text-gray-800";

  return (
    <div
      className={`flex items-center justify-center font-bold text-[10px] md:text-xs rounded-sm border border-white hover:opacity-80 hover:scale-105 cursor-pointer transition-all ${bg} ${textCol} ${className}`}
      title={`Block ${id}`}
    >
      {id}
    </div>
  );
};

export default function StadiumMap() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-gray-800">AEK ARENA</h1>
        <p className="text-gray-500">בחר את המושב שלך</p>
      </div>

      <div className="w-full max-w-[1200px] overflow-x-auto p-4 md:p-12 rounded-2xl bg-gray-50 flex items-center justify-center shadow-lg border border-gray-200">
        <div className="flex flex-col items-center min-w-[700px]">
          {/* East Stand */}
          <div className="flex flex-col gap-1 items-center mb-6">
            <div className="text-[10px] md:text-xs font-bold text-gray-400 tracking-widest mb-1 title-font">
              AJK GROUP EAST STAND
            </div>
            <div className="flex gap-1 justify-center">
              {["C-B1", "C-B2", "C-B3", "C-B4", "C-B5", "C-B6", "C-B7"].map((id) => (
                <Block key={id} id={id} color="darkgray" className="w-10 h-6 md:w-14 md:h-8" />
              ))}
            </div>
            <div className="flex gap-1 justify-center">
              <Block id="408" color="magenta" className="w-12 h-10 md:w-16 md:h-12" />
              {["401", "402", "403", "404", "405", "406", "407"].map((id) => (
                <Block key={id} id={id} className="w-10 h-10 md:w-14 md:h-12" />
              ))}
              <Block id="409" color="magenta" className="w-12 h-10 md:w-16 md:h-12" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            {/* South Stand */}
            <div className="flex gap-2 items-center">
              <div className="text-[10px] md:text-xs font-bold text-gray-400 tracking-widest -rotate-90 whitespace-nowrap w-6 text-center title-font">
                PETROS KOUNTOURIS SOUTH STAND
              </div>
              <div className="flex flex-col gap-1">
                {["307", "306", "305", "304", "303", "302", "301"].map((id) => (
                  <Block key={id} id={id} className="w-14 h-10 md:w-16 md:h-12" />
                ))}
              </div>
            </div>

            {/* Pitch */}
            <div className="w-[300px] h-[200px] md:w-[450px] md:h-[300px] bg-white border border-gray-300 relative flex items-center justify-center p-2 rounded-sm shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-4 border border-gray-300 pointer-events-none flex">
                <div className="w-1/2 h-full border-r border-gray-300"></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full border border-gray-300"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-20 md:w-16 md:h-28 border border-l-0 border-gray-300"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-20 md:w-16 md:h-28 border border-r-0 border-gray-300"></div>
              </div>
              <div className="bg-[#ffcc00] px-6 py-4 rounded-md font-black text-xl md:text-3xl text-black border-[3px] border-black z-10 shadow-lg text-center tracking-wider transform -skew-x-6">
                ARENA<br/>TICKETS
              </div>
            </div>

            {/* North Stand */}
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-1">
                {["101", "102", "103", "104", "105", "106", "107"].map((id) => (
                  <Block key={id} id={id} className="w-14 h-10 md:w-16 md:h-12" />
                ))}
              </div>
              <div className="text-[10px] md:text-xs font-bold text-gray-400 tracking-widest rotate-90 whitespace-nowrap w-6 text-center title-font">
                LCA NORTH STAND
              </div>
            </div>
          </div>

          {/* West Stand */}
          <div className="flex flex-col gap-1 items-center mt-6">
            <div className="flex gap-1 justify-center">
              <Block id="212" color="magenta" className="w-14 h-8 md:w-20 md:h-10" />
              <Block id="208" color="magenta" className="w-10 h-8 md:w-12 md:h-10" />
              <div className="flex gap-1 items-center px-1">
                {["L1", "L2", "L3", "L4"].map((id) => (
                  <Block key={id} id={id} color="darkgray" className="w-8 h-8 md:w-10 md:h-10 !text-[9px]" />
                ))}
              </div>
              <Block id="209" color="magenta" className="w-10 h-8 md:w-12 md:h-10" />
              <Block id="213" color="magenta" className="w-14 h-8 md:w-20 md:h-10" />
            </div>
            <div className="flex gap-1 justify-center">
              {["201", "202", "203"].map((id) => (
                <Block key={id} id={id} className="w-12 h-10 md:w-14 md:h-12" />
              ))}
              <Block id="VIP" color="darkgray" className="w-16 h-10 md:w-24 md:h-12" />
              {["204", "205", "206"].map((id) => (
                <Block key={id} id={id} className="w-12 h-10 md:w-14 md:h-12" />
              ))}
            </div>
            <div className="flex gap-1 justify-center">
              {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9"].map((id) => (
                <Block key={id} id={id} color="darkgray" className="w-8 h-6 md:w-10 md:h-8 !text-[8px]" />
              ))}
            </div>
            <div className="text-[10px] md:text-xs font-bold text-gray-400 tracking-widest mt-2 title-font">
              GEORGE KARAPATAKIS WEST STAND
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
