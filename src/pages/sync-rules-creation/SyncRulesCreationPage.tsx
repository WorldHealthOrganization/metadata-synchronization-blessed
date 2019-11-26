import { useD2 } from "d2-api";
import { ConfirmationDialog } from "d2-ui-components";
import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import PageHeader from "../../components/page-header/PageHeader";
import SyncWizard from "../../components/sync-wizard/SyncWizard";
import i18n from "../../locales";
import SyncRule from "../../models/syncRule";
import { D2 } from "../../types/d2";

interface SyncRulesCreationProps {}

const SyncRulesCreation: React.FC<SyncRulesCreationProps> = () => {
    const history = useHistory();
    const { id, action, type } = useParams();
    const d2 = useD2();
    const [dialogOpen, updateDialogOpen] = useState(false);
    const [syncRule, updateSyncRule] = useState(
        SyncRule.create(type as "data" | "metadata" | undefined)
    );
    const isEdit = action === "edit" && !!id;

    const title = !isEdit
        ? i18n.t(`New synchronization rule`)
        : i18n.t(`Edit synchronization rule`);

    const cancel = !isEdit
        ? i18n.t(`Cancel synchronization rule creation`)
        : i18n.t(`Cancel synchronization rule editing`);

    const closeDialog = () => updateDialogOpen(false);
    const openDialog = () => updateDialogOpen(true);

    const exit = () => {
        updateDialogOpen(false);
        history.goBack();
    };

    useEffect(() => {
        if (isEdit && !!id) {
            SyncRule.get(d2 as D2, id).then(updateSyncRule);
        }
    }, [d2, id, isEdit]);

    return (
        <React.Fragment>
            <ConfirmationDialog
                isOpen={dialogOpen}
                onSave={exit}
                onCancel={closeDialog}
                title={cancel}
                description={i18n.t("All your changes will be lost. Are you sure?")}
                saveText={i18n.t("Ok")}
            />

            <PageHeader title={title} onBackClick={openDialog} />

            <SyncWizard
                isEdit={isEdit}
                syncRule={syncRule}
                onChange={updateSyncRule}
                onCancel={exit}
            />
        </React.Fragment>
    );
};

export default SyncRulesCreation;
