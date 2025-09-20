import {
  Mail,
  Phone,
  Globe,
  Shield,
  FileText,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 w-full pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1200px] mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <Link href="/" className="text-xl font-gilroy-bold text-white mb-6">
              NUVisa
            </Link>
            <p className="mb-6 mt-[12px]">
              Efficient and professional visa assistance services. Not
              associated with any governmental agency.
            </p>
            <div className="flex items-center space-x-5">
              {/* Twitter/X */}
              <Link
                href="#"
                className="text-gray-400 hover:text-[#1DA1F2] transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter
                  size={22}
                  className="hover:fill-[#1DA1F2]/20 hover:stroke-[#1DA1F2]"
                />
              </Link>

              {/* Facebook */}
              <Link
                href="#"
                className="text-gray-400 hover:text-[#1877F2] transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook
                  size={22}
                  className="hover:fill-[#1877F2]/20 hover:stroke-[#1877F2]"
                />
              </Link>

              {/* Instagram */}
              <Link
                href="#"
                className="text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#F58529] hover:via-[#3db20b57] hover:to-[#5baf34] transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={22} />
              </Link>

              {/* LinkedIn */}
              <Link
                href="#"
                className="text-gray-400 hover:text-[#0A66C2] transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin
                  size={22}
                  className="hover:fill-[#0A66C2]/20 hover:stroke-[#0A66C2]"
                />
              </Link>

              {/* WhatsApp */}
              <Link
                href="#"
                className="text-gray-400 hover:text-[#25D366] transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                aria-label="WhatsApp"
              >
                <MessageCircle
                  size={22}
                  className="hover:fill-[#25D366]/20 hover:stroke-[#25D366]"
                />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "Get Visa", path: "/" },
                { name: "Application Steps", path: "/application-step" },
                { name: "Dashboard", path: "/dashboard" },
                { name: "Profile", path: "/my-profile" },
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.path}
                    className="hover:text-purple-400 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Support</h4>
            <ul className="space-y-3">
              {[
                { name: "Checkout", path: "/checkout" },
                { name: "Login", path: "/login" },
                // { name: "FAQ", path: "/faq" },
                // { name: "Contact Us", path: "/contact" },
                // { name: "Documentation", path: "/docs" },
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.path}
                    className="hover:text-purple-400 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              Contact Us
            </h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail
                  className="text-purple-400 mr-3 mt-1 flex-shrink-0"
                  size={18}
                />
                <a
                  href="mailto:support@andex.co.uk"
                  className="hover:text-purple-400 transition-colors"
                >
                  support@andex.co.uk
                </a>
              </div>
              <div className="flex items-start">
                <Phone
                  className="text-purple-400 mr-3 mt-1 flex-shrink-0"
                  size={18}
                />
                <a
                  href="tel:+62805687715"
                  className="hover:text-purple-400 transition-colors"
                >
                  +62 805 687 715
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">
                Copyright © 2025 Assmus Ltd. – All Rights Reserved.
              </p>
              <p className="text-sm mt-1">
                No items in an independent company that offers efficient and
                professional assistance in obtaining visa.
              </p>
            </div>

            <div className="flex space-x-6">
              <a
                href="/terms"
                className="text-sm hover:text-purple-400 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-sm hover:text-purple-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/visa"
                className="text-sm hover:text-purple-400 transition-colors"
              >
                Visa Information
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
