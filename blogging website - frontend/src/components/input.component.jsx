import { useState } from "react";

const InputBox = ({ name, type, id, value, placeholder, icon }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-[100%] mb-4">
      <input
        name={name}
        type={type === "password" ? (showPassword ? "text" : "password") : type}
        id={id}
        placeholder={placeholder}
        defaultValue={value}
        className="input-box"
      />
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
