import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import '../../styles/info-bubble.css';

const NodeInspector = ({ nodeData, onClose, onNavigate }) => {
  // Navigation state
  const [navigationStatus, setNavigationStatus] = useState({ loading: false, message: '' });
  
  // Target fields for validation and editing
  const validationFields = ['english', 'wazn', 'spanish', 'urdu', 'classification'];
  
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
      const dislikeCount = nodeData.properties[`${field}_dislike_count`]?.value || 0;
      const locked = validatedCount >= 1;
      
      initial[field] = {
        validated_count: validatedCount,
        dislike_count: dislikeCount,
        locked: locked
      };
    });
    return initial;
  });

  if (!nodeData) return null;

  const { nodeType, nodeId, properties, relationships, connectedNodeCounts, summary } = nodeData;

  // Helper to organize properties more intuitively
  const getOrganizedProperties = (properties) => {
    const entries = Object.entries(properties);
    
    // Define priority order for better context when reviewing fields like wazn
    const priorityOrder = [
      // Core identification
      'arabic', 'english', 'sem', 'transliteration',
      // Morphological context (important for wazn validation)
      'wazn', 'form', 'itype', 'classification',
      // Root context (helps with wazn judgment)
      'root_id', 'word_type', 'subclass',
      // Definitions (context for validation)
      'definitions', 'english_2', 'spanish', 'urdu',
      // Technical fields
      'word_id', 'entry_id', 'key', 'node_type',
      // Less critical fields at the end
      'arabic_normalized', 'arabic_no_diacritics', 'bw_arabic', 'forms',
      'sem_lang', 'dataSize'
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

  // Helper to format property values
  const formatPropertyValue = (prop) => {
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
    
    // Update validation counts - first approve locks the field
    setValidationData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        validated_count: prev[field].validated_count + 1,
        locked: true
      }
    }));
    
    // TODO: Make API call to update the backend
    console.log(`Approved field ${field} with value: ${value}`);
  };
  
  // Handle dislike action
  const handleDislike = async (field) => {
    // Update dislike count (never unlocks the field)
    setValidationData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        dislike_count: prev[field].dislike_count + 1
      }
    }));
    
    // TODO: Make API call to update the backend
    console.log(`Disliked field ${field}`);
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
          </div>
          
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
              {getOrganizedProperties(properties).map(([key, prop]) => (
                <div key={key} className="property-row">
                  <div className="property-key">{key}</div>
                  <div className="property-type">{prop.type}</div>
                  <div className="property-value">
                    {formatPropertyValue(prop)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Validation Fields Section */}
          {validationFields.some(field => properties[field]) && (
            <section className="inspector-section">
              <h3>Validate & Edit</h3>
              <div className="validation-table">
                {validationFields.map(field => {
                  // Only show fields that exist on the node
                  if (!properties[field]) return null;
                  
                  const validation = validationData[field];
                  const value = fieldValues[field];
                  const isEmpty = !value?.trim();
                  
                  return (
                    <div key={field} className="validation-row">
                      <div className="validation-key">
                        <span className="field-name">{field}</span>
                        <div className="validation-counters">
                          <span className="approve-counter">👍 {validation.validated_count}</span>
                          <span className="dislike-counter">👎 {validation.dislike_count}</span>
                          {validation.locked && <span className="locked-indicator">🔒</span>}
                        </div>
                      </div>
                      
                      <div className="validation-value">
                        <div className="validation-input-container">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            disabled={validation.locked}
                            className={`validation-input ${validation.locked ? 'locked' : ''} ${isEmpty ? 'empty' : ''}`}
                            placeholder={`Enter ${field}...`}
                          />
                        </div>
                        
                        <div className="validation-actions">
                          <button
                            onClick={() => handleApprove(field)}
                            disabled={isEmpty || validation.locked}
                            className="validation-action-btn approve-btn"
                            title={isEmpty ? "Cannot approve empty value" : (validation.locked ? "Field is locked" : "Approve this value")}
                          >
                            👍
                          </button>
                          
                          {validation.locked && (
                            <button
                              onClick={() => handleDislike(field)}
                              className="validation-action-btn dislike-btn"
                              title="Dislike this field"
                            >
                              👎
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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