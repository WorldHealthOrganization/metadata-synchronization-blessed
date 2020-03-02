import { dataTest } from "../utils";
import ManualSyncPageObject from "./common/ManualSyncPageObject";

class ManualAggregatedSyncPageObject extends ManualSyncPageObject {
    constructor(cy) {
        super(cy, "aggregated-data");
    }

    open() {
        super.open("/#/sync/aggregated");
        return this;
    }

    selectAllAttributesCategoryOptions() {
        this.cy
            .get(
                '[data-test="FormControlLabel-sync-all-attribute-category-options"] > :nth-child(2)'
            )
            .click();
        this.cy.get(dataTest("group-editor-assign-all")).click();
        return this;
    }

    synchronize() {
        this.cy
            .route({
                method: "POST",
                url: "/api/dataValueSets*",
            })
            .as("postDataValueSets");

        this.syncButton.click();
        this.cy.wait("@postDataValueSets");
        return this;
    }
}

export default ManualAggregatedSyncPageObject;
