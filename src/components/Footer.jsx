import { Facebook, Instagram, Twitter } from "lucide-react";
import { twitter } from '../../public/image/twitter.png';
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchFooterContent, getFooterContentByKey } from "@/api/footerContent";

const Footer = () => {
  const [footerContent, setFooterContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFooterContent = async () => {
      try {
        setLoading(true);
        const content = await fetchFooterContent();
        setFooterContent(content);
      } catch (error) {
        console.error('Failed to load footer content:', error);
        setFooterContent([]);
      } finally {
        setLoading(false);
      }
    };

    loadFooterContent();
  }, []);

  // Helper function to get content with fallback
  const getContent = (key, fallback = '') => {
    if (loading) return '';
    return getFooterContentByKey(footerContent, key) || '';
  };

  return (
    <footer className="pri_bg text-neutral-100 w-full">
      <div className="max-w-7xl mx-auto px-6 pb-8 pt-20">
        {/* Social Media Icons */}
        <div className="flex gap-3 md:gap-4 mb-8 max-md:w-fit max-md:mx-auto">
          <a
            href={getContent('social_twitter_url')}
            className="text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Image
                  src="/image/twitter.png"
                  alt="Icon"
                  width={18}
                  height={18}
                />
          </a>
          <a
            href={getContent('social_facebook_url')}
            className="text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Facebook className="w-5 h-5 stoke-[1px] fill-neutral-400 text-transparent" />
          </a>
          <a
            href={getContent('social_instagram_url')}
            className="text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Instagram className="w-5 h-5 stoke-[1px]" />
          </a>
        </div>

        {/* Policy Links */}
        <div className="flex flex-wrap gap-6 mb-12 font-medium text-sm max-md:items-center max-md:gap-3 max-md:gap-y-1 max-md:justify-center">
          <Link
            href="/faq"
            className="text-neutral-100 hover:text-white transition-colors duration-200"
          >
            FAQs
          </Link>
          <Link
            href="/terms-of-service"
            className="text-neutral-100 hover:text-white transition-colors duration-200"
          >
            Terms of Service
          </Link>
          <Link
            href="/refund-policy"
            className="text-neutral-100 hover:text-white transition-colors duration-200"
          >
            Refund Policy
          </Link>
          <Link
            href="/privacy-policy"
            className="text-neutral-100 hover:text-white transition-colors duration-200"
          >
            Privacy Policy
          </Link>
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
                  priority
                />{" "}
              </Link>
              <div className="text-neutral-500 text-xs md:text-sm font-medium text-center">
                <p>{getContent('company_copyright')}</p>
              </div>
            </div>
            <hr
              className="w-full border-0 my-[33px] h-[1px]"
              style={{ background: "hsla(0, 0%, 100%, 0.056)" }}
            />{" "}
            {/* Company Description */}
            <div className="max-w-2xl mb-4">
              <p className="text-[#ffffff3f] text-[8px] max-md:text-center md:text-[12px] leading-relaxed">
                {getContent('company_description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
