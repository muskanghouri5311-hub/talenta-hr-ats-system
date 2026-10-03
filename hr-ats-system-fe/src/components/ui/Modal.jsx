const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "max-w-lg",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Background - clicking here does NOT close */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Modal Card */}
      <div
        className={`relative bg-white w-full ${size} rounded-xl shadow-lg z-10 max-h-[90vh] flex flex-col`}
      >

        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-5 border-b border-gray-100">

          <div>
            <h2 className="text-xl text-left font-bold text-gray-900">
              {title}
            </h2>

            <p className="text-sm text-gray-500 mt-1 text-left">
              {subtitle}
            </p>
          </div>

          {/* X closes modal */}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>

        </div>

        {/* Content */}
        <div className="space-y-4 p-6 overflow-y-auto">
          {children}
        </div>

      </div>

    </div>
  );
};

export default Modal;