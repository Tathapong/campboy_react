import { Link } from "react-router-dom";

function TextButton(props) {
  const { name, to } = props;
  return (
    <Link className="text-button" to={to}>
      {name}
    </Link>
  );
}

export default TextButton;
