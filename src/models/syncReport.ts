import _ from "lodash";
import { generateUid } from "d2/uid";

import { deleteData, getDataById, getPaginatedData, saveData } from "./dataStore";
import { D2, Response } from "../types/d2";
import { TableFilters, TableList, TablePagination } from "../types/d2-ui-components";
import {
    SynchronizationReport,
    SynchronizationReportStatus,
    SynchronizationResult,
} from "../types/synchronization";

const notificationsDataStoreKey = "notifications";

export default class SyncReport {
    private syncReport: SynchronizationReport;

    constructor(syncReport: SynchronizationReport) {
        this.syncReport = {
            id: generateUid(),
            timestamp: new Date(),
            ...syncReport,
        };
    }

    public static create(): SyncReport {
        return new SyncReport({
            id: "",
            user: "",
            status: "READY" as SynchronizationReportStatus,
            results: [],
            selectedTypes: [],
        });
    }

    public static build(syncReport: SynchronizationReport | undefined): SyncReport {
        return syncReport ? new SyncReport(syncReport) : this.create();
    }

    public static async get(d2: D2, id: string): Promise<SyncReport> {
        const data = await getDataById(d2, notificationsDataStoreKey, id);
        return this.build(data);
    }

    public static async list(
        d2: D2,
        filters: TableFilters,
        pagination: TablePagination
    ): Promise<TableList> {
        return getPaginatedData(d2, notificationsDataStoreKey, filters, pagination);
    }

    public async save(d2: D2): Promise<Response> {
        console.debug("Start saving SyncReport to dataStore");
        const exists = this.syncReport.id;
        const element = exists ? this.syncReport : { ...this.syncReport, id: generateUid() };

        if (exists) await this.remove(d2);

        const result = await saveData(d2, notificationsDataStoreKey, element);
        console.debug("Finish saving SyncReport to dataStore", element);
        return result;
    }

    public async remove(d2: D2): Promise<Response> {
        return deleteData(d2, notificationsDataStoreKey, this.syncReport);
    }

    public addSyncResult(result: SynchronizationResult): void {
        const results = _.unionBy([result], this.syncReport.results, "instance.id");
        this.syncReport = { ...this.syncReport, results };
    }

    public setStatus(status: SynchronizationReportStatus): void {
        this.syncReport.status = status;
    }

    public hasErrors(): boolean {
        return _.some(this.syncReport.results, result => result.status !== "OK");
    }
}