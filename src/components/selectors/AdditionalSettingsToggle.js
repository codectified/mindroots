import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useLabels } from '../../hooks/useLabels';

const AdditionalSettingsToggle = ({ isExpanded, onToggle }) => {
  const t = useLabels();
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
      {t.additionalSettings}
      <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
    </div>
  );
};

export default AdditionalSettingsToggle;