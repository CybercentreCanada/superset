import React, { useEffect, useRef, useState } from 'react';

export default props => {
  const refButton = useRef(null);
  const refLabel = useRef(null);

  const onMenuClicked = () => {
    props.showColumnMenu(refButton.current);
  };

  return (
    <div className="headerWrapper">
      <div
        ref={refButton}
        className="customHeaderMenuButton"
        onClick={() => onMenuClicked()}
        role="button"
        tabIndex="0"
      >
        <i className="fa fa-bars" />
      </div>
      <div ref={refLabel} className="customHeaderLabel">
        {props.displayName}
      </div>
    </div>
  );
};
