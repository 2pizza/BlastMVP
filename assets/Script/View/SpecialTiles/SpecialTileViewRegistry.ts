import { SpecialTileType } from "../../Core/TileModel";
import { BombSpecialTileViewLogic } from "./BombSpecialTileViewLogic";
import { DefaultSpecialTileViewLogic } from "./DefaultSpecialTileViewLogic";
import { SpecialTileViewLogic } from "./SpecialTileViewLogic";

export class SpecialTileViewRegistry {
    private static bombLogic: SpecialTileViewLogic = new BombSpecialTileViewLogic();
    private static defaultLogic: SpecialTileViewLogic = new DefaultSpecialTileViewLogic();

    public static GetLogic(specialType: SpecialTileType): SpecialTileViewLogic | null {
        if (specialType === SpecialTileType.None) {
            return null;
        }

        if (specialType === SpecialTileType.Bomb) {
            return this.bombLogic;
        }

        return this.defaultLogic;
    }
}
