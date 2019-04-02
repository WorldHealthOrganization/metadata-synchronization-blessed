import React from "react";
import BaseSyncConfigurator from "./BaseSyncConfigurator";
import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";
import { OrganisationUnitModel } from "../../models/d2Model";
import Dropdown from "../shared/Dropdown";

export default class OrganisationUnitSync extends React.Component {
    static propTypes = {
        d2: PropTypes.object.isRequired,
    };

    state = {
        orgUnitGroupFilter: {
            value: "",
            items: [],
        },
    };

    componentDidMount() {
        this.getDropdownData();
    }

    getDropdownData = async () => {
        const orgUnitGroups = await OrganisationUnitModel.getOrgUnitGroups(this.props.d2);
        const { value } = this.state.orgUnitGroupFilter;
        this.setState({ orgUnitGroupFilter: { value, items: orgUnitGroups } });
    };

    handleFilterChange = event => {
        const { items } = this.state.orgUnitGroupFilter;
        this.setState({ orgUnitGroupFilter: { value: event.target.value, items } });
    };

    renderExtraFilters = () => {
        const { items, value } = this.state.orgUnitGroupFilter;
        return (
            <Dropdown
                items={items}
                onChange={this.handleFilterChange}
                value={value}
                label={i18n.t("Organisation Unit Group")}
            />
        );
    };

    render() {
        const { d2 } = this.props;
        const title = i18n.t("Organisation Units Synchronization");
        return (
            <BaseSyncConfigurator
                d2={d2}
                model={OrganisationUnitModel}
                title={title}
                renderExtraFilters={this.renderExtraFilters}
                extraFiltersState={{ orgUnitGroup: this.state.orgUnitGroupFilter.value }}
            />
        );
    }
}
