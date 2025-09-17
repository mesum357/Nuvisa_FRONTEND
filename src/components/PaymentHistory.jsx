"use client";

import { useState, useEffect } from "react";
import usePaymentData from "@/hooks/usePaymentData";
import { Calendar, MapPin, Users, Shield, CreditCard } from "lucide-react";

const PaymentHistory = () => {
  const { paymentHistory, isLoading, getPaymentHistory } = usePaymentData();

  useEffect(() => {
    getPaymentHistory();
  }, []);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!paymentHistory || paymentHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No payment history found</p>
          <p className="text-sm mt-2">Your completed payments will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Payment History</h2>
        <p className="text-gray-600 text-sm mt-1">Your recent visa application payments</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {paymentHistory.map((payment, index) => (
          <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Visa Application Payment
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(payment.paymentDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  £{payment.totalAmount}
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {payment.email && (
                <div className="flex items-center text-gray-600">
                  <span className="font-medium mr-2">Email:</span>
                  <span className="truncate">{payment.email}</span>
                </div>
              )}
              
              {payment.selectedCountry && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  <span>{payment.selectedCountry}</span>
                </div>
              )}
              
              {payment.travelers && (
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-1 text-gray-400" />
                  <span>{payment.travelers} traveler{Number(payment.travelers) > 1 ? 's' : ''}</span>
                </div>
              )}
              
              {payment.insurancePayment && Number(payment.insurancePayment) > 0 && (
                <div className="flex items-center text-gray-600">
                  <Shield className="w-4 h-4 mr-1 text-gray-400" />
                  <span>Insurance: £{payment.insurancePayment}</span>
                </div>
              )}
            </div>
            
            {payment.sessionId && (
              <div className="mt-2 text-xs text-gray-500">
                Session ID: {payment.sessionId}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentHistory;
