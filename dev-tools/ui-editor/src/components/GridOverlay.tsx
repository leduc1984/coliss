import React from 'react';
import styled from 'styled-components';

const GridContainer = styled.div<{ gridSize: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.3;
  background-image: 
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: ${props => props.gridSize}px ${props => props.gridSize}px;
`;

const MajorGridContainer = styled.div<{ gridSize: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.2;
  background-image: 
    linear-gradient(to right, rgba(0, 122, 204, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 122, 204, 0.3) 1px, transparent 1px);
  background-size: ${props => props.gridSize * 5}px ${props => props.gridSize * 5}px;
`;

interface GridOverlayProps {
  gridSize: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ gridSize }) => {
  return (
    <>
      <GridContainer gridSize={gridSize} />
      <MajorGridContainer gridSize={gridSize} />
    </>
  );
};