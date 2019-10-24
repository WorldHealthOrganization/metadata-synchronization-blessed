import i18n from "../../../locales";
import GeneralInfoStep from "./steps/GeneralInfoStep";
import SchedulerStep from "./steps/SchedulerStep";
import InstanceSelectionStep from "./steps/InstanceSelectionStep";
import SaveStep from "./steps/SaveStep";

const commonStepsBaseInfo = {
    generalInfo: {
        key: "general-info",
        label: i18n.t("General info"),
        component: GeneralInfoStep,
        validationKeys: ["name"],
        description: undefined,
        help: undefined,
    },
    instanceSelection: {
        key: "instance-selection",
        label: i18n.t("Instance Selection"),
        component: InstanceSelectionStep,
        validationKeys: ["targetInstances"],
        description: undefined,
        help: undefined,
    },
    scheduler: {
        key: "scheduler",
        label: i18n.t("Scheduling"),
        component: SchedulerStep,
        validationKeys: ["frequency", "enabled"],
        description: i18n.t("Configure the scheduling frequency for the synchronization rule"),
        warning: i18n.t(
            "This step is optional and requires an external server with the metadata synchronization script properly configured"
        ),
        help: [
            i18n.t(
                "This step allows to schedule background metadata synchronization jobs in a remote server."
            ),
            i18n.t(
                "You can either select a pre-defined frequency from the drop-down menu or you enter a custom cron expression."
            ),
            "A cron expression is a string comprising six fields separated by white space that represents a routine.",
            i18n.t("Second (0 - 59)"),
            i18n.t("Minute (0 - 59)"),
            i18n.t("Hour (0 - 23)"),
            i18n.t("Day of the month (1 - 31)"),
            i18n.t("Month (1 - 12)"),
            i18n.t("Day of the week (1 - 7) (Monday to Sunday)"),
            i18n.t(
                "An asterisk (*) matches all possibilities. For instance, if we want to run a rule every day we would use asterisks for day of the month, day of the week, and month of the year to match all values."
            ),
            i18n.t(
                "A wildcard (?) means no specific value and only works for day of the month or day of the week. For example, if you want to execute a rule on a particular day (10th) but you don't care about what day of the week that is, you would use ? in the day of the week field."
            ),
        ].join("\n"),
    },
    summary: {
        key: "summary",
        label: i18n.t("Summary"),
        component: SaveStep,
        validationKeys: [],
        description: undefined,
        help: undefined,
    },
};

export default commonStepsBaseInfo;