import { useState } from "react";

const InputBox = ({ name, type, id, value, placeholder, icon, onChange, disabled = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  // Support both controlled and uncontrolled inputs
  const inputProps = {
    name,
    type: type === "password" ? (showPassword ? "text" : "password") : type,
    id,
    placeholder,
    disabled,
    className: "input-box disabled:opacity-50 disabled:cursor-not-allowed"
  };

  // If onChange is provided, use controlled input
  if (onChange) {
    inputProps.value = value || "";
    inputProps.onChange = onChange;
  } else {
    // Use uncontrolled input with defaultValue
    inputProps.defaultValue = value;
  }

  return (
    <div className="relative w-[100%] mb-4">
      <input {...inputProps} />
      <i className={`fi ${icon} input-icon`} />

      {type === "password" ? (
        <i
          className={`fi ${
            showPassword ? "fi-rr-eye" : "fi-rr-eye-crossed"
          } input-icon left-[auto] right-4 cursor-pointer`}
          onClick={() => setShowPassword(!showPassword)}
        />
      ) : null}
    </div>
  );
};

export default InputBox;
