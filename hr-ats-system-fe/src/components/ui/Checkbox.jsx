const Checkbox = ({
  label,
  name,
  register,
  errors,
  disabled = false,
}) => {
  return (
    <div className="flex justify-center">
      <label
        className={`flex items-center gap-2 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          disabled={disabled}
          className="h-5 w-5 accent-blue-600"
          {...register(name)}
        />

        {label && <span>{label}</span>}
      </label>

      {errors?.[name] && (
        <p className="mt-1 text-sm text-red-500">
          {errors[name].message}
        </p>
      )}
    </div>
  );
};

export default Checkbox;