import { SpecialTileType } from "../../../Core/TileModel";
import { DynamiteSpecialTileViewLogic } from "../DynamiteSpecialTileViewLogic";
import { SpecialTileViewRegistry } from "../SpecialTileViewRegistry";

const { ccclass, property } = cc._decorator;

@ccclass
export class DynamiteSpecialTileView extends cc.Component {
    @property(cc.SpriteFrame)
    private bombSpriteFrame: cc.SpriteFrame = null;

    @property
    private blastStep: number = 2;

    @property
    private blastWaveDelay: number = 0.08;

    @property
    private bombAppearDuration: number = 0.08;

    @property
    private bombExplodeDuration: number = 0.12;

    @property
    private tileHitDelay: number = 0.04;

    @property
    private tileKickDuration: number = 0.14;

    @property
    private tileKickDistance: number = 140;

    protected onLoad(): void {
        if (this.bombSpriteFrame === null) {
            cc.error("DynamiteSpecialTileView: bombSpriteFrame is not assigned");
            return;
        }

        SpecialTileViewRegistry.RegisterLogic(SpecialTileType.Dynamite, new DynamiteSpecialTileViewLogic(this.bombSpriteFrame, this.blastStep, this.blastWaveDelay, this.bombAppearDuration,
                                                                            this.bombExplodeDuration, this.tileHitDelay, this.tileKickDuration, this.tileKickDistance));
    }
}