import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Link, useParams } from 'react-router-dom';

const App = () => (
  <Router>
    <Route path="/" exact component={RootList} />
    <Route path="/root/:rootId" component={RootDetails} />
  </Router>
);

const RootList = () => {
  const [roots, setRoots] = useState([]);

  useEffect(() => {
    fetch('/api/roots')
      .then(response => response.json())
      .then(data => setRoots(data))
      .catch(error => console.error('Error fetching roots:', error));
  }, []);

  return (
    <div>
      <h1>Roots</h1>
      <ul>
        {roots.map(root => (
          <li key={root.root}>
            <Link to={`/root/${root.root}`}>{root.root}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const RootDetails = () => {
  const { rootId } = useParams();
  const [script, setScript] = useState('english');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/root/${rootId}?script=${script}`)
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching root details:', error));
  }, [rootId, script]);

  return (
    <div>
      <h1>Root Details</h1>
      {data && (
        <div>
          <h2>Root: {data[0].root.root}</h2>
          <h3>Words:</h3>
          <ul>
            {data[0].words.map((word, index) => (
              <li key={index}>{word.text}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <label>
          Script:
          <select value={script} onChange={e => setScript(e.target.value)}>
            <option value="english">English</option>
            <option value="arabic">Arabic</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default App;
