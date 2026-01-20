import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const contents = await prisma.popupContent.findMany({
        where: { section: 'popup', isActive: true }
      });

      // Rows ko object mein convert karna
      const dataMap = contents.reduce((acc: any, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        data: {
          mainHeading: dataMap.popup_main_heading,
          subHeading: dataMap.popup_sub_heading,
          offerPrice: dataMap.popup_offer_price,
          originalPrice: dataMap.popup_original_price,
          buttonText: dataMap.popup_button_text,
          imageUrl: dataMap.popup_image_url,
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}