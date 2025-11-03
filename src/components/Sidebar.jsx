"use client";
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfileInfo } from "@/api/profile";
import { logoutFunction } from "@/utils/logoutFunction";
import useParsedUser from "@/hooks/useParsedUser";
import Cookies from "js-cookie";

const Sidebar = ({ isOpen, onClose }) => {
  const { parsedUserData } = useParsedUser();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsappNumber: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef(null);

  // Fetch user profile data from cookie when sidebar opens
  const fetchUserProfile = () => {
    setIsLoading(true);

    // Read directly from cookie every time
    let userCookie = Cookies.get("user");

    if (!userCookie) {
      setIsLoading(false);
      return;
    }

    try {
      // Decode URL-encoded cookie value if needed
      // Cookies.get() should decode it, but sometimes it doesn't
      if (userCookie.includes('%22') || userCookie.includes('%')) {
        try {
          userCookie = decodeURIComponent(userCookie);
        } catch (e) {
          // If decode fails, try parsing as-is
        }
      }

      const parsed = JSON.parse(userCookie);
      // Handle Sequelize model structure - check dataValues first, then root level
      const userData = parsed.dataValues || parsed;

      if (!userData || typeof userData !== 'object') {
        setIsLoading(false);
        return;
      }

      // Extract all possible field variations
      const firstName =
        userData.firstName ||
        userData.first_name ||
        "";

      const lastName =
        userData.lastName ||
        userData.last_name ||
        "";

      const email = userData.email || "";

      // Handle phone_no which might be null
      const phoneNo = userData.phone_no;
      const whatsappNumber =
        userData.whatsappNumber ||
        (phoneNo !== null && phoneNo !== undefined ? String(phoneNo) : "") ||
        userData.phoneNo ||
        userData.phoneNumber ||
        userData.phone ||
        "";

      // Set form data - even if some fields are empty
      setFormData({
        firstName: String(firstName || ""),
        lastName: String(lastName || ""),
        email: String(email || ""),
        whatsappNumber: String(whatsappNumber || ""),
      });

      setIsLoading(false);
    } catch (error) {
      // If parsing fails, try to get at least email from token
      try {
        const token = Cookies.get("token");
        if (token && token.includes('.')) {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const userEmail = payload._email || payload.email;
            if (userEmail) {
              setFormData({
                firstName: "",
                lastName: "",
                email: String(userEmail),
                whatsappNumber: "",
              });
            }
          }
        }
      } catch (tokenError) {
        // Both cookie and token parsing failed
      }
      setIsLoading(false);
    }
  };

  // Fetch user data when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        event.target.closest(".sidebar-backdrop")
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const token = Cookies.get("token");
      if (!token) {
        alert("Please login again");
        setIsUpdating(false);
        return;
      }

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNo: formData.whatsappNumber,
      };

      const response = await updateProfileInfo(token, payload);

      // Check if update was successful
      if (response?.status === 200 || response?.status === 201) {
        // Get updated user data from response
        const responseData =
          response?.data?.data?.results ||
          response?.data?.data?.data ||
          response?.data?.data ||
          response?.data ||
          {};

        // Update local cookie with fresh data from API
        const updatedUser = {
          id: responseData.id || parsedUserData?.id,
          firstName: responseData.first_name || formData.firstName,
          lastName: responseData.last_name || formData.lastName,
          first_name: responseData.first_name || formData.firstName,
          last_name: responseData.last_name || formData.lastName,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: responseData.email || formData.email,
          phone_no: responseData.phone_no || formData.whatsappNumber,
          phoneNumber: responseData.phone_no || formData.whatsappNumber,
          phone: responseData.phone_no || formData.whatsappNumber,
          whatsappNumber: responseData.phone_no || formData.whatsappNumber,
        };

        Cookies.set("user", JSON.stringify(updatedUser));

        // Close sidebar after successful update
        onClose();
        window.location.reload();
      } else {
        alert(response?.data?.message);
        return;
      }
    } catch (error) {
      // Error is handled by apigateway
      setIsUpdating(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    onClose();
    logoutFunction();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 sidebar-backdrop"
            onClick={onClose}
          />
          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#7350FF] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white text-lg font-semibold">
                Update your profile
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close sidebar"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading profile data...</div>
                </div>
              ) : (
                <>
                  {/* Name Fields - Side by Side */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7350FF] focus:border-[#7350FF] outline-none transition text-gray-900 placeholder-gray-400"
                      />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7350FF] focus:border-[#7350FF] outline-none transition text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7350FF] focus:border-[#7350FF] outline-none transition text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* WhatsApp Number Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number
                    </label>
                    <input
                      type="number"
                      name="whatsappNumber"
                      value={formData.whatsappNumber}
                      onChange={handleInputChange}
                      placeholder="WhatsApp Number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7350FF] focus:border-[#7350FF] outline-none transition text-gray-900 placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="w-full bg-[#7350FF] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#6350E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Updating..." : "Update"}
                  </button>
                </>
              )}
            </div>

            {/* Logout Button */}
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={handleLogout}
                className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;

