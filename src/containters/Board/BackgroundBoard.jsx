import backgroundBoard from "../../../public/Board/backgroundBoard.png";

export default function BackgroundBoard() {
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
