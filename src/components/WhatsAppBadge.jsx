import { FaWhatsapp } from "react-icons/fa";

const WhatsAppBadge = () => {
  return (
    <span className="relative -top-px inline-flex items-center gap-0.5 align-middle text-green-500 leading-none">
      <FaWhatsapp className="w-6 h-6" aria-hidden="true" />
      <span className="text-sm font-semibold tracking-tight">
        WhatsApp
      </span>
    </span>
  );
};

export default WhatsAppBadge;
