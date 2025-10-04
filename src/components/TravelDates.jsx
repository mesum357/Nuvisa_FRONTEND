import { CommonDatePicker } from "@/ui/date-picker";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useState } from "react";

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MIN_SAFE_DAYS_BEFORE_TRAVEL = 15;

const getDayClassName = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const safeDateThreshold = new Date();
  safeDateThreshold.setHours(0, 0, 0, 0);
  safeDateThreshold.setDate(today.getDate() + MIN_SAFE_DAYS_BEFORE_TRAVEL);

  if (date < safeDateThreshold && date >= today) {
    return "dangerous-date";
  }
  if (date >= today) {
    return "comfortable-date";
  }
  return undefined;
};

export const TravelDates = ({
  parentVisaApplication,
  disabled,
  handleChangeDates,
  travelStartDate,
  travelEndDate,
  setTravelEndDate,
  setTravelStartDate,
}) => {
  const [errors, setErrors] = useState({});
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "travelStartDate") {
      if (value) {
        const selectedDate = new Date(value + "T00:00:00");
        const endDate = new Date(travelEndDate + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fifteenDaysFromToday = new Date(today);
        fifteenDaysFromToday.setDate(today.getDate() + 15);

        if (travelEndDate && selectedDate >= endDate) {
          setTravelEndDate("");
          handleChangeDates(name, value);
          handleChangeDates("travelEndDate", null);
          setTravelStartDate(value);
        } else {
          handleChangeDates(name, value);
          setTravelStartDate(value);
          if (selectedDate < fifteenDaysFromToday) {
            setErrors((prev) => ({
              ...prev,
              travelStartDateWarning:
                " Your travel date is within 15 days. Embassy processing typically takes up to 15 days after your appointment. Consider if your dates are flexible.",
            }));
            if (
              travelEndDate &&
              new Date(travelEndDate + "T00:00:00") <
                new Date(value + "T00:00:00")
            ) {
              setTravelEndDate("");
            }
          } else {
            setErrors((prev) => ({
              ...prev,
              travelStartDateWarning: "",
            }));
          }
        }
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.travelStartDateWarning;
          return newErrors;
        });
      }
    }

    if (name === "travelEndDate") {
      if (value) {
        const selectedEndDate = new Date(value + "T00:00:00");
        const startDate = new Date(travelStartDate + "T00:00:00");
        if (selectedEndDate <= startDate) {
          setErrors((prev) => ({
            ...prev,
            travelEndDate: "Return date cannot be before departure date.",
          }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.travelEndDate;
            return newErrors;
          });
          handleChangeDates(name, value);
          setTravelEndDate(value);
        }
      }
    }
  };

  let maxTravelEndDate = null;
  if (parentVisaApplication?.travelStartDate) {
    const startDate = new Date(parentVisaApplication?.travelStartDate);
    if (!isNaN(startDate.getTime())) {
      maxTravelEndDate = new Date(startDate);
      maxTravelEndDate.setDate(startDate.getDate() + 90 - 1);
    }
  }

  console.log(travelStartDate, travelEndDate, errors);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className=" p-6  shadow-sm"
    >
      <h2 className="flex items-center text-xl font-semibold mb-6 text-white">
        <Calendar className="text-white mr-3" size={24} />
        1. Add your tentative travel dates
      </h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          These dates can be approximate and are only required to get you a
          visa. You may make changes later as per visa issuance period.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <CommonDatePicker
            selected={travelStartDate ? new Date(travelStartDate) : null}
            minDate={new Date()}
            dayClassName={getDayClassName}
            className={`w-full px-4 py-3 border rounded-lg transition outline-none text-white ${
              disabled
                ? "bg-gray-600/50 border-gray-500 cursor-not-allowed opacity-60 text-gray-400"
                : "bg-[#292933] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            } ${
              errors.travelStartDate
                ? "border-red-500"
                : disabled
                ? "border-gray-500"
                : "border-[#423577]"
            }`}
            onChange={
              disabled
                ? () => {}
                : (date) =>
                    handleInputChange({
                      target: {
                        name: "travelStartDate",
                        value: getLocalDateString(date),
                      },
                    })
            }
            dateFormat="yyyy-MM-dd"
            placeholderText="YYYY-MM-DD"
            label={"Tentative departure date"}
            disabled={disabled}
          />
          {errors.travelStartDate && (
            <p className="text-red-400 text-xs mt-1">
              {errors.travelStartDate}
            </p>
          )}
        </div>
        <div>
          <CommonDatePicker
            label={"Tentative return date"}
            selected={travelEndDate ? new Date(travelEndDate) : null}
            onChange={
              disabled
                ? () => {}
                : (date) =>
                    handleInputChange({
                      target: {
                        name: "travelEndDate",
                        value: getLocalDateString(date),
                      },
                    })
            }
            maxDate={maxTravelEndDate}
            dayClassName={getDayClassName}
            disabled={disabled || !travelStartDate}
            className={`w-full backdrop-blur-sm text-white rounded-lg px-4 py-3 font-semibold border-2 transition-all outline-none ${
              disabled
                ? "bg-gray-600/50 border-gray-500 cursor-not-allowed opacity-60 text-gray-400"
                : !travelStartDate
                ? "bg-gray-700/50 border-gray-600 cursor-not-allowed"
                : "bg-white/10 border-white/20 hover:border-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            }`}
            dateFormat="dd-MM-yyyy"
            placeholderText="DD-MM-YYYY"
          />

          {errors.travelEndDate && (
            <p className="text-red-400 text-xs pt-2">{errors.travelEndDate}</p>
          )}
        </div>
      </div>
      {errors.travelStartDateWarning && (
        <p className="text-red-400 text-xs mt-1">
          {errors.travelStartDateWarning}
        </p>
      )}
    </motion.div>
  );
};
