import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { updateValidationFields } from '../../services/apiService';
import '../../styles/info-bubble.css';

const NodeInspector = ({ nodeData, onClose, onNavigate }) => {
  // Navigation state
  const [navigationStatus, setNavigationStatus] = useState({ loading: false, message: '' });
  
  // Target fields for validation and editing
  const validationFields = ['english', 'wazn', 'spanish', 'urdu', 'classification', 'transliteration'];
  
  // State for editable field values
  const [fieldValues, setFieldValues] = useState(() => {
    if (!nodeData || !nodeData.properties) return {};
    const initial = {};
    validationFields.forEach(field => {
      initial[field] = nodeData.properties[field]?.value || '';
    });
    return initial;
  });
  
  // State for validation counts
  const [validationData, setValidationData] = useState(() => {
    if (!nodeData || !nodeData.properties) return {};
    const initial = {};
    validationFields.forEach(field => {
      const validatedCount = nodeData.properties[`${field}_validated_count`]?.value || 0;
      const locked = validatedCount >= 1;
      
      initial[field] = {
        validated_count: validatedCount,
        locked: locked
      };
    });
    return initial;
  });

  // Track changes for batch saving
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [saveStatus, setSaveStatus] = useState({ saving: false, message: '' });

  if (!nodeData) return null;

  const { nodeType, nodeId, properties, relationships, connectedNodeCounts, summary } = nodeData;

  // Helper to organize properties more intuitively
  const getOrganizedProperties = (properties) => {
    const entries = Object.entries(properties);
    
    // Simple priority order as requested
    const priorityOrder = [
      'arabic', 'wazn', 'english', 'spanish', 'urdu', 'transliteration', 
      'definitions', 'hanswehr_entry',
      // IDs
      'word_id', 'root_id', 'entry_id', 'item_id', 'corpus_id'
      // Everything else will be added after
    ];
    
    // Separate into priority and remaining fields
    const priorityFields = [];
    const remainingFields = [];
    
    // Add priority fields in order
    priorityOrder.forEach(key => {
      const entry = entries.find(([k, _]) => k === key);
      if (entry) {
        priorityFields.push(entry);
      }
    });
    
    // Add any remaining fields not in priority list
    entries.forEach(entry => {
      if (!priorityOrder.includes(entry[0])) {
        remainingFields.push(entry);
      }
    });
    
    // Return combined list: priority fields first, then others
    return [...priorityFields, ...remainingFields];
  };

  // Helper to check if a field is editable/validatable
  const isValidationField = (fieldName) => {
    return validationFields.includes(fieldName);
  };

  // Helper to format property values with optional validation controls
  const formatPropertyValue = (prop, fieldName) => {
    const isValidatable = isValidationField(fieldName);
    const validation = isValidatable ? validationData[fieldName] : null;
    const fieldValue = isValidatable ? fieldValues[fieldName] : null;

    if (isValidatable) {
      const isEmpty = !fieldValue?.trim();
      
      return (
        <div className="validation-input-container">
          <input
            type="text"
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            disabled={validation?.locked}
            className={`validation-input ${validation?.locked ? 'locked' : ''} ${isEmpty ? 'empty' : ''}`}
            placeholder={`Enter ${fieldName}...`}
          />
          {validation?.locked && <span className="locked-indicator">🔒</span>}
        </div>
      );
    }

    // Regular property display
    if (prop.isEmpty) {
      return <span className="empty-value">Empty</span>;
    }
    
    if (prop.type === 'string' && prop.value.length > 100) {
      return (
        <div className="long-text">
          <div className="text-preview">{prop.value.substring(0, 100)}...</div>
          <details>
            <summary>Show full text</summary>
            <div className="full-text">{prop.value}</div>
          </details>
        </div>
      );
    }
    
    return <span className={`value-${prop.type}`}>{String(prop.value)}</span>;
  };

  // Helper to get relationship direction icon
  const getDirectionIcon = (direction) => {
    return direction === 'outgoing' ? '→' : '←';
  };
  
  // Handle field value changes
  const handleFieldChange = (field, value) => {
    if (!validationData[field].locked) {
      setFieldValues(prev => ({ ...prev, [field]: value }));
      
      // Track changes for batch saving
      setPendingUpdates(prev => ({
        ...prev,
        [field]: { value: value }
      }));
      setHasChanges(true);
    }
  };
  
  // Handle approve action  
  const handleApprove = async (field) => {
    const value = fieldValues[field]?.trim();
    
    // Block approving empty values
    if (!value) {
      alert('Cannot approve an empty value.');
      return;
    }
    
    // Special validation for wazn field
    if (field === 'wazn' && value) {
      // Check if it contains at least one Arabic character
      const hasArabic = /[\u0600-\u06FF]/.test(value);
      if (!hasArabic) {
        alert('Wazn field must contain at least one Arabic character.');
        return;
      }
    }
    
    // Update validation counts - first approve locks editing but not approving
    setValidationData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        validated_count: prev[field].validated_count + 1,
        locked: prev[field].validated_count === 0 ? true : prev[field].locked
      }
    }));
    
    // Track approval for batch saving
    setPendingUpdates(prev => ({
      ...prev,
      [field]: { 
        ...prev[field],
        value: value,
        approve: true 
      }
    }));
    setHasChanges(true);
  };
  
  // Handle save changes
  const handleSaveChanges = async () => {
    if (!hasChanges || Object.keys(pendingUpdates).length === 0) {
      return;
    }
    
    setSaveStatus({ saving: true, message: 'Saving changes...' });
    
    try {
      const result = await updateValidationFields(nodeType.toLowerCase(), nodeId, pendingUpdates);
      
      // Clear pending updates
      setPendingUpdates({});
      setHasChanges(false);
      
      setSaveStatus({ 
        saving: false, 
        message: `✓ Saved ${Object.keys(pendingUpdates).length} changes` 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ saving: false, message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveStatus({ 
        saving: false, 
        message: 'Error saving changes. Please try again.' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveStatus({ saving: false, message: '' });
      }, 5000);
    }
  };
  
  // Handle navigation (previous/next)
  const handleNavigation = async (direction) => {
    if (!onNavigate) return;
    
    setNavigationStatus({ loading: true, message: '' });
    
    try {
      // Extract the actual numeric ID for different node types
      let actualId;
      if (nodeType === 'Word' || nodeType === 'word') {
        actualId = properties.word_id?.value || nodeId;
      } else if (nodeType === 'corpusitem' || nodeType === 'CorpusItem') {
        actualId = properties.item_id?.value || nodeId;
      } else {
        actualId = nodeId;
      }
      
      // Extract corpus_id for corpus items
      const corpusId = properties.corpus_id?.value;
      
      const success = await onNavigate(nodeType, actualId, direction, corpusId);
      if (!success) {
        setNavigationStatus({ 
          loading: false, 
          message: `No ${direction === 'previous' ? 'previous' : 'next'} node found`
        });
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setNavigationStatus({ loading: false, message: '' });
        }, 3000);
      } else {
        setNavigationStatus({ loading: false, message: '' });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setNavigationStatus({ 
        loading: false, 
        message: 'Navigation failed. Please try again.'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setNavigationStatus({ loading: false, message: '' });
      }, 3000);
    }
  };

  const inspector = (
    <div className="node-inspector-overlay">
      <div className="node-inspector">
        <div className="node-inspector-header">
          <div className="header-left">
            <h2>{nodeType} Inspector</h2>
            <div className="node-id">ID: {nodeId}</div>
            
            {/* Navigation controls for Word and CorpusItem nodes */}
            {(nodeType === 'Word' || nodeType === 'word' || nodeType === 'corpusitem' || nodeType === 'CorpusItem') && onNavigate && (
              <div className="navigation-controls">
                {navigationStatus.message && (
                  <span className="navigation-message">{navigationStatus.message}</span>
                )}
                <button
                  onClick={() => handleNavigation('previous')}
                  disabled={navigationStatus.loading}
                  className="nav-button"
                  title={`Previous ${(nodeType === 'Word' || nodeType === 'word') ? 'word' : 'item'}`}
                >
                  ← Prev
                </button>
                <button
                  onClick={() => handleNavigation('next')}
                  disabled={navigationStatus.loading}
                  className="nav-button"
                  title={`Next ${(nodeType === 'Word' || nodeType === 'word') ? 'word' : 'item'}`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
          
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="node-inspector-content">
          {/* Summary Section */}
          <section className="inspector-section">
            <h3>Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Properties:</span>
                <span className="value">{summary.totalProperties}</span>
              </div>
              <div className="summary-item">
                <span className="label">Relationships:</span>
                <span className="value">{summary.totalRelationships}</span>
              </div>
              <div className="summary-item">
                <span className="label">Connected Nodes:</span>
                <span className="value">{summary.totalConnectedNodes}</span>
              </div>
            </div>
          </section>

          {/* Properties Section */}
          <section className="inspector-section">
            <h3>Properties ({Object.keys(properties).length})</h3>
            <div className="properties-table">
              {getOrganizedProperties(properties).map(([key, prop]) => {
                const isValidatable = isValidationField(key);
                const validation = isValidatable ? validationData[key] : null;
                const fieldValue = isValidatable ? fieldValues[key] : null;
                const isEmpty = isValidatable ? !fieldValue?.trim() : false;
                
                return (
                  <div key={key} className="property-row">
                    <div className="property-key">{key}</div>
                    <div className="property-type">
                      {isValidatable ? (
                        <button
                          onClick={() => handleApprove(key)}
                          disabled={isEmpty}
                          className="validation-action-btn approve-btn"
                          title={isEmpty ? "Cannot approve empty value" : "Approve this value"}
                        >
                          👍 {validation?.validated_count || 0}
                        </button>
                      ) : (
                        prop.type
                      )}
                    </div>
                    <div className="property-value">
                      {formatPropertyValue(prop, key)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Relationships Section */}
          <section className="inspector-section">
            <h3>Relationships ({relationships.length} types)</h3>
            <div className="relationships-table">
              {relationships.map((rel, index) => (
                <div key={index} className="relationship-row">
                  <div className="relationship-direction">
                    <span className="direction-icon">{getDirectionIcon(rel.direction)}</span>
                    <span className="direction-label">{rel.direction}</span>
                  </div>
                  <div className="relationship-type">{rel.type}</div>
                  <div className="relationship-count">
                    <span className="count-badge">{rel.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Connected Node Types Section */}
          <section className="inspector-section">
            <h3>Connected Node Types</h3>
            <div className="connected-nodes-grid">
              {Object.entries(connectedNodeCounts)
                .filter(([_, count]) => count > 0)
                .map(([nodeType, count]) => (
                  <div key={nodeType} className="connected-node-item">
                    <div className="node-type-label">{nodeType}</div>
                    <div className="node-type-count">{count}</div>
                  </div>
                ))}
            </div>
            {Object.values(connectedNodeCounts).every(count => count === 0) && (
              <div className="no-connections">No connected nodes found</div>
            )}
          </section>

          {/* Raw Data Section (Collapsible) */}
          <section className="inspector-section">
            <details>
              <summary>
                <h3 style={{ display: 'inline' }}>Raw Data (Advanced)</h3>
              </summary>
              <div className="raw-data">
                <pre>{JSON.stringify(nodeData, null, 2)}</pre>
              </div>
            </details>
          </section>
        </div>

        <div className="node-inspector-footer">
          {saveStatus.message && (
            <span className="save-status-message">{saveStatus.message}</span>
          )}
          
          {hasChanges && (
            <button 
              className="save-changes-btn" 
              onClick={handleSaveChanges}
              disabled={saveStatus.saving}
            >
              {saveStatus.saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          
          <button className="close-button-footer" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(inspector, document.body);
};

export default NodeInspector;