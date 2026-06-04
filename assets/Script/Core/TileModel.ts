export enum SpecialTileType {
    None = 0,
    Bomb = 1,
    HorizontalRocket = 2,
    VerticalRocket = 3,
    Dynamite = 4,
}

export const SpecialTileTypeCcEnum = cc.Enum(SpecialTileType);

export class TileModel {
    public readonly id: number;

    private readonly colorId: number;
    private readonly specialType: SpecialTileType;

    private constructor(id: number, colorId: number, specialType: SpecialTileType) {
        this.id = id;
        this.colorId = colorId;
        this.specialType = specialType;
    }

    public static CreateNormal(id: number, colorId: number): TileModel {
        return new TileModel(id, colorId, SpecialTileType.None);
    }

    public static CreateSpecial(id: number, specialType: SpecialTileType): TileModel {
        return new TileModel(id, -1, specialType);
    }

    public GetColorId(): number {
        return this.colorId;
    }

    public GetSpecialType(): SpecialTileType {
        return this.specialType;
    }

    public HasSpecialLogic(): boolean {
        return this.specialType !== SpecialTileType.None;
    }

    public CanBeGroupedByColor(): boolean {
        return !this.HasSpecialLogic();
    }

    public IsSameColor(colorId: number): boolean {
        if (!this.CanBeGroupedByColor()) {
            return false;
        }

        return this.colorId === colorId;
    }
}
