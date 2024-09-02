import React from 'react';
import { Link } from 'react-router-dom';
import Menu from './Menu';


const ArticlesList = () => {
  return (
    <div className="articles-list">
                        <Menu />

      <h1>Articles</h1>
      <ul>
        <li>
          <Link to="/introduction">Getting Started with Graphs</Link>
        </li>
        {/* Add more articles here */}
      </ul>
    </div>
  );
};

export default ArticlesList;
