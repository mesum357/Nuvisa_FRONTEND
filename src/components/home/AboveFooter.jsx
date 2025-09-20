import React from "react";
import { ArrowUpRight } from "lucide-react";
import GetTheVisaButton from "../layout/GetTheVisaButton";

const AboveFooter = () => {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: 'url("/image/Globally.webp")' }}
      />
      <div className="absolute inset-0 bg-black/30 z-0" />{" "}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="mb-2 text-sm font-semibold text-purple-300 tracking-wider uppercase">
            Our mission
          </div>
          <h2 className="text-4xl md:text-6xl font-gilroy-bold text-white mb-6">
            Streamline your journey –{" "}
            <span className="text-purple-300">Globally.</span>
          </h2>
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-200 mb-8">
              – empowering customers to get more.
            </p>
            <div className="flex justify-center">
              <div className="h-1 w-20 bg-purple-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8 flex items-center flex-col">
          <h2 className="text-3xl md:text-5xl font-gilroy-bold text-white">
            Visa Process, Supercharged.
          </h2>

          {/* Enhanced Glass-like Button */}

          <GetTheVisaButton frosted={true} />
        </div>
      </div>
    </div>
  );
};

export default AboveFooter;
