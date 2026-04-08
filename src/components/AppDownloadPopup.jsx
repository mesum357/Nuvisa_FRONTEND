"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { X, ChevronLeft, Loader2 } from "lucide-react";
import axios from "axios";
import CalendarIcon from '../../assets/calendar.png';
import flightsIcon from '../../assets/flights.png';
import Image from "next/image";
import { getDynamicMonthText } from "@/utils/getDynamicMonthText";
import { getAdminApiBase } from "@/utils/adminApiBase";

const Images = {
  CalenderIcon: CalendarIcon,
  FlightsIcon: flightsIcon,
};

const DEFAULT_POPUP_STATE = {
  isActive: true,
  triggerDelaySeconds: 45,
  showOnDates: [],
};

const parsePopupState = (value) => {
  if (!value) return DEFAULT_POPUP_STATE;

  try {
    const parsed = JSON.parse(value);
    return {
      isActive: typeof parsed?.isActive === 'boolean' ? parsed.isActive : DEFAULT_POPUP_STATE.isActive,
      triggerDelaySeconds: Math.max(0, Number(parsed?.triggerDelaySeconds) || DEFAULT_POPUP_STATE.triggerDelaySeconds),
      showOnDates: Array.isArray(parsed?.showOnDates)
        ? parsed.showOnDates.map((item) => String(item).trim()).filter(Boolean)
        : [],
    };
  } catch {
    return DEFAULT_POPUP_STATE;
  }
};

const getFallbackPopupContent = () => ({
  isActive: true,
  triggerDelaySeconds: 45,
  showOnDates: [],
  mainHeading: '❤️ NEW CUSTOMER OFFER - £129 fee for your first visa',
  subHeading: 'Auto-booking appointment',
  offerPrice: '£129',
  originalPrice: '£100',
  continueButtonText: 'Continue',
  lastQuestionButtonText: 'Check Required Documents',
  imageUrl: '/image/popupnew.png',
  conciergeTitle: 'Concierge Assistance',
  conciergePrice: '£35',
  conciergeOfferPrice: 'Free',
  lastChanceText: 'Last chance (ends soon) Until {month} {year}!',
  questions: [
    { id: 'q1', text: 'Status in United Kingdom', type: 'OPTIONS', options: ['UK BRP', 'UK ILR', 'UK BRC', 'UK Citizen'] },
    { id: 'q2', text: 'Schengen visa refused during the past three years?', type: 'OPTIONS', options: ['Yes', 'No'] },
    { id: 'q3', text: 'Main purpose of the journey', type: 'TEXT', options: [] },
    { id: 'q4', text: 'Help us with your Phone Number', type: 'TEXT', options: [] },
  ],
});

const AppDownloadPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  const [dbContent, setDbContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const questions = dbContent?.questions || [];
  const totalSteps = questions.length;

  useEffect(() => {
    const fetchPopupContent = async () => {
      try {
        const adminBase = getAdminApiBase();
        const [popupResponse, popupStateResponse] = await Promise.all([
          fetch(`${adminBase}/api/popup-content?t=${Date.now()}`),
          fetch(`${adminBase}/api/content?key=popup_state&t=${Date.now()}`),
        ]);

        const popupJson = popupResponse.ok ? await popupResponse.json() : null;
        const popupStateJson = popupStateResponse.ok ? await popupStateResponse.json() : null;

        if (popupJson?.success && popupJson?.data) {
          const fallbackPopupState = {
            isActive: typeof popupJson.data.isActive === 'boolean' ? popupJson.data.isActive : DEFAULT_POPUP_STATE.isActive,
            triggerDelaySeconds: Math.max(0, Number(popupJson.data.triggerDelaySeconds) || DEFAULT_POPUP_STATE.triggerDelaySeconds),
            showOnDates: Array.isArray(popupJson.data.showOnDates)
              ? popupJson.data.showOnDates.map((item) => String(item).trim()).filter(Boolean)
              : DEFAULT_POPUP_STATE.showOnDates,
          };
          const popupState = popupStateJson?.data?.value
            ? parsePopupState(popupStateJson.data.value)
            : fallbackPopupState;
          const mergedContent = {
            ...popupJson.data,
            ...popupState,
          };

          setDbContent(mergedContent);
          const initialAnswers = {};
          mergedContent.questions.forEach((q) => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
        } else {
          const fallback = getFallbackPopupContent();
          setDbContent(fallback);
          const initialAnswers = {};
          fallback.questions.forEach((q) => {
            initialAnswers[q.id] = '';
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        console.error("Error fetching popup content:", err);
        const fallback = getFallbackPopupContent();
        setDbContent(fallback);
        const initialAnswers = {};
        fallback.questions.forEach((q) => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } finally {
        setIsLoadingContent(false);
      }
    };
    fetchPopupContent();
    console.log("Popup content rendered");
  }, []);

  useEffect(() => {
    if (!dbContent || !router.isReady) return;

    const isHomePage = router.pathname === '/' || router.pathname === '/home';
    const hasInteractedThisSession = sessionStorage.getItem("popupSessionStatus");
    const today = new Date().toISOString().slice(0, 10);
    const showOnDates = Array.isArray(dbContent.showOnDates) ? dbContent.showOnDates : [];
    const matchesDateRule = showOnDates.length === 0 || showOnDates.includes(today);
    const delayMs = Math.max(0, Number(dbContent.triggerDelaySeconds) || 45) * 1000;
    
    // DEBUGGING LOGS
    console.log("=== POPUP VISIBILITY DEBUG ===");
    console.log("1. isActive:", dbContent.isActive);
    console.log("2. matchesDateRule:", matchesDateRule, "showOnDates:", showOnDates, "today:", today);
    console.log("3. isHomePage:", isHomePage, "router.pathname:", router.pathname);
    console.log("4. hasInteractedThisSession:", hasInteractedThisSession);
    console.log("5. Will show popup?", isHomePage && hasInteractedThisSession !== "hidden");
    console.log("6. delayMs:", delayMs);
    console.log("=============================");
    
    if (!dbContent.isActive || !matchesDateRule) {
      console.log("❌ Popup hidden: isActive or matchesDateRule failed");
      setIsVisible(false);
      setIsAnimating(false);
      return;
    }

    if (isHomePage && hasInteractedThisSession !== "hidden") {
      console.log("✅ Popup will show after delay:", delayMs, "ms");
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 10);
      }, delayMs);
      return () => clearTimeout(timer);
    }

    console.log("❌ Popup hidden: Not on home page or user already interacted");
    setIsVisible(false);
    setIsAnimating(false);
  }, [router.pathname, router.isReady, dbContent]);
  useEffect(() => {
    setError("");
  }, [answers, currentStep]);

  // Naya Handler: Phone number ko restrict karne ke liye
  const handleAnswerChange = (questionId, value) => {
    const currentQuestion = questions[currentStep];
    const isPhone = currentQuestion.text.toLowerCase().includes('phone') || currentQuestion.text.toLowerCase().includes('number');

    if (isPhone) {
      // Sirf numbers allowed hain
      const onlyNums = value.replace(/[^0-9]/g, '');
      setAnswers(prev => ({ ...prev, [questionId]: onlyNums }));
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentStep];
    const currentAnswer = answers[currentQuestion.id] || "";

    if (!currentAnswer.trim()) {
      setError("This field is required.");
      return;
    }

    // Phone Number Validation (At least 10 digits)
    const isPhone = currentQuestion.text.toLowerCase().includes('phone') || currentQuestion.text.toLowerCase().includes('number');
    if (isPhone && currentAnswer.length < 10) {
      setError("Please enter a valid number (at least 10 digits).");
      return;
    }

    if (currentStep === totalSteps - 1) {
      setIsSubmitting(true);
      setError("");
      
      const getQuestionAnswer = (keyword) => {
        const question = questions.find((q) => q.text.toLowerCase().includes(keyword));
        return question ? answers[question.id] : '';
      };

      const payload = {
        phone: getQuestionAnswer('phone'),
        uk_status: getQuestionAnswer('status'),
        schengen_refused: getQuestionAnswer('refused'),
        journey_purpose: getQuestionAnswer('purpose'),
        dynamicAnswers: answers, 
      };

      try {
        const response = await axios.post('/api/popup-submissions', payload);
        if (response.data.success || response.data.message?.includes("successfully")) {
          sessionStorage.setItem("popupSessionStatus", "hidden");
          router.push("/get-the-visa#required-documents");
        } else {
          setError(response.data.error || "Server failed to save data.");
          setIsSubmitting(false);
        }
      } catch (err) {
        setError("Database connection issue.");
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closePopup = () => {
    setIsAnimating(false);
    sessionStorage.setItem("popupSessionStatus", "hidden");
    setTimeout(() => setIsVisible(false), 500);
  };

  if (!isVisible || isLoadingContent || !dbContent) return null;

  const ProgressBar = ({ activeStep, total }) => (
    <div className="flex gap-1 justify-center mb-3 mt-2">
      {[...Array(total)].map((_, i) => (
        <div key={i} className={`h-1 w-6 rounded-full transition-all duration-300 ${i <= activeStep ? 'bg-blue-800' : 'bg-gray-600'}`}></div>
      ))}
    </div>
  );
  
  const currentQuestion = questions[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-9999 py-0 px-2 sm:px-4">
      <div className={`bg-[#23232B] rounded-t-3xl md:rounded-2xl max-w-5xl w-full relative shadow-2xl overflow-hidden flex flex-col md:flex-row h-fit max-h-[95vh] md:max-h-[620px] border-t border-x border-gray-700 
      transition-all duration-1500 ease-out transform
      ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        
        <div className="absolute top-3 left-3 z-30">
          {currentStep > 0 && (
            <button onClick={handleBack} className="text-white hover:text-gray-300 p-1" disabled={isSubmitting}>
              <ChevronLeft size={30} />
            </button>
          )}
        </div>
        <button onClick={closePopup} className="absolute top-3 right-3 text-gray-600 hover:text-gray-700 z-30 p-1">
          <X size={30} />
        </button>

        <div className="flex-1 p-5 sm:p-7 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center shrink-0">
            <img src="/image/logo.png" alt="Logo" className="w-[130px] mb-2" />
            <div className="border-b border-gray-600 w-full text-center pb-2">
              <h2 className="text-[18px] sm:text-[25px] font-bold text-white leading-tight">
                {dbContent.mainHeading}
              </h2>
            </div>
            
            <div className="w-full space-y-2 mt-3 mb-4">
              <div className="flex justify-between items-center text-[15px]">
                <div className="flex items-center gap-2">
                  <div className="overflow-hidden">
                    <Image src={Images.CalenderIcon} width={30} height={30} className="rounded-lg" />
                  </div>
                  <span className="text-gray-300">{dbContent.subHeading}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white line-through">{dbContent.originalPrice}</span>
                  <span className="text-blue-700 font-medium bg-white px-2 py-0.5 rounded-full border border-blue-400/20">
                    {dbContent.offerPrice === "0" || dbContent.offerPrice.toLowerCase() === "free" ? "Free" : dbContent.offerPrice}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[15px] border-b border-gray-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className="overflow-hidden">
                    <Image src={Images.FlightsIcon} width={30} height={30} className="rounded-lg" />
                  </div>
                  <span className="text-gray-300">{dbContent.conciergeTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white line-through">{dbContent.conciergePrice}</span>
                  <span className="text-blue-700 font-medium bg-white px-2 py-0.5 rounded-full border border-blue-400/20">{dbContent.conciergeOfferPrice}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex-1 min-h-[250px] flex flex-col justify-between">
            <div className="flex-1">
              {currentQuestion && (
                <div className="animate-in slide-in-from-bottom-8 fade-in duration-500">
                  <h3 className="text-[18px] font-semibold text-white mb-4 text-center">{currentQuestion.text}</h3>
                  
                  {currentQuestion.type === 'TEXT' && (
                    <input 
                      type="text" 
                      inputMode={currentQuestion.text.toLowerCase().includes('phone') ? "numeric" : "text"}
                      value={answers[currentQuestion.id]} 
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)} 
                      className="w-full bg-transparent border-b border-gray-600 py-2 mb-8 text-white text-[15px] outline-none focus:border-blue-500" 
                      placeholder={currentQuestion.text.toLowerCase().includes('phone') ? "Enter your number" : "e.g. Tourism, Business, Medical..."} 
                      disabled={isSubmitting} 
                    />
                  )}

                  {currentQuestion.type === 'OPTIONS' && (
                    <div className="space-y-1 mb-4">
                      {currentQuestion.options.map((opt) => (
                        <label key={opt} className="flex justify-between items-center border-b border-gray-700/50 py-1.5 cursor-pointer hover:bg-white/5 px-2 rounded">
                          <span className="text-gray-300 text-[15px]">{opt}</span>
                          <input type="radio" checked={answers[currentQuestion.id] === opt} onChange={() => handleAnswerChange(currentQuestion.id, opt)} className="w-3.5 h-3.5 accent-blue-600" disabled={isSubmitting} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto">
              {error && <p className="text-red-500 text-[15px] text-center mb-2 animate-pulse font-semibold">{error}</p>}
              <ProgressBar activeStep={currentStep} total={totalSteps} />
              
              <button 
                onClick={handleNext} 
                className="w-full bg-[#7350FF] text-white font-medium py-2.5 rounded-full text-[18px] hover:bg-[#6247D3] transition-all active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  currentStep === totalSteps - 1 ? dbContent.lastQuestionButtonText : dbContent.continueButtonText
                )}
              </button>

              <div className="text-center mt-5">
                <p className="text-white text-[18px]">
                  {getDynamicMonthText(dbContent.lastChanceText)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex md:w-[42%] bg-[#1A1A21] items-center justify-center border-l border-gray-700">
          <img src={dbContent.imageUrl} alt="Offer" className="object-cover w-full h-full opacity-90" />
        </div>
      </div>
    </div>
  );
};

export default AppDownloadPopup;
