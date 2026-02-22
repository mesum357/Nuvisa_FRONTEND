import { FaWhatsapp } from "react-icons/fa";

const WhatsAppBadge = () => {
  return (
    <span className="-top-0.5 inline-flex items-center gap-1 align-middle text-green-500">
      <FaWhatsapp className="w-4 h-4" aria-hidden="true" />
      <span style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
        WhatsApp
      </span>
    </span>
  );
};

export default WhatsAppBadge;
