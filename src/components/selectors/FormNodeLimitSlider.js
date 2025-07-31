import React from 'react';
import { useFormNodeLimit } from '../../contexts/FormNodeLimitContext';

const FormNodeLimitSlider = () => {
  const { formNodeLimit, setFormNodeLimit } = useFormNodeLimit();

  const handleSliderChange = (event) => {
    setFormNodeLimit(parseInt(event.target.value, 10));
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
        Form Node Limit: {formNodeLimit}
      </label>
      <input
        type="range"
        min="5"
        max="100"
        step="5"
        value={formNodeLimit}
        onChange={handleSliderChange}
        style={{
          width: '100%',
          accentColor: '#007bff'
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
        <span>5</span>
        <span>100</span>
      </div>
    </div>
  );
};

export default FormNodeLimitSlider;