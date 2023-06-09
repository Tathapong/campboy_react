import * as constant from "../../config/constant";

function Button(props) {
  const { type = "button", onClick, className = "", children, contact, name, disabled } = props;

  let title = name;
  if (contact) {
    if (contact.type === constant.PHONE) title = contact.contact;
    else title = contact.type;
  }

  return (
    <button className={`btn ${className}`} onClick={onClick} type={type} disabled={disabled}>
      {title}
      {children}
    </button>
  );
}

export default Button;
