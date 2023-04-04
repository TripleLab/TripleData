import React from 'react';
import SplitPane, { SplitPaneProps } from 'react-split-pane';
import classNames from 'classnames';
import css from './Splitter.css';

export default function Splitter({
  className,
  ...rest
}: SplitPaneProps & { children: React.ReactNode }) {
  return (
    <SplitPane
      split="vertical"
      // minSize={1350}
      defaultSize={1350}
      className={classNames(css.root, className)}
      {...rest}
    />
  );
}
