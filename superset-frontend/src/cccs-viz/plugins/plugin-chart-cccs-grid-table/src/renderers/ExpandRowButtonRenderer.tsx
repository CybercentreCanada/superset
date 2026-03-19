import { useEffect, useState } from 'react';
import { t, useTheme } from '@superset-ui/core';
import { CustomCellRendererProps } from '@superset-ui/core/components/ThemedAgGridReact';

export default (props: CustomCellRendererProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const theme = useTheme();

  useEffect(() => {
    props.node.setExpanded(expanded);
  }, [expanded, props.node]);

  return (
    <button
      type="button"
      className="ag-cell ag-cell-not-inline-editing ag-cell-normal-height ag-cell-value ag-grid-btn-row-expander"
      style={{
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSizeSM,
        textDecoration: 'underline',
        color: theme.colorLink,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? t('Collapse row') : t('Expand row')}
    </button>
  );
};
