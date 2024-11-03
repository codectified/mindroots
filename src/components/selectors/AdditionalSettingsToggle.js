import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const AdditionalSettingsToggle = ({ isExpanded, onToggle }) => {
  return (
    <div
      className="additional-settings-toggle"
      onClick={onToggle}
      style={{
        paddingTop: '15px',  // Adjust this for more or less space above
        paddingBottom: '250px',  // Adjust this for more or less space below
        cursor: 'pointer'
      }}
    >
      Additional Settings
      <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
    </div>
  );
};

export default AdditionalSettingsToggle;