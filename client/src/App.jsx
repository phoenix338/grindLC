import './styles.css';
import Problems from './pages/problems';
import { VisitCounter } from './pages/problems';
import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
function App() {
  const [showCounter, setShowCounter] = useState(false);

  return (
    <div className="container">
      <Problems onLoaded={() => setShowCounter(true)} />
      {/* {showCounter && <VisitCounter />} */}
      <Analytics />
    </div>
  );
}

export default App;
