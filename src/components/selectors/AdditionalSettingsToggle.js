import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useLabels } from '../../hooks/useLabels';

const AdditionalSettingsToggle = ({ isExpanded, onToggle }) => {
  const t = useLabels();
  return (
    <div
      className="additional-settings-toggle pt-[15px] pb-[250px] cursor-pointer"
      onClick={onToggle}
    >
      {t.additionalSettings}
      <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="ml-[5px]" />
    </div>
  );
};

export default AdditionalSettingsToggle;