import handleRootNodeClick from './handleRootNodeClick';
import handleFormNodeClick from './handleFormNodeClick';

const handleNodeClick = async (node, script, rootData, setRootData, contextFilter) => {
  if (node.root_id) {
    await handleRootNodeClick(node, script, rootData, setRootData, contextFilter);
  } else if (node.form_id) {
    await handleFormNodeClick(node, script, rootData, setRootData, contextFilter);
  }
};

export default handleNodeClick;
