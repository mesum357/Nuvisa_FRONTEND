import React from "react";

const ProgressHeader = ({ steps }) => {
  const completedSteps = steps.filter((s) => s.completed).length;
  const currentStep = steps.find((s) => s.open);
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="w-full sticky top-0 z-30 pri_bg py-4">
      <div className="relative w-full">

        {/* Progress line – full width behind scrollable steps */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-[#292933]"></div>
        <div
          className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* Scrollable wrapper for steps on mobile */}
        <div className="flex overflow-x-auto no-scrollbar space-x-6 px-2 sm:justify-between sm:space-x-0">
          {steps.map((step, index) => {
            const isActive = currentStep?.id === step.id;

            return (
              <div
                key={step.id}
                className="flex-shrink-0 sm:flex-1 flex flex-col items-center z-10 min-w-[70px] sm:min-w-0"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center
                    ${
                      step.completed
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-[#292933] text-green-400"
                        : "bg-[#292933]"
                    }`}
                >
                  {step.completed ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                <span
                  className={`mt-2 text-center text-xs sm:text-sm font-medium w-20 sm:w-28 truncate ${
                    isActive ? "text-green-400" : "text-gray-400"
                  }`}
                  title={step.title}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default ProgressHeader;
