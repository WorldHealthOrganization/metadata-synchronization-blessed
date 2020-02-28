import { D2Api } from "d2-api";
import _ from "lodash";
import { CategoryOptionModel, D2Model, OptionModel, ProgramStageModel } from "../../models/d2Model";
import { MetadataMapping, MetadataMappingDictionary } from "../../models/instance";
import { MetadataType } from "../../utils/d2";
import { cleanOrgUnitPath } from "../../utils/synchronization";

interface CombinedMetadata {
    id: string;
    name?: string;
    code?: string;
    path?: string;
    categoryCombo?: {
        id: string;
        name: string;
        categories: {
            categoryOptions: {
                id: string;
                name: string;
                shortName: string;
                code: string;
            }[];
        }[];
    };
    optionSet?: {
        options: {
            id: string;
            name: string;
            shortName: string;
            code: string;
        }[];
    };
    commentOptionSet?: {
        options: {
            id: string;
            name: string;
            shortName: string;
            code: string;
        }[];
    };
    programStages?: {
        id: string;
        name: string;
    }[];
}

const getFieldsByModel = (model: typeof D2Model) => {
    switch (model.getCollectionName()) {
        case "dataElements":
            return {
                categoryCombo: {
                    id: true,
                    name: true,
                    categories: {
                        categoryOptions: { id: true, name: true, shortName: true, code: true },
                    },
                },
                optionSet: { options: { id: true, name: true, shortName: true, code: true } },
                commentOptionSet: {
                    options: { id: true, name: true, shortName: true, code: true },
                },
            };
        case "programs":
            return {
                categoryCombo: {
                    id: true,
                    name: true,
                    categories: {
                        categoryOptions: { id: true, name: true, shortName: true, code: true },
                    },
                },
                programStages: { id: true, name: true },
            };
        default:
            return {};
    }
};

const getCombinedMetadata = async (api: D2Api, model: typeof D2Model, id: string) => {
    const { objects } = ((await model
        .getApiModel(api)
        .get({
            fields: {
                id: true,
                name: true,
                code: true,
                ...getFieldsByModel(model),
            },
            filter: {
                id: {
                    eq: cleanOrgUnitPath(id),
                },
            },
            defaults: "EXCLUDE",
        })
        .getData()) as unknown) as { objects: CombinedMetadata[] };

    return objects;
};

export const autoMap = async (
    instanceApi: D2Api,
    model: typeof D2Model,
    selectedItem: Partial<MetadataType>,
    defaultValue?: string,
    filter?: string[]
): Promise<MetadataMapping[]> => {
    const { objects } = (await model
        .getApiModel(instanceApi)
        .get({
            fields: { id: true, code: true, name: true, path: true },
            filter: {
                name: { token: selectedItem.name },
                shortName: { token: selectedItem.shortName },
                id: { eq: cleanOrgUnitPath(selectedItem.id) },
                code: { eq: selectedItem.code },
            },
            rootJunction: "OR",
        })
        .getData()) as { objects: CombinedMetadata[] };

    const candidateWithSameId = _.find(objects, ["id", selectedItem.id]);
    const candidateWithSameCode = _.find(objects, ["code", selectedItem.code]);
    const candidates = _.flatten([candidateWithSameId ?? candidateWithSameCode ?? objects]).filter(
        ({ id }) => filter?.includes(id) ?? true
    );

    if (candidates.length === 0 && defaultValue) {
        candidates.push({ id: defaultValue, code: defaultValue });
    }

    return candidates.map(({ id, path, name, code }) => ({
        mappedId: path ?? id,
        mappedName: name,
        mappedCode: code,
        code: selectedItem.code,
    }));
};

const autoMapCollection = async (
    instanceApi: D2Api,
    originMetadata: Partial<MetadataType>[],
    model: typeof D2Model,
    destinationMetadata: Partial<MetadataType>[]
) => {
    if (originMetadata.length === 0) return {};
    const filter = _.compact(destinationMetadata.map(({ id }) => id));

    const mapping: {
        [id: string]: MetadataMapping;
    } = {};

    for (const item of originMetadata) {
        const candidate = (await autoMap(instanceApi, model, item, "DISABLED", filter))[0];
        if (item.id && candidate) {
            mapping[item.id] = {
                ...candidate,
                conflicts: candidate.mappedId === "DISABLED",
            };
        }
    }

    return mapping;
};

