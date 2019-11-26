import { useD2 } from "d2-api";
import i18n from "@dhis2/d2-i18n";
import _ from "lodash";
import React, { useState } from "react";
import { metadataModels } from "../../../models/d2ModelFactory";
import SyncRule from "../../../models/syncRule";
import MetadataTable from "../../metadata-table/MetadataTable";
import { useSnackbar } from "d2-ui-components";

interface MetadataSelectionStepProps {
    syncRule: SyncRule;
    onChange(syncRule: SyncRule): void;
}

const MetadataSelectionStep: React.FC<MetadataSelectionStepProps> = ({
    syncRule,
    onChange,
    ...rest
}) => {
    const [metadataIds, updateMetadataIds] = useState<string[]>([]);
    const d2 = useD2();
    const snackbar = useSnackbar();

    const changeSelection = (newMetadataIds: string[]) => {
        const additions = _.difference(newMetadataIds, metadataIds);
        if (additions.length > 0) {
            snackbar.info(
                i18n.t("Selected {{difference}} elements", { difference: additions.length }),
                {
                    autoHideDuration: 1000,
                }
            );
        }

        const removals = _.difference(metadataIds, newMetadataIds);
        if (removals.length > 0) {
            snackbar.info(
                i18n.t("Removed {{difference}} elements", {
                    difference: Math.abs(removals.length),
                }),
                { autoHideDuration: 1000 }
            );
        }

        onChange(syncRule.updateMetadataIds(newMetadataIds));
        updateMetadataIds(newMetadataIds);
    };

    return (
        <MetadataTable
            d2={d2}
            notifyNewSelection={changeSelection}
            initialSelection={syncRule.metadataIds}
            models={metadataModels}
            {...rest}
        />
    );
};

export default MetadataSelectionStep;
