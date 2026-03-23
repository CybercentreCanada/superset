import { memo } from 'react';

import { CellRendererProps } from '@superset-ui/plugin-chart-ag-grid-table';

// ag-grid renders uneditable bools with the ag-disabled class and it makes things kinda unreadable, so roll our own checkbox
const BooleanRenderer = memo((props: CellRendererProps) => {
  if (props.value === undefined) return <span />;
  return (
    <div className="ag-cell-wrapper ag-checkbox-cell" role="presentation">
      <div
        className="ag-labeled ag-label-align-right ag-checkbox ag-input-field"
        role="presentation"
      >
        <div
          className={`ag-wrapper ag-input-wrapper ag-checkbox-input-wrapper ${props.value ? 'ag-checked' : ''}`}
          role="presentation"
        >
          <input
            className="ag-input-field-input ag-checkbox-input"
            type="checkbox"
            value={props.value}
          />
        </div>
      </div>
    </div>
  );
});

export default BooleanRenderer;
