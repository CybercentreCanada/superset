import React, { useEffect, useRef, useState } from 'react';

export default props => {
  const [ascSort, setAscSort] = useState('inactive');
  const [descSort, setDescSort] = useState('inactive');
  const [noSort, setNoSort] = useState('inactive');
  const refButton = useRef(null);
  const refLabel = useRef(null);

  const onMenuClicked = () => {
    props.showColumnMenu(refButton.current);
  };

  const onSortChanged = () => {
    setAscSort(props.column.isSortAscending() ? 'active' : 'inactive');
    setDescSort(props.column.isSortDescending() ? 'active' : 'inactive');
    setNoSort(
      !props.column.isSortAscending() && !props.column.isSortDescending()
        ? 'active'
        : 'inactive',
    );
  };

  const onSortRequested = (order, event) => {
    props.setSort(order, event.shiftKey);
  };

  useEffect(() => {
    props.column.addEventListener('sortChanged', onSortChanged);
    onSortChanged();
  }, []);

  useEffect(() => {
    if (!refLabel.current) {
      return;
    }
  }, [refLabel]);

  let sort = null;

  if (props.enableSorting) {
    sort = (
      <>
        <div
          onClick={event => onSortRequested('asc', event)}
          onTouchEnd={event => onSortRequested('asc', event)}
          className={`customSortDownLabel ${ascSort}`}
          role="button"
          tabIndex="0"
        >
          <i className="fa fa-long-arrow-alt-down" />
        </div>
        <div
          onClick={event => onSortRequested('desc', event)}
          onTouchEnd={event => onSortRequested('desc', event)}
          className={`customSortUpLabel ${descSort}`}
          role="button"
          tabIndex="0"
        >
          <i className="fa fa-long-arrow-alt-up" />
        </div>
        <div
          onClick={event => onSortRequested('', event)}
          onTouchEnd={event => onSortRequested('', event)}
          className={`customSortRemoveLabel ${noSort}`}
          role="button"
          tabIndex="0"
        >
          <i className="fa fa-times" />
        </div>
      </>
    );
  }

  return (
    <div className="headerWrapper">
      <div
        ref={refButton}
        className="customHeaderMenuButton"
        onClick={() => onMenuClicked()}
        role="button"
        tabIndex="0"
      >
        <i className={`fa ${props.menuIcon}`} />
      </div>
      <div ref={refLabel} className="customHeaderLabel">
        {props.displayName}
      </div>
      {sort}
    </div>
  );
};
