import React, { useEffect, useState } from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import { Button, LinearProgress, withStyles } from "@material-ui/core";
import { ConfirmationDialog } from "d2-ui-components";
import i18n from "@dhis2/d2-i18n";

import { getInstances } from "./InstanceSelectionStep";
import { getMetadata } from "../../../utils/synchronization";

const LiEntry = ({ label, value, children }) => {
    return (
        <li key={label}>
            {label}
            {value || children ? ": " : ""}
            {value}
            {children}
        </li>
    );
};

const styles = () => ({
    saveButton: {
        margin: 10,
        backgroundColor: "#2b98f0",
        color: "white",
    },
});

const SaveStep = props => {
    const { d2, syncRule, classes, onCancel } = props;
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [metadata, updateMetadata] = useState({});
    const [instanceOptions, setInstanceOptions] = useState([]);

    const parseMetadata = async () => {
        const metadata = await getMetadata(d2, syncRule.metadataIds, "id,name");
        updateMetadata(metadata);
        return metadata;
    };

    const openCancelDialog = () => setCancelDialogOpen(true);

    const closeCancelDialog = () => setCancelDialogOpen(false);

    const save = async () => {
        setIsSaving(true);
        await syncRule.save(d2);
        setIsSaving(false);
        onCancel();
    };

    const parseInstances = async () => {
        const instances = await getInstances(d2);
        setInstanceOptions(instances);
    };

    useEffect(() => {
        parseMetadata();
        parseInstances();
    }, [syncRule]);

    return (
        <React.Fragment>
            <ConfirmationDialog
                isOpen={cancelDialogOpen}
                onSave={onCancel}
                onCancel={closeCancelDialog}
                title={i18n.t("Cancel synchronization rule wizard")}
                description={i18n.t(
                    "You are about to exit the Sync Rule Creation Wizard. All your changes will be lost. Are you sure you want to proceed?"
                )}
                saveText={i18n.t("Yes")}
            />

            <ul>
                <LiEntry label={i18n.t("Name")} value={syncRule.name} />

                <LiEntry label={i18n.t("Description")} value={syncRule.description} />

                {_.keys(metadata).map(metadataType => (
                    <LiEntry
                        key={metadataType}
                        label={`${d2.models[metadataType].displayName} [${
                            metadata[metadataType].length
                        }]`}
                    >
                        <ul>
                            {metadata[metadataType].map(({ id, name }) => (
                                <LiEntry key={id} label={`${name} (${id})`} />
                            ))}
                        </ul>
                    </LiEntry>
                ))}

                <LiEntry
                    label={i18n.t("Target instances [{{total}}]", {
                        total: syncRule.targetInstances.length,
                    })}
                >
                    <ul>
                        {syncRule.targetInstances.map(id => {
                            const instance = instanceOptions.find(e => e.value === id);
                            return instance ? (
                                <LiEntry key={instance.value} label={instance.text} />
                            ) : null;
                        })}
                    </ul>
                </LiEntry>
            </ul>

            <Button onClick={openCancelDialog} variant="contained">
                {i18n.t("Cancel")}
            </Button>
            <Button className={classes.saveButton} onClick={save} variant="contained">
                {i18n.t("Save")}
            </Button>

            {isSaving && <LinearProgress />}
        </React.Fragment>
    );
};

SaveStep.propTypes = {
    syncRule: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
};

SaveStep.defaultProps = {};

export default withStyles(styles)(SaveStep);