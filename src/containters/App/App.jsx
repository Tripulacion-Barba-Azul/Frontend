import ViewSecrets from '../../components/ViewSecrets/ViewSecrets';

function App() {

  const secretsList = [
    { id: 1, revealed: true },
    { id: 2, revealed: false },
    { id: 3, revealed: true },
    { id: 1, revealed: true },
    { id: 2, revealed: false },
    { id: 3, revealed: true },
    { id: 1, revealed: true },
    { id: 2, revealed: false },
    { id: 3, revealed: true },
  ]  

  return (
    <div>
      <ViewSecrets secrets={secretsList} />
    </div>
  )
}

export default App