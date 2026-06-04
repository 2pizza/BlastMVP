import { SpecialTileRegistry } from "./SpecialTiles/SpecialTileRegistry";
import { TileModel, SpecialTileType } from "./TileModel";

export class TileGenerator {
    private nextTileId: number = 1;
    private colorCount: number;

    constructor(colorCount: number) {
        this.colorCount = colorCount;
    }

    public CreateTile(): TileModel {
        const colorId = this.GetRandomColorId();
        const tile = TileModel.CreateNormal(this.nextTileId, colorId);

        this.nextTileId++;

        return tile;
    }

    public CreateSpecialTile(specialType: SpecialTileType): TileModel | null {
        if (specialType === SpecialTileType.None) {
            return null;
        }

        const tile = TileModel.CreateSpecial(this.nextTileId, specialType);

        this.nextTileId++;

        return tile;
    }

    public CreateRandomSpecialTileForGroup(groupSize: number): TileModel | null {
        const specialType = SpecialTileRegistry.GetRandomCreatableType(groupSize);

        if (specialType === SpecialTileType.None) {
            return null;
        }

        return this.CreateSpecialTile(specialType);
    }

    private GetRandomColorId(): number {
        return Math.floor(Math.random() * this.colorCount);
    }
}
