declare module "react-window" {
  import * as React from "react";

  export interface FixedSizeListProps {
    height: number;
    width: number | string;
    itemCount: number;
    itemSize: number;
    itemData?: any;
    className?: string;
    children: React.ComponentType<any>;
    ref?: any;
  }

  export class FixedSizeList extends React.Component<FixedSizeListProps> {}
}
