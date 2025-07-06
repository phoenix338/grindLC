import './styles.css';
import Problems from './pages/problems';
import { VisitCounter } from './pages/problems';
import { useState } from 'react';

function App() {
  const [showCounter, setShowCounter] = useState(false);

  return (
    <div className="container">
      <Problems onLoaded={() => setShowCounter(true)} />
      {showCounter && <VisitCounter />}
    </div>
  );
}

export default App;
