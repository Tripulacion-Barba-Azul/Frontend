import OwnCards from "../../components/OwnCards/OwnCards.jsx"; // <- importa el componente

function App() {
  const cardIds = [11, 16, 23, 21, 19, 8];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        style={{
          backgroundImage: `url("/Board/backgroundBoard.png")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "cover",
        }}
        className="w-full h-screen bg-black"
      />

      <OwnCards cardIds={cardIds} />
    </div>
  );
}

export default App;
