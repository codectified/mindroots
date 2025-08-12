import React from 'react';
import ReactDOM from 'react-dom';
import '../../styles/info-bubble.css';

const NodeInspector = ({ nodeData, onClose }) => {
  if (!nodeData) return null;

  const { nodeType, nodeId, properties, relationships, connectedNodeCounts, summary } = nodeData;

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

  const inspector = (
    <div className="node-inspector-overlay">
      <div className="node-inspector">
        <div className="node-inspector-header">
          <h2>{nodeType} Inspector</h2>
          <div className="node-id">ID: {nodeId}</div>
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
              {Object.entries(properties).map(([key, prop]) => (
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