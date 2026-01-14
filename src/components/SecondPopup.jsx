"use client";

import { useState } from "react";
import { X } from "react-feather";

const stepsData = [
    {
        title: "Status in United Kingdom",
        options: ["UK BRP", "UK BRC", "UK PR", "UK ILR", "UK Citizen"],
    },
    {
        title: "Visa Type",
        options: ["Student", "Work", "Visit", "Family"],
    },
    {
        title: "Which country?",
        options: ["UK", "USA", "Canada", "Australia"],
    },
    {
        title: "Which country?",
        options: ["UK", "USA", "Canada", "Australia"],
    },
    {
        title: "Which country?",
        options: ["UK", "USA", "Canada", "Australia"],
    },
];

export default function SecondPopup({ onClose, onComplete }) {
    const [step, setStep] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answers, setAnswers] = useState({});

    const totalSteps = stepsData.length;

    const handleContinue = () => {
        if (!selected) return;

        const updated = { ...answers, [`q${step + 1}`]: selected };
        setAnswers(updated);
        sessionStorage.setItem("visaAnswers", JSON.stringify(updated));

        if (step + 1 === totalSteps) {
            sessionStorage.setItem("visaFormCompleted", "true");
            onComplete();
        } else {
            setSelected(null);
            setStep(step + 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-[#171717] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 relative">

                <button onClick={onClose} className="absolute top-4 right-4">
                    <X />
                </button>
                {/* Progress Dots */}
                <div className="flex gap-2 mb-4 mt-8">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 rounded ${i <= step ? "bg-blue-600" : "bg-gray-300"
                                }`}
                        />
                    ))}
                </div>
                <h2 className="text-xl font-semibold mb-4">
                    {stepsData[step].title}
                </h2>

                <div className="space-y-3 mb-6">
                    {stepsData[step].options.map((opt) => (
                        <label
                            key={opt}
                            className="flex items-center justify-between  p-3 cursor-pointer"
                        >
                            <span>{opt}</span>
                            <input
                                type="radio"
                                name="answer"
                                value={opt}
                                checked={selected === opt}
                                onChange={() => setSelected(opt)}
                                className="w-5 h-5 accent-blue-600"
                            />
                        </label>
                    ))}
                </div>
                <button
                    onClick={handleContinue}
                    disabled={!selected}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg font-semibold disabled:opacity-50"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
