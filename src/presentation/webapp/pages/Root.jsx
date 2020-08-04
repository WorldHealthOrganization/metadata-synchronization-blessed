import React from "react";
import { HashRouter, Switch } from "react-router-dom";
import * as permissions from "../../../utils/permissions";
import { useAppContext } from "../../common/contexts/AppContext";
import RouteWithSession from "../components/auth/RouteWithSession";
import RouteWithSessionAndAuth from "../components/auth/RouteWithSessionAndAuth";
import HistoryPage from "./history/HistoryPage";
import HomePage from "./home/HomePage";
import InstanceCreationPage from "./instance-creation/InstanceCreationPage";
import InstanceListPage from "./instance-list/InstanceListPage";
import InstanceMappingLandingPage from "./instance-mapping/InstanceMappingLandingPage";
import InstanceMappingPage from "./instance-mapping/InstanceMappingPage";
import ManualSyncPage from "./manual-sync/ManualSyncPage";
import ModuleListPage from "./module-list/ModuleListPage";
import ModuleCreationPage from "./modules-creation/ModuleCreationPage";
import StoreConfigPage from "./store-config/StoreConfigPage";
import SyncRulesCreationPage from "./sync-rules-creation/SyncRulesCreationPage";
import SyncRulesPage from "./sync-rules-list/SyncRulesListPage";

function Root() {
    const { api } = useAppContext();

    return (
        <HashRouter>
            <Switch>
                <RouteWithSession
                    path={"/instances/mapping/:id/:section(aggregated|tracker|orgUnit|global)"}
                    render={props => <InstanceMappingPage {...props} />}
                />

                <RouteWithSession
                    path={"/instances/mapping/:id"}
                    render={props => <InstanceMappingLandingPage {...props} />}
                />

                <RouteWithSession
                    path={"/instances/:action(new|edit)/:id?"}
                    render={props => <InstanceCreationPage {...props} />}
                />

                <RouteWithSession
                    path="/instances"
                    render={props => <InstanceListPage {...props} />}
                />

                <RouteWithSession
                    path="/sync/:type(metadata|aggregated|events|deleted)"
                    authorize={props =>
                        props.match.params.type !== "deleted" ||
                        permissions.shouldShowDeletedObjects(api)
                    }
                    render={props => <ManualSyncPage {...props} />}
                />

                <RouteWithSessionAndAuth
                    path={"/sync-rules/:type(metadata|aggregated|events)/:action(new|edit)/:id?"}
                    authorize={props =>
                        permissions.verifyUserHasAccessToSyncRule(api, props.match.params.id)
                    }
                    render={props => <SyncRulesCreationPage {...props} />}
                />

                <RouteWithSession
                    path="/sync-rules/:type(metadata|aggregated|events)"
                    render={props => <SyncRulesPage {...props} />}
                />

                <RouteWithSession
                    path="/history/:type(metadata|aggregated|events)/:id?"
                    render={props => <HistoryPage {...props} />}
                />

                <RouteWithSession
                    path={"/modules/:action(new|edit)"}
                    render={props => <ModuleCreationPage {...props} />}
                />

                <RouteWithSession
                    path="/modules/config"
                    render={props => <StoreConfigPage {...props} />}
                />

                <RouteWithSession
                    path="/:list(modules|packages)"
                    render={props => <ModuleListPage {...props} />}
                />

                <RouteWithSession render={() => <HomePage />} />
            </Switch>
        </HashRouter>
    );
}

export default Root;
