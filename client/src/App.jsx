import './styles.css';
import Problems, { VisitCounter } from './pages/problems';

function App() {
  return (
    <div className="container">
      <Problems />
      <VisitCounter />
    </div>
  );
}

export default App;