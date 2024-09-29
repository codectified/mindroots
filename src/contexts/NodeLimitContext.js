import React, { createContext, useState, useContext } from 'react';

const NodeLimitContext = createContext();

export const NodeLimitProvider = ({ children }) => {
  const [limit, setLimit] = useState(25); // Default limit

  return (
    <NodeLimitContext.Provider value={{ limit, setLimit }}>
      {children}
    </NodeLimitContext.Provider>
  );
};

export const useNodeLimit = () => useContext(NodeLimitContext);