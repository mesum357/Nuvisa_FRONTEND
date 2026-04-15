import DatePicker from "react-datepicker";
import { Calendar } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

export const CommonDatePicker = ({
  label,
  selected,
  onChange,
  error,
  ...props
}) => {
  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-white mb-2">
        {label}
      </label>
      <div className="relative">
        <DatePicker
          selected={selected}
          onChange={onChange}
          {...props}
          fixedHeight
          popperModifiers={[
            { name: "flip", enabled: false },
            { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
          ]}
          wrapperClassName="w-full"
          className={`w-full cursor-pointer px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition outline-none bg-[#292933] text-white ${error ? "border-red-500" : "border-[#423577]"
            }`}
          dateFormat="dd-MM-yyyy"
          placeholderText="DD-MM-YYYY"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};
