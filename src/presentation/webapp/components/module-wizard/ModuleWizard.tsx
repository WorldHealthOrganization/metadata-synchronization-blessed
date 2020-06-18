import { Wizard, WizardStep } from "d2-ui-components";
import _ from "lodash";
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Module } from "../../../../domain/modules/entities/Module";
import { MetadataModule } from "../../../../domain/modules/entities/modules/MetadataModule";
import { moduleSteps, ModuleWizardStepProps } from "./Steps";

export interface ModuleWizardProps {
    onCancel: () => void;
    onClose: () => void;
}

export const ModuleWizard: React.FC<ModuleWizardProps> = ({ onCancel, onClose }) => {
    const location = useLocation();
    const [module, onChange] = useState<Module>(MetadataModule.build());

    const props: ModuleWizardStepProps = { module, onChange, onCancel, onClose };
    const steps = moduleSteps.map(step => ({ ...step, props }));

    const onStepChangeRequest = async (_currentStep: WizardStep, newStep: WizardStep) => {
        const index = _(steps).findIndex(step => step.key === newStep.key);
        return _.take(steps, index).flatMap(({ validationKeys }) =>
            module.validate(validationKeys).map(({ description }) => description)
        );
    };

    const urlHash = location.hash.slice(1);
    const stepExists = steps.find(step => step.key === urlHash);
    const firstStepKey = steps.map(step => step.key)[0];
    const initialStepKey = stepExists ? urlHash : firstStepKey;

    return (
        <Wizard
            useSnackFeedback={true}
            onStepChangeRequest={onStepChangeRequest}
            initialStepKey={initialStepKey}
            lastClickableStepIndex={steps.length - 1}
            steps={steps}
        />
    );
};
