import backgroundBoard from "../../assets/backgroundBoard.png";

export default function BaseBoard() {
  return (
    <div
      style={{
        backgroundImage: `url(${backgroundBoard})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom",
        backgroundSize: "cover",
      }}
      className="w-full h-screen bg-black"
    ></div>
  );
}
