import type { PROGRESS_STATE } from '../config/progress';

export type ProgressState = (typeof PROGRESS_STATE)[keyof typeof PROGRESS_STATE];

export type ProgressStep = {
  key: string;
  label: string;
  time: Date | null;
  state: ProgressState;
};
