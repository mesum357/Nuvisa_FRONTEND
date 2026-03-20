import Image from 'next/image'
import React from 'react'
import { Info } from 'react-feather'

const Badge = () => {
  return (
    <div className='w-full'>
      <div className='w-full bg-[#22222b] border-[1px] border-[#423577] flex items-center justify-center py-4 rounded-full gap-4 -mt-8'>
        <Image src={"/image/BadgeIcon.png"} width={50} height={50} alt="Badge Icon" />
        
        <div className='flex flex-col text-white'>
          <div className='flex items-center gap-2'>
            <p className='font-bold text-[20px] uppercase tracking-tight'>
              Price match guarantee
            </p>
            
            {/* Tooltip wrapper starts here - Sirf Icon ke liye */}
            <div className='relative group flex items-center cursor-pointer'>
              <Info size={18} className="text-gray-400 group-hover:text-[#6F48FF] transition-colors" />

              {/* Tooltip Box - Right aligned takay box icon ke right/center mein rahe */}
              <div className="absolute bottom-full right-[-20px] mb-3 w-64 p-3 bg-[#6F48FF] text-white text-[12px] leading-tight rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none">
                <p>
                  At NUvisa, we want you to get your Schengen visa with total confidence, knowing you're getting the best price in the market.
                </p>
                
                {/* Tooltip Arrow - Positioned exactly above the icon */}
                <div className="absolute top-full right-[22px] border-[6px] border-transparent border-t-[#6F48FF]"></div>
              </div>
            </div>
            {/* Tooltip wrapper ends */}
          </div>
          
          <p className="text-sm text-gray-400">Find it cheaper, we'll match the price</p>
        </div>
      </div>
    </div>
  )
}

export default Badge