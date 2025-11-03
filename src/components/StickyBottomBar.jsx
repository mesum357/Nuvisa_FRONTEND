import { useState, useEffect } from "react";
import { Gift, Shield, Plus, Minus, ShoppingCart, ArrowUpRight } from "lucide-react";

const StickyBottomBar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [quantities, setQuantities] = useState({
    schengen: 0,
    insurance: 0,
    giftCard: 0
  });

  const items = [
    {
      id: 'schengen',
      title: 'Schengen visa from the UK',
      originalPrice: 200,
      currentPrice: 159,
      badge: 'Travellers',
    
    },
    {
      id: 'insurance',
      title: 'Insurance Certificate',
      originalPrice: 45,
      currentPrice: 29,
      badge: null,
      badgeCount: null
    },
    {
      id: 'giftCard',
      title: 'NUvisa Digital Gift Card',
      originalPrice: 245,
      currentPrice: 188,
      badge: null,
      badgeCount: null
    }
  ];

  const updateQuantity = (itemId, change) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, prev[itemId] + change)
    }));
  };

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      return total + (item.currentPrice * quantities[item.id]);
    }, 0);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Get footer element
      const footer = document.querySelector('footer');
      const footerTop = footer ? footer.getBoundingClientRect().top + window.scrollY : documentHeight;
      
      // Show when scrolled a little bit (200px from top)
      const hasScrolledEnough = scrollPosition > 200;
      
      // Hide when footer is visible (when scroll position + window height reaches footer)
      const isFooterVisible = scrollPosition + windowHeight >= footerTop;
      
      if (hasScrolledEnough && !isFooterVisible) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e1e27] shadow-2xl animate-slide-up">
      <div className=" mx-auto px-10 py-4">
        <div className="flex items-center justify-between gap-4">
          
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
                      £{quantities[item.id] > 0 ? item.currentPrice * quantities[item.id] : item.currentPrice}
                    </span>
                    {item.badge && (
                      <div className="flex items-center gap-1">
                        <div className="text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1" style={{backgroundColor: '#6B4EFF'}}>
                          <Gift className="w-3 h-3" />
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
                  {/* Item Info */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium text-white mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 line-through text-sm">
                        £{quantities[item.id] > 0 ? item.originalPrice * quantities[item.id] : item.originalPrice}
                      </span>
                      <span className="text-white font-bold">
                        £{quantities[item.id] > 0 ? item.currentPrice * quantities[item.id] : item.currentPrice}
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
              className="text-white px-8 py-3 rounded-full font-semibold text-lg flex items-center gap-2  min-w-[200px] justify-center"
              style={{backgroundColor: '#6B4EFF'}}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#5A3FE6';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#6B4EFF';
              }}
              disabled={getTotalItems() === 0}
            >
              ADD TO CART
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center ml-2">
                <ArrowUpRight className="w-4 h-4" style={{color: '#6B4EFF'}} />
              </div>
            </button>
           
          </div>

        </div>
      </div>
    </div>
  );
};

export default StickyBottomBar;
