import React from "react";

const InputField = React.forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder,
      onChange,
      onBlur,
    },
    ref
  ) => {
    return (
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">
          {label}
        </label>

        <input
          ref={ref}
          name={name}
          type={type}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full rounded-md border p-3 outline-none focus:border-purple-700"
        />
      </div>
    );
  }
);

export default InputField;