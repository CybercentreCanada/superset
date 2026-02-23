import { useEffect, useState } from 'react';
import { t } from '@superset-ui/core';
import { CustomCellRendererProps } from '@superset-ui/core/components/ThemedAgGridReact';

export default (props: CustomCellRendererProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    props.node.setExpanded(expanded);
  }, [expanded, props.node]);

  return (
    <button
      type="button"
      className="ag-cell ag-cell-not-inline-editing ag-cell-normal-height ag-cell-value ag-grid-btn-row-expander"
      style={{
        fontFamily: '"Inter", Helvetica, Arial',
        fontSize: '12px',
        cursor: 'pointer',
      }} // nitpicky overrides
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? t('Collapse row') : t('Expand row')}
    </button>
  );
};
