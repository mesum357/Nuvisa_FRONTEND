"use client";

import { useState, useEffect } from "react";
import usePaymentData from "@/hooks/usePaymentData";
import {
  Check,
  CreditCard,
  MapPin,
  Users,
  Shield,
  Calendar,
} from "lucide-react";

const LastPaymentSummary = () => {
  const { lastPayment, isLoading, getLastPaymentData } = usePaymentData();

  useEffect(() => {
    getLastPaymentData();
  }, []);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lastPayment) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Payment</h3>
        <div className="text-center py-4 text-gray-500">
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No recent payments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <CreditCard className="w-5 h-5 mr-2 text-green-600" />
        Recent Payment
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Amount</span>
          <span className="font-semibold text-lg">
            £{lastPayment.totalAmount}
          </span>
        </div>

        {lastPayment.email && (
          <div className="flex items-center text-gray-600">
            <Check className="w-4 h-4 mr-2 text-green-500" />
            <span className="text-sm">Email: {lastPayment.email}</span>
          </div>
        )}

        {lastPayment.selectedCountry && (
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-[#7350FF]" />
            <span className="text-sm">
              Destination: {lastPayment.selectedCountry}
            </span>
          </div>
        )}

        {lastPayment.travelers && (
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2 text-purple-500" />
            <span className="text-sm">
              {lastPayment.travelers} Traveler
              {Number(lastPayment.travelers) > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {lastPayment.insurancePayment &&
          Number(lastPayment.insurancePayment) > 0 && (
            <div className="flex items-center text-gray-600">
              <Shield className="w-4 h-4 mr-2 text-orange-500" />
              <span className="text-sm">
                Insurance: £{lastPayment.insurancePayment}
              </span>
            </div>
          )}

        <div className="flex items-center text-gray-600 pt-2 border-t border-gray-200">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm">{formatDate(lastPayment.paymentDate)}</span>
        </div>

        <div className="flex items-center justify-center pt-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Payment Completed
          </span>
        </div>
      </div>
    </div>
  );
};

export default LastPaymentSummary;
