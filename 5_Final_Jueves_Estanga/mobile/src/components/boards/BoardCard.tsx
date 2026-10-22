import React from 'react';
import { SurfboardCard, SurfboardCardProps } from './SurfboardCard';

export type BoardCardProps = SurfboardCardProps;

export const BoardCard: React.FC<BoardCardProps> = (props) => {
  return <SurfboardCard {...props} />;
};
