import React from "react";

const QtyInput = ({
  value = 1,
  onIncrement = () => {},
  onDecrement = () => {},
  onAdd = () => {},
  onRemove = () => {},
  onChange = () => {},
  min = 1,
  max = Infinity,
}) => {
  const handleDecrement = () => {
    const next = Math.max(value - 1, min);
    if (next === value) return;
    onDecrement(next);
    onRemove(next);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(value + 1, max);
    if (next === value) return;
    onIncrement(next);
    onAdd(next);
    onChange(next);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        aria-label="decrease"
        className="bg-white text-gray-700 border border-gray-300 px-2 py-1 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        -
      </button>
      <span className="mx-2 text-sm font-gilroy-bold">{value}</span>

      <button
        aria-label="increase"
        onClick={handleIncrement}
        className="bg-white text-gray-700 border border-gray-300 px-2 py-1 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
};

export default QtyInput;