const getCategoryOptions = (object: CombinedMetadata) => {
    return _.flatten(
        object.categoryCombo?.categories.map(({ categoryOptions }) => categoryOptions)
    );
};

const getOptions = (object: CombinedMetadata) => {
    return _.union(object.optionSet?.options, object.commentOptionSet?.options);
};

const getProgramStages = (object: CombinedMetadata) => {
    return object.programStages ?? [];
};

const autoMapCategoryCombo = (
    originMetadata: CombinedMetadata,
    destinationMetadata: CombinedMetadata
) => {
    if (originMetadata.categoryCombo) {
        const { id } = originMetadata.categoryCombo;
        const { id: mappedId = "DISABLED", name: mappedName } =
            destinationMetadata.categoryCombo ?? {};

        return {
            [id]: {
                mappedId,
                mappedName,
                mapping: {},
                conflicts: false,
            },
        };
    } else {
        return {};
    }
};

const autoMapProgramStages = async (
    instanceApi: D2Api,
    originMetadata: CombinedMetadata,
    destinationMetadata: CombinedMetadata
) => {
    const originProgramStages = getProgramStages(originMetadata);
    const destinationProgramStages = getProgramStages(destinationMetadata);

    if (originProgramStages.length === 1 && destinationProgramStages.length === 1) {
        return {
            [originProgramStages[0].id]: {
                mappedId: destinationProgramStages[0].id,
                mappedName: destinationProgramStages[0].name,
                conflicts: false,
                mapping: {},
            },
        };
    } else {
        return autoMapCollection(
            instanceApi,
            originProgramStages,
            ProgramStageModel,
            destinationProgramStages
        );
    }
};

export const buildMapping = async (
    api: D2Api,
    instanceApi: D2Api,
    model: typeof D2Model,
    originalId: string,
    mappedId = ""
): Promise<MetadataMapping> => {
    const originMetadata = await getCombinedMetadata(api, model, originalId);
    if (mappedId === "DISABLED")
        return {
            mappedId: "DISABLED",
            mappedCode: "DISABLED",
            code: originMetadata[0].code,
            conflicts: false,
            mapping: {},
        };

    const destinationMetadata = await getCombinedMetadata(instanceApi, model, mappedId);
    if (originMetadata.length !== 1 || destinationMetadata.length !== 1) return {};

    const [mappedElement] = await autoMap(
        instanceApi,
        model,
        { id: mappedId, code: originMetadata[0].code },
        mappedId
    );

    const categoryCombos = autoMapCategoryCombo(originMetadata[0], destinationMetadata[0]);

    const categoryOptions = await autoMapCollection(
        instanceApi,
        getCategoryOptions(originMetadata[0]),
        CategoryOptionModel,
        getCategoryOptions(destinationMetadata[0])
    );

    const options = await autoMapCollection(
        instanceApi,
        getOptions(originMetadata[0]),
        OptionModel,
        getOptions(destinationMetadata[0])
    );

    const programStages = await autoMapProgramStages(
        instanceApi,
        originMetadata[0],
        destinationMetadata[0]
    );

    const mapping = _.omitBy(
        {
            categoryCombos,
            categoryOptions,
            options,
            programStages,
        },
        _.isEmpty
    ) as MetadataMappingDictionary;

    return {
        ...mappedElement,
        conflicts: false,
        mapping,
    };
};

export const getValidIds = async (api: D2Api, model: typeof D2Model, id: string) => {
    const combinedMetadata = await getCombinedMetadata(api, model, id);

    const categoryOptions = getCategoryOptions(combinedMetadata[0]);
    const options = getOptions(combinedMetadata[0]);
    const programStages = getProgramStages(combinedMetadata[0]);

    return _.union(categoryOptions, options, programStages).map(({ id }) => id);
};

export const getMetadataTypeFromRow = (object: MetadataType) => {
    const { __mappingType__, __type__ } = object;
    return __mappingType__ ?? __type__;
};

export const cleanNestedMappedId = (id: string): string => {
    return (
        _(id)
            .split("-")
            .last() ?? ""
    );
};
