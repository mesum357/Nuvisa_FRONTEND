import { Facebook, Instagram, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="pri_bg text-neutral-100 w-full">
      <div className="max-w-7xl mx-auto px-6 pb-8 pt-20">
        {/* Social Media Icons */}
        <div className="flex gap-3 md:gap-4 mb-8 max-md:w-fit max-md:mx-auto">
          <a
            href="#"
            className="text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Twitter className="w-5 h-5 stoke-[1px]" />
          </a>
          <a
            href="#"
            className="text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Facebook className="w-5 h-5 stoke-[1px] fill-neutral-400 text-transparent" />
          </a>
          <a
            href="#"
            className="text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Instagram className="w-5 h-5 stoke-[1px]" />
          </a>
        </div>

        {/* Policy Links */}
        <div className="flex flex-wrap gap-6 mb-12 font-medium text-sm max-md:items-center max-md:gap-3 max-md:gap-y-1 max-md:justify-center">
          <a
            href="#"
            className="text-neutral-100 hover:text-white transition-colors duration-200"
          >
            Terms of service
          </a>
          <a
            href="#"
            className="text-neutral-100 hover:text-white transition-colors duration-200"
          >
            Refund Policy
          </a>
          <a
            href="#"
            className="text-neutral-100 hover:text-white transition-colors duration-200"
          >
            Privacy policy
          </a>
        </div>
        <hr
          className="w-full border-0 my-[33px] h-[1px]"
          style={{ background: "hsla(0, 0%, 100%, 0.056)" }}
        />

        {/* Logo and Company Info Section */}
        <div className="flex w-full flex-col lg:flex-row justify-between items-start lg:items-end">
          {/* Left side - Logo and Company Info */}
          <div className="mb-8 w-full lg:mb-0">
            {/* Logo */}
            <div className="mb-6 w-full flex gap-4 max-md:flex-col justify-between items-center">
              <Link href="/" className="">
                <Image
                  src="/image/logo.png"
                  alt="Icon"
                  width={130}
                  height={20}
                  className="object-contain"
                />{" "}
              </Link>
              <div className="text-neutral-500 text-xs md:text-sm font-medium text-center">
                <p>Copyright © 2025 Nuvisa. - All Rights Reserved.</p>
              </div>
            </div>
            <hr
              className="w-full border-0 my-[33px] h-[1px]"
              style={{ background: "hsla(0, 0%, 100%, 0.056)" }}
            />{" "}
            {/* Company Description */}
            <div className="max-w-2xl mb-4">
              <p className="text-[#ffffff3f] text-[8px] max-md:text-center md:text-[12px] leading-relaxed">
                NuVisa is an independent company that offers efficient and
                professional assistance in obtaining visas and other travel
                products online fast. The company and site are not associated
                with any governmental agency.
                VAT registration no: 412344437 | D‑U‑N‑S Number: 227538057 7. | ICO registration number: ZB732764. Registered Office: 2 Brunel Way, The Future Works, Slough, Greater London, England, SL1 1FQ | support@nuvisa.co.uk | +44 7825528764
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
