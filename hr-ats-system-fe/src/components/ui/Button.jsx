function Button({
  type = "button",
  text,
  onClick,
  variant = "primary",
  className = "",
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-bold";

  const styles =
    variant === "secondary"
      ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
      : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
    >
      {text}
    </button>
  );
}

export default Button;