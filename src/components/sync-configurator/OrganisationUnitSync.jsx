import React from "react";
import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";

import Dropdown from "../shared/Dropdown";
import BaseSyncConfigurator from "./BaseSyncConfigurator";
import { OrganisationUnitModel } from "../../models/d2Model";
import { d2ModelFactory } from "../../models/d2ModelFactory";

export default class OrganisationUnitSync extends React.Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
    };

    state = {
        orgUnitGroupFilter: {
            value: "",
            items: [],
        },
        orgUnitLevelFilter: {
            value: "",
            items: [],
        },
    };

    componentDidMount() {
        this.getDropdownData();
    }

    getDropdownData = async () => {
        const { d2 } = this.props;

        const orgUnitGroupsClass = d2ModelFactory(d2, "organisationUnitGroups");
        const orgUnitGroupList = await orgUnitGroupsClass.listMethod(
            d2,
            { customFields: ["id", "name"] },
            { paging: false }
        );
        const orgUnitGroups = orgUnitGroupList.objects;
        const orgUnitGroupFilter = { ...this.state.orgUnitGroupFilter, items: orgUnitGroups };

        const orgUnitLevelsClass = d2ModelFactory(d2, "organisationUnitLevels");
        const orgUnitLevelsList = await orgUnitLevelsClass.listMethod(
            d2,
            { customFields: ["level", "name"] },
            { paging: false, sorting: ["level", "asc"] }
        );
        const orgUnitLevels = orgUnitLevelsList.objects.map(e => ({
            id: e.level,
            name: `${e.level}. ${e.name}`,
        }));
        const orgUnitLevelFilter = { ...this.state.orgUnitGroupFilter, items: orgUnitLevels };

        this.setState({ orgUnitGroupFilter, orgUnitLevelFilter });
    };

    handleGroupFilterChange = event => {
        const { items } = this.state.orgUnitGroupFilter;
        this.setState({ orgUnitGroupFilter: { value: event.target.value, items } });
    };

    handleLevelFilterChange = event => {
        const { items } = this.state.orgUnitLevelFilter;
        this.setState({ orgUnitLevelFilter: { value: event.target.value, items } });
    };

    renderExtraFilters = () => {
        const { orgUnitGroupFilter, orgUnitLevelFilter } = this.state;
        return [
            <Dropdown
                items={orgUnitGroupFilter.items}
                onChange={this.handleGroupFilterChange}
                value={orgUnitGroupFilter.value}
                label={i18n.t("Organisation Group")}
            />,

            <Dropdown
                items={orgUnitLevelFilter.items}
                onChange={this.handleLevelFilterChange}
                value={orgUnitLevelFilter.value}
                label={i18n.t("Organisation Level")}
            />,
        ];
    };

    render() {
        const { orgUnitGroupFilter, orgUnitLevelFilter } = this.state;
        const title = i18n.t("Organisation Units Synchronization");

        return (
            <BaseSyncConfigurator
                model={OrganisationUnitModel}
                title={title}
                renderExtraFilters={this.renderExtraFilters}
                extraFiltersState={{
                    orgUnitGroup: orgUnitGroupFilter.value,
                    orgUnitLevel: orgUnitLevelFilter.value,
                }}
                {...this.props}
            />
        );
    }
}
