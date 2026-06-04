import { GameConfig } from "./GameModel";

export interface LevelRuntimeConfig extends GameConfig {
    shuffleAttemptLimit: number;
    bombBoosterCount: number;
    swapBoosterCount: number;
}

export class LevelRuntimeConfigStore {
    private static config: LevelRuntimeConfig = null;

    public static SetConfig(value: LevelRuntimeConfig): void {
        this.config = value;
    }

    public static GetConfig(defaultConfig: LevelRuntimeConfig): LevelRuntimeConfig {
        if (this.config === null) {
            return defaultConfig;
        }

        return this.config;
    }
}