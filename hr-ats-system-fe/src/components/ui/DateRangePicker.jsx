const DateRangePicker = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}) => {
  return (
    <div className="flex items-center">
      <div className="relative">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="block h-8 w-full ps-3 pe-3 py-2.5 border rounded-lg text-sm"
        />
      </div>

      <span className="mx-4 text-gray-500">to</span>

      <div className="relative">
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="block h-8 w-full ps-3 pe-3 py-2.5 border rounded-lg text-sm"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;