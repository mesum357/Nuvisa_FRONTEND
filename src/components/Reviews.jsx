"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const reviews = [
    {
        name: "Karan T.",
        role: "Edinburgh",
        img: "/img/karan.png",
        comment:
            "NUvisa has been a real game-changer for our travel plan. The visa application process was very seamless, and we got an appointment in just 2 days.",
    },
    {
        name: "Amit D.",
        role: "Leicester",
        img: "/img/amit.png",
        comment:
            "This literally feels like having an entire army of visa experts who manages application and get your visa on time.",
    },
    {
        name: "Imran N.",
        role: "Manchester",
        img: "/img/imran.png",
        comment:
            "Everything went smooth and was extremely straight forward, saved lot of money compared to other providers.",
    },
    {
        name: "Ananya R.",
        role: "London",
        img: "/img/ananya.png",
        comment:
            "I love the folks at NUvisa as they make life easier and cost effective. Very impressed with the service and process, hope to get more countries soon.",
    },
    {
        name: "Ayesha K.",
        role: "Birmingham",
        img: "/img/ayesha.png",
        comment:
            "By far the best tool when it comes to visa application online. The process is so streamlined and just awesome!",
    },
    {
        name: "Karan T.",
        role: "Edinburgh",
        img: "/img/karan.png",
        comment:
            "NUvisa has been a real game-changer for our travel plan. The visa application process was very seamless, and we got an appointment in just 2 days.",
    },
    {
        name: "Amit D.",
        role: "Leicester",
        img: "/img/amit.png",
        comment:
            "This literally feels like having an entire army of visa experts who manages application and get your visa on time.",
    },
    {
        name: "Imran N.",
        role: "Manchester",
        img: "/img/imran.png",
        comment:
            "Everything went smooth and was extremely straight forward, saved lot of money compared to other providers.",
    }, {
        name: "Ananya R.",
        role: "London",
        img: "/img/ananya.png",
        comment:
            "I love the folks at NUvisa as they make life easier and cost effective. Very impressed with the service and process, hope to get more countries soon.",
    }
];

export default function Reviews() {
    const galleryRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const speed = 1; // scroll speed

    useEffect(() => {
        const gallery = galleryRef.current;
        if (!gallery) return;

        let animationFrameId;
        let scrollPosition = 0;

        const animate = () => {
            if (!isPaused) {
                scrollPosition += speed;
                if (scrollPosition >= gallery.scrollWidth / 3) {
                    scrollPosition = 0;
                }
                gallery.scrollLeft = scrollPosition;
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused]);

    return (
        <section className="w-full py-10 text-white flex flex-col items-center justify-center gap-8">
            <div
                ref={galleryRef}
                className="flex overflow-x-hidden w-full justify-center items-center gap-10"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {[...reviews, ...reviews].map((r, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 w-[400px] md:w-[400px] h-[150px]  bg-[#1E1E27]  cursor-pointer gap-5 font-bold"
                    >

                        <div className="review-header flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Image
                                    src={r.img}
                                    alt={r.name}
                                    width={40}
                                    height={40}
                                    className="h-[40px] w-[40px] rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold text-white text-sm">{r.name}</h3>
                                    <p className="text-xs text-gray-400">{r.role}</p>
                                </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center text-yellow-400 text-lg rating inline-block bg-yellow-200/15 px-3 py-1 rounded-md text-lg font-medium ml-auto">
                                <span>★</span>
                                <span>★</span>
                                <span>★</span>
                                <span>★</span>
                                <span>★</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs ml-10 pl-4">
                            {r.comment}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
