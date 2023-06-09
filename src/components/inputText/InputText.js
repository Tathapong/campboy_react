import { forwardRef } from "react";

const InputText = forwardRef(function InputText(props, ref) {
  const { placeholder = "Enter input", type = "text", onChange, value, className = "", errorText, maxLength } = props;
  return (
    <div className="input-text-group">
      <input
        ref={ref}
        className={`input-text ${errorText ? "input-error" : ""} ${className}`}
        placeholder={placeholder}
        type={type}
        onChange={onChange}
        value={value}
        maxLength={maxLength}
      ></input>
      <div className="small-text-group">
        {maxLength ? (
          <small className="text-count">
            {value.length}/{maxLength} Characters
          </small>
        ) : (
          ""
        )}
        {errorText ? <small className="text-error">{errorText}</small> : ""}
      </div>
    </div>
  );
});

export default InputText;
