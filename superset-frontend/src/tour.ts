import { Step } from 'react-shepherd';
import semver from 'semver';

export interface VersionGap {
  start?: semver.SemVer;
  end?: semver.SemVer;
}

export interface VersionedTourStep {
  version: semver.SemVer;
  location?: RegExp;
  step: Step.StepOptions;
}

const steps: VersionedTourStep[] = [
  {
    version: new semver.SemVer('1.5.0'),
    location: /\/superset\/welcome.*/,
    step: {
      id: 'test',
      text: '<p>Hello!</p>',
    },
  },
];

export function getSteps(location: string, gap: VersionGap) {
  const result: Step.StepOptions[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.location && (step.location.exec(location) ?? []).length === 0) {
      continue;
    }
    if (gap.start && gap.start.compare(step.version) == 1) {
      continue;
    }
    if (gap.end && gap.end.compare(step.version) == -1) {
      continue;
    }
    result.push(step.step);
  }
  return result;
}
