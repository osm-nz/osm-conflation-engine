import { use } from 'react';
import { Button, Group, Stepper } from '@mantine/core';
import { HostContext } from '../../context/HostContext.js';
import classes from './Steps.module.css';

export enum Step {
  Import,
  Download,
  Conflate,
  Review,
  Upload,
}

export interface StepsProps {
  step: Step;
  setStep(step: Step): void;
  isImported: boolean;
  isReviewAvailable: boolean;
}

export const Steps: React.FC<StepsProps> = ({
  step,
  setStep,
  isImported,
  isReviewAvailable,
}) => {
  const { $ } = use(HostContext);

  // step 3 (conflate) is special, it's basically a loading indicator.
  // so you can't go directly to that step.
  const nextStep = {
    [Step.Import]: isImported ? Step.Download : undefined,
    [Step.Download]: isReviewAvailable ? Step.Review : undefined,
    [Step.Conflate]: undefined,
    [Step.Review]: undefined,
    [Step.Upload]: undefined,
  }[step];

  const prevStep = {
    [Step.Import]: undefined,
    [Step.Download]: Step.Import,
    [Step.Conflate]: Step.Download,
    [Step.Review]: Step.Download,
    [Step.Upload]: Step.Review,
  }[step];

  return (
    <div className={classes.subnav}>
      <Stepper
        className={classes.stepper}
        classNames={{ stepBody: classes.stepBody }}
        wrap={false}
        active={step}
        onStepClick={setStep}
        size="sm"
      >
        <Stepper.Step label={$('gtfs.Steps.import')} allowStepSelect />
        <Stepper.Step
          label={$('gtfs.Steps.download')}
          allowStepSelect={isImported}
        />
        <Stepper.Step
          label={$('gtfs.Steps.conflate')}
          loading={step === Step.Conflate}
          allowStepSelect={false}
        />
        <Stepper.Step
          label={$('gtfs.Steps.review')}
          allowStepSelect={isReviewAvailable}
        />
        <Stepper.Step label={$('gtfs.Steps.upload')} allowStepSelect={false} />
      </Stepper>

      <Group gap="xs" wrap="nowrap">
        <Button
          variant="default"
          disabled={prevStep === undefined}
          onClick={() => setStep(prevStep!)}
        >
          {$('Steps.back')}
        </Button>
        <Button
          disabled={nextStep === undefined}
          onClick={() => setStep(nextStep!)}
        >
          {$('Steps.next')}
        </Button>
      </Group>
    </div>
  );
};
