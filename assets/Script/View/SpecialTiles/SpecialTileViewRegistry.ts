import { SpecialTileType } from "../../Core/TileModel";
import { BombSpecialTileViewLogic } from "./BombSpecialTileViewLogic";
import { DefaultSpecialTileViewLogic } from "./DefaultSpecialTileViewLogic";
import { SpecialTileViewLogic } from "./SpecialTileViewLogic";

export class SpecialTileViewRegistry {
    private static readonly defaultLogic: SpecialTileViewLogic = new DefaultSpecialTileViewLogic();

    private static readonly logicsByType: { [key: number]: SpecialTileViewLogic } = {};

    public static RegisterLogic(specialType: SpecialTileType, logic: SpecialTileViewLogic): void {
        if (specialType === SpecialTileType.None) {
            cc.warn("SpecialTileViewRegistry: cannot register logic for SpecialTileType.None.");
            return;
        }

        if (logic === null || logic === undefined) {
            cc.warn("SpecialTileViewRegistry: cannot register null logic.");
            return;
        }

        this.logicsByType[specialType] = logic;
    }

    public static GetLogic(specialType: SpecialTileType): SpecialTileViewLogic | null {
        if (specialType === SpecialTileType.None) {
            return null;
        }

        const logic = this.logicsByType[specialType];

        if (logic !== null && logic !== undefined) {
            return logic;
        }

        return this.defaultLogic;
    }
}