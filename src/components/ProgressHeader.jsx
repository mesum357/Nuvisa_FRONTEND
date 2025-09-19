import React from "react";

const ProgressHeader = ({ steps }) => {
  const completedSteps = steps.filter((s) => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="w-full sticky top-[0rem] z-30 pri_bg py-4">
      <div className="relative flex items-center justify-between">
        {/* Progress line background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-[#292933]"></div>

        {/* Progress line fill */}
        <div
          className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* Step circles & labels */}
        {steps.map((step, index) => {
          const isActive = steps.find((s) => s.open)?.id === step.id;
          return (
            // flex-1 so steps are evenly spaced across the available width
            <div key={step.id} className="flex-1 flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-[#7350FF] text-white"
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
                className={`mt-2 text-center text-sm font-medium w-28 truncate ${
                  isActive ? "text-[#7350FF]" : "text-gray-400"
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
  );
};

export default ProgressHeader;
