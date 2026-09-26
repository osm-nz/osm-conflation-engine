import { use } from 'react';
import { Button, Group, Stepper } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { LocaleContext } from '../../context/LocaleContext.js';
import classes from './ProjectPage.module.css';

export interface StepsProps {
  step: number;
  setStep(step: number): void;
  datasetCount: number;
  datasetFeatureCount: number;
  selectedFeatureCount: number;
}

export const Steps: React.FC<StepsProps> = ({
  step,
  setStep,
  datasetCount,
  datasetFeatureCount,
  selectedFeatureCount,
}) => {
  const { $ } = use(LocaleContext);

  const isStep2Available = !!datasetCount;
  const isStep3Available = !!selectedFeatureCount;

  const isNextEnabled = [isStep2Available, isStep3Available, false][step];
  const isPrevEnabled = !!step; // always enabled except on the first step

  return (
    <div className={classes.subnav}>
      <Stepper
        className={classes.stepper}
        active={step}
        onStepClick={setStep}
        size="sm"
      >
        <Stepper.Step
          label={$('Steps.select_datasets.title')}
          description={
            !!datasetCount &&
            $('Steps.select_datasets.summary', {
              datasetCount,
              datasetFeatureCount,
            })
          }
          allowStepSelect // always
        />
        <Stepper.Step
          label={$('Steps.select_features.title')}
          description={
            !!selectedFeatureCount &&
            $('Steps.select_features.summary', { selectedFeatureCount })
          }
          allowStepSelect={isStep2Available}
        />
        <Stepper.Step
          label={$('Steps.import.title')}
          description={$('Steps.import.subtitle')}
          allowStepSelect={isStep3Available && step >= 1}
        />
      </Stepper>

      <Group gap="xs" wrap="nowrap">
        <Button
          variant="default"
          disabled={!isPrevEnabled}
          onClick={() => setStep(step - 1)}
          leftSection={<IconArrowLeft size={16} />}
        >
          {$('Steps.back')}
        </Button>
        <Button
          disabled={!isNextEnabled}
          onClick={() => setStep(step + 1)}
          rightSection={<IconArrowRight size={16} />}
        >
          {$('Steps.next')}
        </Button>
      </Group>
    </div>
  );
};
