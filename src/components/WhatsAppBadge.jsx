import { FaWhatsapp } from "react-icons/fa";

const WhatsAppBadge = () => {
  return (
    <span className="relative -top-px inline-flex items-center gap-1 align-middle text-green-500 text-[0.9em]">
      <FaWhatsapp className="w-3.5 h-3.5" aria-hidden="true" />
      <span>
        WhatsApp
      </span>
    </span>
  );
};

export default WhatsAppBadge;
