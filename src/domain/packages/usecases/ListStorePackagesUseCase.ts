import _ from "lodash";
import moment from "moment";
import { cache } from "../../../utils/cache";
import { promiseMap } from "../../../utils/common";
import { Either } from "../../common/entities/Either";
import { UseCase } from "../../common/entities/UseCase";
import { RepositoryFactory } from "../../common/factories/RepositoryFactory";
import { Instance } from "../../instance/entities/Instance";
import { InstanceRepositoryConstructor } from "../../instance/repositories/InstanceRepository";
import { MetadataModule } from "../../modules/entities/MetadataModule";
import { BaseModule } from "../../modules/entities/Module";
import { Repositories } from "../../Repositories";
import { Namespace } from "../../storage/Namespaces";
import { StorageRepositoryConstructor } from "../../storage/repositories/StorageRepository";
import { GitHubError, GitHubListError } from "../entities/Errors";
import { ListPackage, Package } from "../entities/Package";
import { Store } from "../entities/Store";
import { GitHubRepositoryConstructor, moduleFile } from "../repositories/GitHubRepository";

export type ListStorePackagesError = GitHubError | "STORE_NOT_FOUND";

export class ListStorePackagesUseCase implements UseCase {
    constructor(private repositoryFactory: RepositoryFactory, private localInstance: Instance) {}

    public async execute(storeId: string): Promise<Either<ListStorePackagesError, ListPackage[]>> {
        const store = (
            await this.storageRepository(this.localInstance).getObject<Store[]>(Namespace.STORES)
        )?.find(store => store.id === storeId);

        if (!store) return Either.error("STORE_NOT_FOUND");

        const userGroups = await this.instanceRepository(this.localInstance).getUserGroups();
        const validation = await this.gitRepository().listBranches(store);
        if (validation.isError()) return Either.error(validation.value.error);

        const branches = validation.value.data?.flatMap(({ name }) => name) ?? [];
        const matchingBranches = _.intersection(
            userGroups.map(({ name }) => name.replace(/\s/g, "-")),
            branches
        );

        const rawPackages = await promiseMap(matchingBranches, userGroup =>
            this.getPackages(store, userGroup)
        );

        const packages = _.compact(rawPackages.flatMap(({ value }) => value.data));

        return Either.success(packages);
    }

    @cache()
    private gitRepository() {
        return this.repositoryFactory.get<GitHubRepositoryConstructor>(
            Repositories.GitHubRepository,
            []
        );
    }

    @cache()
    private storageRepository(instance: Instance) {
        return this.repositoryFactory.get<StorageRepositoryConstructor>(
            Repositories.StorageRepository,
            [instance]
        );
    }

    @cache()
    private instanceRepository(instance: Instance) {
        return this.repositoryFactory.get<InstanceRepositoryConstructor>(
            Repositories.InstanceRepository,
            [instance, ""]
        );
    }

    private async getPackages(
        store: Store,
        userGroup: string
    ): Promise<Either<GitHubListError, Package[]>> {
        const validation = await this.gitRepository().listFiles(store, userGroup);

        if (validation.isError()) return Either.error(validation.value.error);

        const files = validation.value.data?.filter(file => file.type === "blob") ?? [];

        const packageFiles = files.filter(file => !file.path.includes(moduleFile));
        const moduleFiles = files.filter(file => file.path.includes(moduleFile));

        const packages = await promiseMap(packageFiles, async ({ path, url }) => {
            const details = this.extractPackageDetailsFromPath(path);
            if (!details) return undefined;

            const { moduleName, name, version, dhisVersion, created } = details;

            const moduleFileUrl =
                moduleFiles.find(file => file.path === `${moduleName}/${moduleFile}`)?.url ??
                undefined;
            const module = await this.getModule(store, moduleFileUrl);

            return Package.build({ id: url, name, version, dhisVersion, created, module });
        });

        return Either.success(_.compact(packages));
    }

    private async getModule(store: Store, moduleFileUrl?: string): Promise<BaseModule> {
        const unknownModule = MetadataModule.build({
            id: "Unknown module",
            name: "Unknown module",
        });

        if (!moduleFileUrl) return unknownModule;

        const { encoding, content } = await this.gitRepository().request<{
            encoding: string;
            content: string;
        }>(store, moduleFileUrl);

        const readFileResult = this.gitRepository().readFileContents<BaseModule>(encoding, content);

        return readFileResult.match({
            success: module => module,
            error: () => unknownModule,
        });
    }

    private extractPackageDetailsFromPath(path: string) {
        const tokens = path.split("-");
        if (tokens.length === 4) {
            const [fileName, version, dhisVersion, date] = tokens;
            const [moduleName, ...name] = fileName.split("/");

            return {
                moduleName,
                name: name.join("/"),
                version,
                dhisVersion,
                created: moment(date, "YYYYMMDDHHmm").toDate(),
            };
        } else if (tokens.length === 5) {
            const [fileName, version, versionTag, dhisVersion, date] = tokens;
            const [moduleName, ...name] = fileName.split("/");

            return {
                moduleName,
                name: name.join("/"),
                version: `${version}-${versionTag}`,
                dhisVersion,
                created: moment(date, "YYYYMMDDHHmm").toDate(),
            };
        } else return null;
    }
}
