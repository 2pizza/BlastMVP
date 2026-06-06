import { SpecialTileType } from "../../../Core/TileModel";
import { SpecialTileViewRegistry } from "../SpecialTileViewRegistry";
import { BombSpecialTileViewLogic } from "../BombSpecialTileViewLogic";

const { ccclass, property } = cc._decorator;

@ccclass
export class BombSpecialTileRegistrator extends cc.Component {
    @property
    private explosionKickDuration: number = 0.14;

    @property
    private explosionKickDistance: number = 120;

    protected onLoad(): void {
        SpecialTileViewRegistry.RegisterLogic(SpecialTileType.Bomb, new BombSpecialTileViewLogic(this.explosionKickDuration, this.explosionKickDistance));
    }
}