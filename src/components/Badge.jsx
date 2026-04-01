import { useKlarnaContent } from '@/hooks/useKlarnaContent';
import Image from 'next/image'
import React from 'react'
import { Info } from 'react-feather'

const Badge = () => {

  const { klarnaContent, loading: klarnaLoading } = useKlarnaContent();

  return (
    <div className='w-full px-4'>
      <div className='bg-[#22222b] border-[1px] border-[#423577] md:flex-row flex-col text-center md:text-start flex items-center justify-center py-3 lg:py-6 px-6 rounded-4xl -mt-8 gap-3 lg:gap-6'>

        {/* Klarna Logo inside Capsule */}
        <div className="flex-shrink-0">
          <img src="/icons/klarna.png" alt="Klarna" className="h-6 md:h-12 w-full" />
        </div>

        <div className='flex flex-col text-white items-center justify-center'>
          <div className='flex items-center gap-2'>
            <p className='text-[16px] lg:text-[26px] font-gilroy-bold text-[#fff] leading-tight'>
              {klarnaLoading ? "Loading..." : klarnaContent.heading}
            </p>
          </div>

          <div className="flex items-center gap-2 text-gray-400 font-gilroy-medium mt-1">
            <p className="text-[12px] md:text-lg font-semibold">
              {klarnaLoading ? "Loading..." : klarnaContent.subtitle}
            </p>
            <span className="text-gray-600">|</span>
            <p className="text-[12px] md:text-lg font-gilroy-bold">
              <span>{!klarnaLoading && klarnaContent.paymentAmount}</span>
              <span className="mx-1">{!klarnaLoading && klarnaContent.interestRate}</span>
              <span> {!klarnaLoading && klarnaContent.fees}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Badge