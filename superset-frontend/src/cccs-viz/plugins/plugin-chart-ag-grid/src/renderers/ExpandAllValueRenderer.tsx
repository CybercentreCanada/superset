import {
  ICellRendererComp,
  ICellRendererParams,
  IRowNode,
} from 'ag-grid-enterprise';
import '../Button.css';

const EXPAND_BUTTON_CLASS_NAME = 'ag-grid-btn-row-expander';

export default class ExpandAllValueRenderer implements ICellRendererComp {
  eGui!: HTMLDivElement;

  expandButton: any;

  expanded: boolean;

  rowNode: IRowNode;

  // Optional - Params for rendering. The same params that are passed to the cellRenderer function.
  init(params: ICellRendererParams) {
    this.rowNode = params.node;
    this.expanded = this.rowNode.expanded || false;
    // create cell
    this.eGui = document.createElement('div');
    this.eGui.innerHTML = this.renderButton();

    this.expandButton = this.eGui.querySelector(`.ag-grid-btn-row-expander`)!;
    this.expandButton.addEventListener('click', this.toggleExpand);
  }

  // Mandatory - Return the DOM element of the component, this is what the grid puts into the cell
  getGui() {
    return this.eGui;
  }

  // Optional - Gets called once by grid after rendering is finished - if your renderer needs to do any cleanup,
  // do it here
  destroy(): void {
    if (this.expandButton) {
      this.expandButton.removeEventListener('click', this.toggleExpand);
    }
  }

  // Mandatory - Get the cell to refresh. Return true if the refresh succeeded, otherwise return false.
  // If you return false, the grid will remove the component from the DOM and create
  // a new component in its place with the new values.
  refresh(params: ICellRendererParams): boolean {
    this.rowNode = params.node;
    if (this.expanded !== this.rowNode.expanded) {
      this.toggleExpand();
    }
    return true;
  }

  renderButton(): string {
    return `
      <span>
        <button type="button" class=${EXPAND_BUTTON_CLASS_NAME}>
          Expand Row
        </button>
      </span>
    `;
  }

  // Set the current `expanded` field to the opposite of what it currently is
  // as well as set the row node to the new expanded value to update all cells in the row
  toggleExpand = () => {
    this.expanded = !this.expanded;
    this.rowNode.setExpanded(this.expanded);
    // update button text
    this.expandButton.innerHTML = !this.expanded
      ? 'Expand Row'
      : 'Collapse Row';
  };
}
