import "./CardCount.css";

const CardIcon = "../../../public/Icons/cardicon.png";

export default function CardCount({ number }) {
  // Validate that number is between 0 and 6
  const validatedNumber = Math.max(0, Math.min(6, Number(number)));

  return (
    <div className="cardcount-container">
      <img src={CardIcon} alt="Card Icon" className="base-image" />
      <div className="number-overlay">{number}</div>
    </div>
  );
}
