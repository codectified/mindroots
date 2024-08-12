import React from 'react';
import { Link } from 'react-router-dom';

const MindRoots = () => {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/main">MindRoots</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MindRoots;
