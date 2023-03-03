import "./cardGroup.css";

function CardGroup(props) {
  const { type = "", children, header = "Header" } = props;
  return (
    <div className={`card-group  ${type}`}>
      <div className="card-header">{header}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}

export default CardGroup;
