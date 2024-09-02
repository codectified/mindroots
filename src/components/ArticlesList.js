import React from 'react';
import { Link } from 'react-router-dom';
import Menu from './Menu';


const ArticlesList = () => {
  return (
    <div className="articles-list">
                        <Menu />

      <h1>Articles and Tutorials</h1>
      <ul>
        <li>
          <Link to="/introduction">Introduction Tutorial</Link>
        </li>
        {/* Add more articles here */}
      </ul>
    </div>
  );
};

export default ArticlesList;
