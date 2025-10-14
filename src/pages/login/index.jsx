import { useState } from "react";
import { Mail, KeyRound } from "lucide-react";
import Link from "next/link";

import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { useAppDispatch } from "@/store";
import { login, verifyOtp } from "@/api/auth";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { setAuthId, setAuthState } from "@/store/authSlice";

const Index = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const handleSendVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { email };

    const results = await login(payload, () => {});
    setLoading(false);
    if (/^2\d{2}$/.test(results?.status)) {
      setIsVerificationSent(true);
    }
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

      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen pri_bg grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Image */}
      <div 
        className="hidden lg:flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/image/banner.png')"
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
              <p className="text-sm text-gray-300">
                No NuVisa account?{" "}
                <Link
                  href="/get-the-visa"
                  className="font-medium text-purple-500 hover:text-purple-500"
                >
                  Proceed to checkout 3
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
