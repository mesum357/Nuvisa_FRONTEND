import { useState } from "react";
import { Mail, KeyRound } from "lucide-react";

import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { useAppDispatch } from "@/store";
import { login, verifyOtp } from "@/api/auth";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { setAuthId, setAuthState } from "@/store/authSlice";
import SimpleAlert from "@/components/SimpleAlert";

const Index = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, title: "", message: "" });

  const extractBackendMessage = (results) => {
    try {
      return (
        results?.data?.data?.results?.error ||
        results?.data?.data?.message ||
        results?.data?.message ||
        results?.data?.error ||
        ""
      );
    } catch {
      return "";
    }
  };

  const friendlyLoginMessage = (results) => {
    const status = Number(results?.status) || 0;
    const raw = String(extractBackendMessage(results) || "");
    const lower = raw.toLowerCase();
    if (status === 404 || lower.includes("not exist") || lower.includes("no user")) {
      return "Account doesn’t exist. You may checkout instead.";
    }
    if (status === 400 && lower.includes("email")) {
      return "Please enter a valid email address.";
    }
    if (status === 429 || lower.includes("too many")) {
      return "Too many attempts. Please try again later.";
    }
    return raw || "We couldn't send the code. Please try again.";
  };

  const friendlyOtpMessage = (results) => {
    const status = Number(results?.status) || 0;
    const raw = String(extractBackendMessage(results) || "");
    const lower = raw.toLowerCase();
    if (status === 400 || status === 401 || lower.includes("invalid") || lower.includes("expired")) {
      return "Invalid or expired code. Please request a new one.";
    }
    if (status === 429 || lower.includes("too many")) {
      return "Too many attempts. Please try again later.";
    }
    return raw || "Verification failed. Please try again.";
  };

  const processLoginAttempt = (results) => {
    if (/^2\d{2}$/.test(results?.status)) {
      setIsVerificationSent(true);
      return true;
    } else {
      const message = friendlyLoginMessage(results);
      setAlertState({ isOpen: true, title: "Sign in", message });
      return false;
    }
  };

  const handleSendVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { email };

    const results = await login(payload, () => {});
    setLoading(false);
    processLoginAttempt(results);
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    const results = await login({ email }, () => {});
    setResendLoading(false);
    processLoginAttempt(results);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const payload = { email, otp };

    const results = await verifyOtp(payload, () => {});
    if (/^2\d{2}$/.test(results?.status)) {
      await localStorageGateway(
        "token",
        localStorageEnums.SET,
        results?.data?.data?.results?.token
      );
      await localStorageGateway("userEmail", localStorageEnums.SET, email);

      const token = await localStorageGateway("token", localStorageEnums.GET);
      if (token) {
        await Cookies.set("token", token);
        await Cookies.set(
          "user",
          JSON.stringify(results?.data?.data?.results?.user)
        );
        await Cookies.set("userEmail", email);
        dispatch(setAuthState(true));
        dispatch(setAuthId(results?.data?.data?.results?.user?.id));
      }

      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
      const destination = email === adminEmail ? "/admin" : "/dashboard";
      router.replace(destination);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } else {
      const message = friendlyOtpMessage(results);
      setAlertState({ isOpen: true, title: "Verify OTP", message });
    }
  };

  return (
    <div className="min-h-screen pri_bg grid grid-cols-1 lg:grid-cols-2">
      <SimpleAlert
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((s) => ({ ...s, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        okText="OK"
      />
      {/* Left Side - Image */}
      <div 
        className="hidden lg:flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/image/auth-background.svg')"
        }}
      >
      
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
         
          <h2 className="text-center text-3xl font-extrabold text-white">
            {isVerificationSent ? "Verify OTP" : "Sign in with Email"}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#23232B] py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {!isVerificationSent ? (
              // Step 1: Email Input
              <form className="space-y-6" onSubmit={handleSendVerification}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white"
                  >
                    Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="py-3 pl-10 block w-full border outline-none text-white placeholder:text-gray-300 border-gray-300 rounded-md focus:ring-[2px] focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  {loading ? (
                    <button
                      disabled
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 !cursor-not-allowed"
                    >
                      Sending...
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7350FF] hover:bg-[#6247D3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Send Verification Code
                    </button>
                  )}
                </div>
              </form>
            ) : (
              // Step 2: OTP Input
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-white"
                  >
                    OTP
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="py-3 pl-10 block w-full border outline-none border-gray-300 rounded-md focus:ring-[2px] focus:ring-purple-500 focus:border-purple-500 text-white !placeholder:text-gray-300"
                      placeholder="Enter the OTP"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Verify OTP
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              {!isVerificationSent ? (
                <p className="text-sm text-gray-300">
                  No Nuvisa Account?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/get-the-visa")}
                    className="font-medium text-purple-500 hover:text-purple-500"
                  >
                    Proceed to Checkout
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-300">
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendLoading}
                    className="font-medium text-purple-500 hover:text-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? "Sending..." : "Resend Code"}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
