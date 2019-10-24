import React from "react";
import { withSnackbar } from "d2-ui-components";

import MetadataTable from "../../../metadata-table/MetadataTable";
import { D2Api } from "../../../../types/d2";
import SyncRule from "../../../../models/syncRule";

interface CategoryOptionsStepProps {
    d2: D2Api;
    syncRule: SyncRule;
    //snackbar: PropTypes.object.isRequired,
    onChange: () => void;
}

const changeSelection = (metadataIds: string[]) => {
    console.log(`change selection ${metadataIds}`);
};

export default function CategoryOptionsSelectionStep(props: CategoryOptionsStepProps) {
    const { d2, syncRule, ...rest } = props;

    const component = (
        <MetadataTable
            d2={d2}
            notifyNewSelection={changeSelection}
            initialSelection={[]}
            models={[]}
            {...rest}
        />
    );

    return withSnackbar(component);
}