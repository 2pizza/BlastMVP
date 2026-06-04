import { SpecialTileType, SpecialTileTypeCcEnum } from "../../Core/TileModel";

const { ccclass, property } = cc._decorator;

@ccclass("SpecialTileSpriteBinding")
export class SpecialTileSpriteBinding {
    @property({
        type: SpecialTileTypeCcEnum,
    })
    public specialType: SpecialTileType = SpecialTileType.Bomb;

    @property(cc.SpriteFrame)
    public spriteFrame: cc.SpriteFrame = null;
}