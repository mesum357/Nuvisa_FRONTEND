import { useState } from "react";

export const useSendStudentVerification = () => {
  const [emailError, setEmailError] = useState("");
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [studentVerificationSent, setStudentVerificationSent] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const sendStudentVerification = async (email, returnTo = null) => {
    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email");
      return false;
    }

    // Check if email appears to be from an educational institution
    const educationalDomains = [
      ".edu",
      ".ac.uk",
      ".edu.au",
      ".edu.ca",
      ".ac.nz",
      ".edu.sg",
      ".uni-",
      ".university",
      ".college",
      ".ac.",
      ".edu.",
    ];
    const isEducationalEmail = educationalDomains.some((domain) =>
      email.toLowerCase().includes(domain)
    );

    if (!isEducationalEmail) {
      setEmailError(
        "Please use your educational institution email address (.edu, .ac.uk, etc.)"
      );
      return false;
    }

    setIsSendingVerification(true);
    setEmailError("");

    try {
      const resp = await fetch("/api/student/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo }),
      });

      const data = await resp.json();
      setIsSendingVerification(false);

      if (resp.ok) {
        setStudentVerificationSent(true);
        setEmailError("");
        return true;
      } else {
        setEmailError(data?.error || "Failed to send verification email");
        return false;
      }
    } catch {
      setIsSendingVerification(false);
      setEmailError("Network error sending verification email");
      return false;
    }
  };

  return {
    sendStudentVerification,
    isSendingVerification,
    emailError,
    studentVerificationSent,
    setEmailError,
    setStudentVerificationSent,
    setIsSendingVerification,
  };
};
