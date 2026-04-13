import React from 'react';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';
import { useLabels } from '../../hooks/useLabels';
import clsx from 'clsx';

const ModeSelector = () => {
  const { isAdvancedMode, toggleAdvancedMode } = useAdvancedMode();
  const t = useLabels();

  return (
    <div className="flex items-center gap-[5px] whitespace-nowrap mb-2.5">
      <div className="flex gap-[5px]">
        <button
          onClick={() => !isAdvancedMode || toggleAdvancedMode()}
          className={clsx(
            'px-3 py-1 text-xs rounded border border-border cursor-pointer font-serif transition-all duration-150',
            !isAdvancedMode ? 'bg-[#333] text-white' : 'bg-surface text-[#333]'
          )}
        >
          {t.guided}
        </button>
        <button
          onClick={() => isAdvancedMode || toggleAdvancedMode()}
          className={clsx(
            'px-3 py-1 text-xs rounded border border-border cursor-pointer font-serif transition-all duration-150',
            isAdvancedMode ? 'bg-[#333] text-white' : 'bg-surface text-[#333]'
          )}
        >
          {t.advanced}
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;
