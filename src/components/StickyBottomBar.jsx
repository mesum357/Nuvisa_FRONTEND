import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { Gift, Shield, Plus, Minus, ShoppingCart, ArrowUpRight, ChevronUp, ChevronDown  ,  UserIcon} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store";
import { setTravelers, setReduxInsuranceCount, setReduxGiftCardCount, setRecommendedItems, setRequiredDocuments, setVisaFees, setInsuranceFees, setGiftCardFees, setTotalAmount, setInsuranceOnly, triggerDocumentValidation } from "@/store/visaSlice";
import { useToast } from "@/contexts/ToastContext";
import Drawer from "./Drawer";


const StickyBottomBar = () => {
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);
  const router = useRouter();
  const { showSuccess } = useToast();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const barRef = useRef(null);
  const [barHeight, setBarHeight] = useState(0);
  
  // Get traveler, insurance, and gift card counts from Redux store
  const travelerCount = visaState.travelers || 0;
  const insuranceCount = visaState.insuranceCount || 0;
  const giftCardCount = visaState.giftCardCount || 0;
  const recommendedItems = visaState.recommendedItems;
  const requiredDocuments = visaState.requiredDocuments || {};
  
  // Refs to track previous values for toast notifications
  const prevTravelerCountRef = useRef(travelerCount);
  const prevInsuranceCountRef = useRef(insuranceCount);
  const prevGiftCardCountRef = useRef(giftCardCount);
  const isInitialMountTravelerRef = useRef(true);
  const isInitialMountInsuranceRef = useRef(true);
  const isInitialMountGiftCardRef = useRef(true);

  const [quantities, setQuantities] = useState({
    schengen: travelerCount,
    insurance: insuranceCount,
    giftCard: giftCardCount
  });

  const perDayInsurancePrice = 2;
  const DEFAULT_INSURANCE_DAYS = 15;
  
  // Memoize visa fee calculation
  const visaFeePerTraveler = useMemo(() => {
    if (visaState.selectedVisaType?.priceGBP)
      return Number(visaState.selectedVisaType.priceGBP);
    if (visaState.selectedVisaType?.price) {
      const converted = Math.round(
        Number(visaState.selectedVisaType.price) / 100
      );
      if (converted > 0) return converted;
    }
    return 129;
  }, [visaState.selectedVisaType?.priceGBP, visaState.selectedVisaType?.price]);

  // Memoize insurance days calculation
  const insuranceDays = useMemo(() => {
    try {
      const arrivalStr = visaState.arrivalDate;
      const departureStr = visaState.departureDate;
      if (!arrivalStr || !departureStr) return DEFAULT_INSURANCE_DAYS;
      const arrival = new Date(arrivalStr);
      const departure = new Date(departureStr);
      if (Number.isNaN(arrival) || Number.isNaN(departure)) {
        return DEFAULT_INSURANCE_DAYS;
      }
      arrival.setHours(0, 0, 0, 0);
      departure.setHours(0, 0, 0, 0);
      const diffTime = departure.getTime() - arrival.getTime();
      if (diffTime < 0) return 1;
      const inclusiveDays = Math.max(
        1,
        Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      );
      return inclusiveDays;
    } catch {
      return DEFAULT_INSURANCE_DAYS;
    }
  }, [visaState.arrivalDate, visaState.departureDate]);

  // Memoize insurance base fees
  const insuranceBaseFees = useMemo(() => {
    if (
      !recommendedItems?.insuranceCertificate ||
      !quantities.insurance ||
      quantities.insurance <= 0
    ) {
      return 0;
    }
    const effectiveDays = Math.max(insuranceDays || 0, 1);
    return perDayInsurancePrice * effectiveDays * quantities.insurance;
  }, [recommendedItems?.insuranceCertificate, quantities.insurance, insuranceDays]);

  // Sync local state with Redux state when it changes
  useEffect(() => {
    setQuantities(prev => ({
      ...prev,
      schengen: travelerCount,
      insurance: insuranceCount,
      giftCard: giftCardCount
    }));
  }, [travelerCount, insuranceCount, giftCardCount]);

  // Toast notifications for crossing threshold limits
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountTravelerRef.current) {
      prevTravelerCountRef.current = travelerCount;
      isInitialMountTravelerRef.current = false;
      return;
    }

    const prevTravelers = prevTravelerCountRef.current;
    const currentTravelers = travelerCount;
    
    // Only show toast if value changed and crossed the threshold
    if (prevTravelers !== currentTravelers) {
      if (prevTravelers < 3 && currentTravelers >= 3) {
        showSuccess("Group discount unlocked! 20% off for 3+ travellers");
      } else if (prevTravelers >= 3 && currentTravelers < 3) {
        showSuccess("Group discount removed — fewer than 3 travellers");
      }
      prevTravelerCountRef.current = currentTravelers;
    }
  }, [travelerCount, showSuccess]);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountInsuranceRef.current) {
      prevInsuranceCountRef.current = insuranceCount;
      isInitialMountInsuranceRef.current = false;
      return;
    }

    const prevInsurance = prevInsuranceCountRef.current;
    const currentInsurance = insuranceCount;
    
    // Only show toast if value changed and crossed the threshold
    if (prevInsurance !== currentInsurance) {
      if (prevInsurance < 3 && currentInsurance >= 3) {
        showSuccess("Insurance group discount unlocked! 20% off for 3+ insurances");
      } else if (prevInsurance >= 3 && currentInsurance < 3) {
        showSuccess("Insurance group discount removed — fewer than 3 insurances");
      }
      prevInsuranceCountRef.current = currentInsurance;
    }
  }, [insuranceCount, showSuccess]);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountGiftCardRef.current) {
      prevGiftCardCountRef.current = giftCardCount;
      isInitialMountGiftCardRef.current = false;
      return;
    }

    const prevGiftCard = prevGiftCardCountRef.current;
    const currentGiftCard = giftCardCount;
    
    // Only show toast if value changed and crossed the threshold
    if (prevGiftCard !== currentGiftCard) {
      if (prevGiftCard < 3 && currentGiftCard >= 3) {
        showSuccess("Gift card group discount unlocked! 20% off for 3+ gift cards");
      } else if (prevGiftCard >= 3 && currentGiftCard < 3) {
        showSuccess("Gift card group discount removed — fewer than 3 gift cards");
      }
      prevGiftCardCountRef.current = currentGiftCard;
    }
  }, [giftCardCount, showSuccess]);

  const items = [
    {
      id: 'schengen',
      title: 'Schengen visa from the UK',
      originalPrice: 200,
      currentPrice: 129,
      badge: 'Travellers',
    
    },
    {
      id: 'insurance',
      title: 'Insurance Certificate',
      originalPrice: 45,
      currentPrice: 30,
      badge: null,
      badgeCount: null
    },
    {
      id: 'giftCard',
      title: 'NUvisa Digital Gift Card',
      originalPrice: 245,
      currentPrice: 159,
      badge: null,
      badgeCount: null
    }
  ];

  // Memoize updateQuantity to prevent unnecessary re-renders
  const updateQuantity = useCallback((itemId, change) => {
    setQuantities(prev => {
      let newQuantity = Math.max(0, prev[itemId] + change);

      // Apply constraints based on item type
      if (itemId === 'insurance') {
        // Insurance count cannot exceed traveler count and must be at least 0
        newQuantity = Math.max(0, Math.min(newQuantity, travelerCount));
      }

      const updated = {
        ...prev,
        [itemId]: newQuantity
      };

      // Update Redux store based on item type
      if (itemId === 'schengen') {
        dispatch(setTravelers(newQuantity));

        // If traveler count decreases, adjust insurance count if needed
        if (newQuantity < prev.insurance) {
          const adjustedInsuranceCount = Math.min(prev.insurance, newQuantity);
          updated.insurance = adjustedInsuranceCount;
          dispatch(setReduxInsuranceCount(adjustedInsuranceCount));
        }
      } else if (itemId === 'insurance') {
        dispatch(setReduxInsuranceCount(newQuantity));

        // Update recommendedItems based on quantity
        const newRecommendedItems = {
          ...recommendedItems,
          insuranceCertificate: newQuantity > 0
        };
        dispatch(setRecommendedItems(newRecommendedItems));
      } else if (itemId === 'giftCard') {
        dispatch(setReduxGiftCardCount(newQuantity));

        // Update recommendedItems based on quantity
        const newRecommendedItems = {
          ...recommendedItems,
          giftCard: newQuantity > 0
        };
        dispatch(setRecommendedItems(newRecommendedItems));
      }

      return updated;
    });
  }, [travelerCount, recommendedItems, dispatch]);

  // Memoize total items calculation
  const totalItems = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  }, [quantities]);

  // NEW DISCOUNT CALCULATION LOGIC - matching OrderCheckout.jsx and Slider.jsx
  // Memoized to prevent recalculation on every render
  const discountedPrices = useMemo(() => {
    // Base discounted prices (not original prices)
    const baseDiscountedVisaFees = visaFeePerTraveler * quantities.schengen;
    const baseDiscountedInsuranceFees = insuranceBaseFees;
    const baseDiscountedGiftCardFees = recommendedItems?.giftCard ? 159 * quantities.giftCard : 0;

    // Check if any component qualifies for quantity discount (3+)
    // Note: Insurance count cannot exceed traveler count (insurance certificates are for travelers)
    const effectiveInsuranceCount = Math.min(quantities.insurance, quantities.schengen);
    
    const travelersQualify = quantities.schengen >= 3;
    const insuranceQualify = effectiveInsuranceCount >= 3;
    const giftCardQualify = quantities.giftCard >= 3;

    // Apply coupon discounts from Redux state
    const appliedDiscount = visaState.appliedDiscount;
    const hasStudentDiscount = appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount = appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalVisaFees = baseDiscountedVisaFees;
    let finalInsuranceFees = baseDiscountedInsuranceFees;
    let finalGiftCardFees = baseDiscountedGiftCardFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (travelersQualify) {
      const quantityDiscount = (finalVisaFees * 20) / 100;
      finalVisaFees = finalVisaFees - quantityDiscount;
    }
    if (insuranceQualify && recommendedItems?.insuranceCertificate) {
      const quantityDiscount = (finalInsuranceFees * 20) / 100;
      finalInsuranceFees = finalInsuranceFees - quantityDiscount;
    }
    if (giftCardQualify && recommendedItems?.giftCard) {
      const quantityDiscount = (finalGiftCardFees * 20) / 100;
      finalGiftCardFees = finalGiftCardFees - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        if (travelersQualify && finalVisaFees === baseDiscountedVisaFees) {
          const quantityDiscount = (finalVisaFees * 20) / 100;
          finalVisaFees = finalVisaFees - quantityDiscount;
        }
        if (insuranceQualify && recommendedItems?.insuranceCertificate && finalInsuranceFees === baseDiscountedInsuranceFees) {
          const quantityDiscount = (finalInsuranceFees * 20) / 100;
          finalInsuranceFees = finalInsuranceFees - quantityDiscount;
        }
        if (giftCardQualify && recommendedItems?.giftCard && finalGiftCardFees === baseDiscountedGiftCardFees) {
          const quantityDiscount = (finalGiftCardFees * 20) / 100;
          finalGiftCardFees = finalGiftCardFees - quantityDiscount;
        }
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount) {
      const studentDiscount = (finalVisaFees * 10) / 100;
      finalVisaFees = finalVisaFees - studentDiscount;
      if (recommendedItems?.insuranceCertificate) {
        const studentDiscount = (finalInsuranceFees * 10) / 100;
        finalInsuranceFees = finalInsuranceFees - studentDiscount;
      }
      if (recommendedItems?.giftCard) {
        const studentDiscount = (finalGiftCardFees * 10) / 100;
        finalGiftCardFees = finalGiftCardFees - studentDiscount;
      }
    }

    return {
      visa: finalVisaFees,
      insurance: finalInsuranceFees,
      giftCard: finalGiftCardFees,
      total: finalVisaFees + finalInsuranceFees + finalGiftCardFees
    };
  }, [
    visaFeePerTraveler,
    quantities,
    insuranceBaseFees,
    recommendedItems,
    visaState.appliedDiscount
  ]);

  // Memoized helper function to get individual item discounted price
  const getItemDiscountedPrice = useCallback((itemId) => {
    switch(itemId) {
      case 'schengen':
        return discountedPrices.visa;
      case 'insurance':
        return discountedPrices.insurance;
      case 'giftCard':
        return discountedPrices.giftCard;
      default:
        return 0;
    }
  }, [discountedPrices]);


  // Memoize handleAddToCart to prevent unnecessary re-renders
  const handleAddToCart = useCallback(() => {
    // Always trigger document validation when Add to Cart is clicked
    dispatch(triggerDocumentValidation());

    // Use memoized discounted prices
    dispatch(setVisaFees(Math.round(discountedPrices.visa)));
    dispatch(setInsuranceFees(Math.round(discountedPrices.insurance)));
    dispatch(setGiftCardFees(Math.round(discountedPrices.giftCard)));
    dispatch(setTotalAmount(Math.round(discountedPrices.total)));
    dispatch(setRequiredDocuments(requiredDocuments));
    dispatch(setRecommendedItems(recommendedItems));

    // Navigate to get the visa page instead of checkout
    router.push('/get-the-visa#add-to-cart');
  }, [discountedPrices, requiredDocuments, recommendedItems, dispatch, router]);

  // Optimize scroll handler using Intersection Observer for footer and throttled scroll for visibility
  useEffect(() => {
    let ticking = false;
    let lastScrollY = 0;
    let footerObserver = null;
    let isFooterVisible = false;

    // Use Intersection Observer for footer visibility (more efficient than getBoundingClientRect)
    const footerElement = document.querySelector('footer');
    if (footerElement) {
      footerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isFooterVisible = entry.isIntersecting;
            // Update visibility when footer visibility changes
            if (ticking === false) {
              updateVisibility();
            }
          });
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: 0.1, // Trigger when 10% of footer is visible
        }
      );
      footerObserver.observe(footerElement);
    }

    const updateVisibility = () => {
      ticking = false;
      const scrollPosition = window.scrollY;
      
      // Only update if scroll position changed significantly (reduces unnecessary updates)
      if (Math.abs(scrollPosition - lastScrollY) < 50 && scrollPosition > 1500) {
        return; // Skip if scroll change is minimal
      }
      lastScrollY = scrollPosition;

      // Show when scrolled enough (1500px from top)
      const hasScrolledEnough = scrollPosition > 1500;
      
      // Update state only if visibility actually changed
      const shouldBeVisible = hasScrolledEnough && !isFooterVisible;
      setIsVisible(prev => prev !== shouldBeVisible ? shouldBeVisible : prev);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateVisibility);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    updateVisibility();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (footerObserver && footerElement) {
        footerObserver.unobserve(footerElement);
        footerObserver.disconnect();
      }
    };
  }, []);

  // Measure sticky bar height to offset drawer
  useEffect(() => {
    if (!isVisible) return;
    const measure = () => {
      if (barRef.current) setBarHeight(barRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isVisible]);

  // Re-measure when drawer toggles (layout may shift)
  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(() => {
      if (barRef.current) setBarHeight(barRef.current.offsetHeight);
    }, 50);
    return () => clearTimeout(t);
  }, [isDrawerOpen, isVisible]);

  // Auto-close drawer on lg and above
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDrawerOpen]);

  if (!isVisible) return null;

  return (
    <>
    <div ref={barRef} className={`fixed bottom-0 left-0 right-0 z-[70] bg-[#1e1e27] ${isDrawerOpen ? 'shadow-none' : 'shadow-2xl'} animate-slide-up`}>
      <div className="mx-auto px-4 sm:px-10 py-4">
        {/* Desktop Layout (lg and above) */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          
          {/* Travellers Section - Left Side */}
          <div className="flex items-center gap-3 text-white">
            {items.filter(item => item.id === 'schengen').map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-white">
                {/* Item Info */}
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-white mb-1">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through text-sm">
                      £{quantities[item.id] > 0 ? item.originalPrice * quantities[item.id] : item.originalPrice}
                    </span>
                    <span className="text-white font-bold">
                      £{quantities[item.id] > 0 ? getItemDiscountedPrice(item.id).toFixed(2) : item.currentPrice}
                    </span>
                    {item.badge && (
                      <div className="flex items-center gap-1">
                        <div className="text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1" style={{backgroundColor: '#6B4EFF'}}>
                   <UserIcon className="fill-white max-sm:w-3 max-sm:h-3" />
                          {item.badge}
                        </div>
                        
                        
                        {/* Quantity Controls - with Travellers badge */}
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={quantities[item.id] === 0}
                            className="w-8 h-8 rounded-full text-white flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            style={{backgroundColor: '#6B4EFF'}}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#5A3FE6';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#6B4EFF';
                            }}
                          >
                            <Minus className="w-4 h-4 text-white" strokeWidth={3} />
                          </button>
                          <span className="w-8 text-center text-white font-bold text-lg">
                            {quantities[item.id]}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors"
                            style={{backgroundColor: '#6B4EFF'}}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#5A3FE6';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#6B4EFF';
                            }}
                          >
                            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Center Section - Insurance Certificate and Gift Card */}
          <div className="flex items-center gap-4 justify-center flex-1">
            {items.filter(item => item.id === 'insurance' || item.id === 'giftCard').map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-white">
                {/* Background Container for Insurance Certificate and Gift Card */}
                <div className="bg-[#24242D] rounded-2xl px-6 py-3 flex items-center gap-3 min-w-[280px]">
                  {/* Item Image */}
                  <Image 
                    src={item.id === 'insurance' ? '/image/certificatee.jpg' : '/image/gitftnewcard.png'}
                    alt={item.title}
                    width={64}
                    height={48}
                    className="w-16 h-12 rounded-lg object-contain flex-shrink-0 bg-white/10"
                    priority
                  />
                  {/* Item Info */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium text-white mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 line-through text-sm">
                        £{quantities[item.id] > 0 ? item.originalPrice * quantities[item.id] : item.originalPrice}
                      </span>
                      <span className="text-white font-bold">
                        £{quantities[item.id] > 0 ? getItemDiscountedPrice(item.id).toFixed(2) : item.currentPrice}
                      </span>
                      
                      {/* Quantity Controls - inline with price */}
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={quantities[item.id] === 0}
                          className="w-6 h-6 rounded-full text-white flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                          style={{backgroundColor: quantities[item.id] === 0 ? '#6b7280' : '#6B4EFF'}}
                          onMouseEnter={(e) => {
                            if (quantities[item.id] > 0) {
                              e.target.style.backgroundColor = '#5A3FE6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (quantities[item.id] > 0) {
                              e.target.style.backgroundColor = '#6B4EFF';
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-white font-medium text-sm">
                          {quantities[item.id]}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-full text-white flex items-center justify-center transition-colors"
                          style={{backgroundColor: '#6B4EFF'}}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#5A3FE6';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#6B4EFF';
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quantities[item.id] > 0}
                        onChange={() => updateQuantity(item.id, quantities[item.id] > 0 ? -quantities[item.id] : 1)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{'--tw-bg-opacity': quantities[item.id] > 0 ? '1' : '0', backgroundColor: quantities[item.id] > 0 ? '#6B4EFF' : '#6b7280'}}></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add to Cart Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleAddToCart}
              className="text-white px-8 py-3 rounded-full font-semibold text-lg flex items-center gap-2  min-w-[200px] justify-center"
              style={{backgroundColor: '#6B4EFF'}}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#5A3FE6';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#6B4EFF';
              }}
              disabled={totalItems === 0}
            >
              ADD TO CART
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center ml-2">
                <ArrowUpRight className="w-4 h-4" style={{color: '#6B4EFF'}} />
              </div>
            </button>
           
          </div>

        </div>

        {/* Mobile/Tablet Layout (max-lg) */}
        <div className="lg:hidden">
          {/* Pair with Button - always visible, toggles drawer */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="w-full bg-[#24242D] rounded-2xl px-4 py-3 mb-3 flex items-center justify-between text-white hover:bg-[#2a2a35] transition-colors"
          >
            <span className="font-medium">Pair with</span>
            {isDrawerOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {/* Schengen Visa Section - Full Width - Always visible and functional */}
          <div className="mb-3 relative z-[80]">
            {items.filter(item => item.id === 'schengen').map((item) => (
              <div key={item.id} className="bg-[#24242D] rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col flex-1">
                    <h3 className="text-sm font-medium text-white mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 line-through text-sm">
                        £{quantities[item.id] > 0 ? item.originalPrice * quantities[item.id] : item.originalPrice}
                      </span>
                      <span className="text-white font-bold">
                        £{quantities[item.id] > 0 ? getItemDiscountedPrice(item.id).toFixed(2) : item.currentPrice}
                      </span>
                      {item.badge && (
                        <div className="text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1" style={{backgroundColor: '#6B4EFF'}}>
                          <UserIcon className="w-3 h-3" />
                          {item.badge}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quantity Controls - Ensure they work regardless of drawer state */}
                  <div className="flex items-center gap-2 relative z-[90]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, -1);
                      }}
                      disabled={quantities[item.id] === 0}
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                      style={{backgroundColor: quantities[item.id] === 0 ? '#6b7280' : '#6B4EFF'}}
                      onMouseEnter={(e) => {
                        if (quantities[item.id] > 0) {
                          e.target.style.backgroundColor = '#5A3FE6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (quantities[item.id] > 0) {
                          e.target.style.backgroundColor = '#6B4EFF';
                        } else {
                          e.target.style.backgroundColor = '#6b7280';
                        }
                      }}
                    >
                      <Minus className="w-4 h-4 text-white" strokeWidth={3} />
                    </button>
                    <span className="w-8 text-center text-white font-bold text-lg">
                      {quantities[item.id]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, 1);
                      }}
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors"
                      style={{backgroundColor: '#6B4EFF'}}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#5A3FE6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#6B4EFF';
                      }}
                    >
                      <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full text-white px-6 py-3 rounded-full font-semibold text-lg flex items-center justify-center gap-2 relative z-[80]"
            style={{backgroundColor: '#6B4EFF'}}
            disabled={totalItems === 0}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#5A3FE6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#6B4EFF';
            }}
          >
            ADD TO CART
            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" style={{color: '#6B4EFF'}} />
            </div>
          </button>
        </div>
      </div>
    </div>

    {/* Drawer for Insurance and Gift Card */}
    <Drawer 
      isOpen={isDrawerOpen} 
      onClose={() => setIsDrawerOpen(false)}
      title="Pair with"
      bottomOffset={barHeight - 16}
      centerClose
    >
      <div className="space-y-4">
        {items.filter(item => item.id === 'insurance' || item.id === 'giftCard').map((item) => (
          <div key={item.id} className="bg-[#24242D] rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              {/* Item Image */}
              <Image 
                src={item.id === 'insurance' ? '/image/certificatee.jpg' : '/image/gitftnewcard.png'}
                alt={item.title}
                width={80}
                height={64}
                className="w-20 h-16 rounded-lg object-contain flex-shrink-0 mr-3 bg-white/10"
                priority
              />
              <div className="flex-1">
                <h3 className="text-base font-medium text-white mb-2">{item.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 line-through text-sm">
                    £{quantities[item.id] > 0 ? item.originalPrice * quantities[item.id] : item.originalPrice}
                  </span>
                  <span className="text-white font-bold">
                    £{quantities[item.id] > 0 ? Math.round(getItemDiscountedPrice(item.id)) : item.currentPrice}
                  </span>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={quantities[item.id] > 0}
                  onChange={() => updateQuantity(item.id, quantities[item.id] > 0 ? -quantities[item.id] : 1)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{'--tw-bg-opacity': quantities[item.id] > 0 ? '1' : '0', backgroundColor: quantities[item.id] > 0 ? '#6B4EFF' : '#6b7280'}}></div>
              </label>
            </div>
            
            {/* Quantity Controls */}
            {quantities[item.id] > 0 && (
              <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-700">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  disabled={quantities[item.id] === 0}
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  style={{backgroundColor: quantities[item.id] === 0 ? '#6b7280' : '#6B4EFF'}}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-white font-bold text-xl">
                  {quantities[item.id]}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center transition-colors"
                  style={{backgroundColor: '#6B4EFF'}}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Drawer>
    </>
  );
};

export default StickyBottomBar;
