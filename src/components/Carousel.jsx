"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Dummy user slides
const slides = [
  [
    {
      id: 1,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 5,
    },
    {
      id: 2,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 4,
    },
    {
      id: 3,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 5,
    },
  ],
  [
    {
      id: 4,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 5,
    },
    {
      id: 5,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 4,
    },
    {
      id: 6,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 5,
    },
  ],
  [
    {
      id: 4,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 5,
    },
    {
      id: 5,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 4,
    },
    {
      id: 6,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 5,
    },
  ],
  [
    {
      id: 4,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 5,
    },
    {
      id: 5,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 4,
    },
    {
      id: 6,
      image:  "/image/country/Germany.jpg",
      text: "Amazing service! Very professional and friendly Amazing service! Very professional and friendlyAmazing service! Very professional and friendlyAmazing service! Very professional and friendly.",
      rating: 5,
    },
  ]
];

// Star component
const Stars = ({ count }) => {
  return (
    <div className="flex justify-center">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-yellow-400 ${i < count ? "opacity-100" : "opacity-30"}`}>
          ★
        </span>
      ))}
    </div>
  );
};

export default function Carousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-100 mt-15 overflow-hidden">

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="flex w-full  items-center justify-center gap-6 px-6 md:px-12"
        >
          {slides[current].map((item) => (
            <div
              key={item.id}
              className="relative flex-1 h-6/8 bg-white rounded-xl overflow-hidden shadow-lg flex flex-col items-center"
            >
              <div className="relative w-full h-48 md:h-64">
  <Image
    src={item.image}
    alt={item.text}
    fill
    className="object-cover"
  />
</div>

              <div className="text-center flex-1 flex flex-col gap-2">
  <p className="text-gray-800 text-sm md:text-base">{item.text}</p>
  <Stars count={item.rating} />
</div>

            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <button
        onClick={() => setCurrent((current - 1 + slides.length) % slides.length)}
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/60 hover:bg-white p-3 rounded-full shadow-lg"
      >
        ◀
      </button>
      <button
        onClick={() => setCurrent((current + 1) % slides.length)}
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/60 hover:bg-white p-3 rounded-full shadow-lg"
      >
        ▶
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 w-full flex justify-center gap-3">
        {slides.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-4 h-4 rounded-full cursor-pointer ${current === i ? "bg-gray-800" : "bg-gray-400/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
