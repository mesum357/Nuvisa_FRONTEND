import React, { useState, useEffect } from "react";
import ClientOnly from "./ClientOnly";
import Router from "next/router";

const ApplicationCompletedSection = () => {
  const [referenceNumber, setReferenceNumber] = useState("UKV-2023-XXXX");
  const route = Router;
  useEffect(() => {
    // Generate reference number client-side to avoid hydration mismatch
    const randomNum = Math.floor(Math.random() * 10000);
    setReferenceNumber(`UKV-2023-${randomNum}`);
  }, []);
  return (
    <div className="w-full mx-auto border public_border_clr rounded-lg shadow-md p-8 text-center">
      <div className="mb-6">
        <svg
          className="w-16 h-16 text-green-500 mx-auto"
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
      </div>

      <h2 className="text-2xl font-gilroy-bold mb-4">
        Thank you for submitting your visa form.
      </h2>

      <p className="text-gray-300 mb-8">
        We have started your visa application from our end. We'll reach out to
        you, in case we have any questions.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {/* <button className="bg_primary_color text-white py-2 px-6 rounded-md hover:bg-[#7350FF] transition-colors">
          Upload pending documents
        </button> */}
        <button
          onClick={() => route.push("/dashboard")}
          className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 transition-colors"
        >
          Track visa status
        </button>
      </div>

      <div className="mt-8 pt-6 border-t public_border_clr">
        {/* <p className="text-sm text-gray-300">
          Your application reference number:{" "}
          <span className="font-medium">
            <ClientOnly fallback="UKV-2023-XXXX">{referenceNumber}</ClientOnly>
          </span>
        </p> */}
        <p className="text-sm text-gray-200 mt-2">
          We've sent a confirmation email to your registered address.
        </p>
      </div>
    </div>
  );
};

export default ApplicationCompletedSection;
