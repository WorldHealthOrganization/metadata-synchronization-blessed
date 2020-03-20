import { D2Api } from "d2-api";
import { saveDataStore } from "../../models/dataStore";

interface Config {
    version: number;
}

export default async function migrate(api: D2Api): Promise<void> {
    const config: Config = { version: 1 };
    await saveDataStore(api, "config", config);
}
