import { Checkbox, Icon } from "@material-ui/core";
import {
    ConfirmationDialog,
    ObjectsTable,
    ObjectsTableDetailField,
    TableAction,
    TableColumn,
    TableSelection,
    TableState,
    useLoading,
    useSnackbar,
} from "d2-ui-components";
import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Store } from "../../../../domain/packages/entities/Store";
import i18n from "../../../../locales";
import PageHeader from "../../../react/components/page-header/PageHeader";
import { useAppContext } from "../../../react/contexts/AppContext";

export const StoreListPage: React.FC = () => {
    const history = useHistory();
    const snackbar = useSnackbar();
    const [selection, setSelection] = useState<TableSelection[]>([]);
    const [rows, setRows] = useState<Store[]>([]);
    const [toDelete, setToDelete] = useState<string[]>([]);
    const [objectsTableKey, setObjectsTableKey] = useState(Math.random());

    const loading = useLoading();
    const { compositionRoot } = useAppContext();
    const getStores = compositionRoot.store.list;
    const deleteStore = compositionRoot.store.delete;
    const setStoreAsDefault = compositionRoot.store.setAsDefault;

    useEffect(() => {
        getStores().then(setRows);
    }, [getStores, objectsTableKey]);

    const backHome = useCallback(() => {
        history.push("/");
    }, [history]);

    const handleCreateStore = useCallback(() => {
        history.push(`/stores/new`);
    }, [history]);

    const handleEditStore = useCallback(
        (id: string) => {
            history.push(`/stores/edit/${id}`);
        },
        [history]
    );

    const handleSetStoreAsDefault = useCallback(
        async (id: string) => {
            const result = await setStoreAsDefault(id);
            result.match({
                error: () => {
                    snackbar.error(i18n.t("An error has occurred setting store as default"));
                },
                success: () => setObjectsTableKey(Math.random()),
            });
        },
        [setStoreAsDefault, snackbar]
    );

    const updateTable = useCallback(
        ({ selection }: TableState<Store>) => {
            setSelection(selection);
        },
        [setSelection]
    );

    const confirmDelete = async () => {
        loading.show(true, "Deleting stores");

        for (const id of toDelete) {
            await deleteStore(id);
        }

        setObjectsTableKey(Math.random());
        setSelection([]);
        setToDelete([]);
        loading.reset();
    };

    const columns: TableColumn<Store>[] = [
        { name: "id", text: i18n.t("Id"), sortable: true, hidden: true },
        { name: "account", text: i18n.t("Account"), sortable: true },
        { name: "repository", text: i18n.t("Repository"), sortable: true },
        { name: "token", text: i18n.t("Token"), sortable: true, hidden: true },
        {
            name: "default",
            text: i18n.t("Default"),
            sortable: true,
            getValue: store => {
                return <Checkbox disabled={true} checked={store.default} />;
            },
        },
    ];

    const details: ObjectsTableDetailField<Store>[] = [
        { name: "id", text: i18n.t("ID") },
        { name: "account", text: i18n.t("Account") },
        { name: "repository", text: i18n.t("Repository") },
        { name: "token", text: i18n.t("Token") },
        { name: "default", text: i18n.t("Default") },
    ];

    const actions: TableAction<Store>[] = [
        {
            name: "details",
            text: i18n.t("Details"),
            multiple: false,
        },
        {
            name: "edit",
            text: i18n.t("Edit"),
            multiple: false,
            onClick: (ids: string[]) => handleEditStore(ids[0]),
            primary: true,
            icon: <Icon>edit</Icon>,
        },
        {
            name: "delete",
            text: i18n.t("Delete"),
            multiple: true,
            onClick: setToDelete,
            icon: <Icon>delete</Icon>,
        },
        {
            name: "setAdDefault",
            text: i18n.t("Set as default"),
            multiple: false,
            onClick: (ids: string[]) => handleSetStoreAsDefault(ids[0]),
            icon: <Icon>cloud_download</Icon>,
        },
    ];

    return (
        <React.Fragment>
            <PageHeader title={i18n.t("Stores")} onBackClick={backHome} />

            <ObjectsTable<Store>
                rows={rows}
                columns={columns}
                details={details}
                actions={actions}
                onActionButtonClick={handleCreateStore}
                forceSelectionColumn={true}
                selection={selection}
                onChange={updateTable}
            />

            {toDelete.length > 0 && (
                <ConfirmationDialog
                    isOpen={true}
                    onSave={confirmDelete}
                    onCancel={() => setToDelete([])}
                    title={i18n.t("Delete Stores?")}
                    description={
                        toDelete
                            ? i18n.t("Are you sure you want to delete {{count}} stores?", {
                                  count: toDelete.length,
                              })
                            : ""
                    }
                    saveText={i18n.t("Ok")}
                />
            )}
        </React.Fragment>
    );
};

export default StoreListPage;
