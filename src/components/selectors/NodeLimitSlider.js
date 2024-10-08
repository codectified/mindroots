import React from 'react';
import { useNodeLimit } from '../../contexts/NodeLimitContext';

const NodeLimitSlider = () => {
  const { limit, setLimit } = useNodeLimit();

  const handleSliderChange = (event) => {
    setLimit(Number(event.target.value)); // Update limit as the slider is moved
  };

  return (
    <div>
      <label htmlFor="nodeLimit">Form Node Limit: {limit}</label>
      <input
        id="nodeLimit"
        type="range"
        min="10"
        max="500"
        value={limit}
        onChange={handleSliderChange}
        step="10"
      />
    </div>
  );
};

export default NodeLimitSlider;