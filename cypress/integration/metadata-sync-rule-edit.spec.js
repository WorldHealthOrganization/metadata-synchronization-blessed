import MetadataSyncRuleDetailPageObject from "../support/page-objects/MetadataSyncRuleDetailPageObject";

context("Edit Metadata sync rule", function() {
    const page = new MetadataSyncRuleDetailPageObject(cy);

    beforeEach(() => {
        cy.fixture("metadata-sync-rules.json").then(syncRules => {
            this.syncRule = syncRules[0];
            cy.server();
            cy.route({
                method: "GET",
                url: `api/dataStore/metadata-synchronization/rules`,
                response: syncRules,
            });
        });
    });

    it("should have the correct title", () => {
        page.open(this.syncRule.id).assertTitle(title =>
            title.contains("Edit metadata synchronization rule")
        );
    });

    it("should have the correct general info", () => {
        page.open(this.syncRule.id)
            .assertName(name => name.should("have.value", this.syncRule.name))
            .assertCode(name => name.should("have.value", this.syncRule.code))
            .assertDescription(name => name.should("have.value", this.syncRule.description));
    });

    it("should have the correct selected metadata", () => {
        page.open(this.syncRule.id)
            .next()
            .checkOnlySelectedItems()
            .assertSelectedMetadata(selectedMetadata => {
                selectedMetadata.contains(
                    `There are ${this.syncRule.builder.metadataIds.length} items selected in all pages.`
                );
            });
    });

    it("should have the correct selected instances", () => {
        page.open(this.syncRule.id)
            .next()
            .next()
            .next()
            .assertSelectedInstances(selectedInstances =>
                selectedInstances.select(this.syncRule.builder.targetInstances[0])
            );
    });
});
