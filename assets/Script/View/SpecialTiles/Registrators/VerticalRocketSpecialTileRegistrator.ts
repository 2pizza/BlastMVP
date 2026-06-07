import { SpecialTileViewRegistry } from "../SpecialTileViewRegistry";
import { VerticalRocketSpecialTileViewLogic } from "../Rocket/VerticalRocketSpecialTileViewLogic";
import { SpecialTileType } from "../../../Core/TileModel";
import { RocketSpecialTileRegistratorBase } from "./RocketSpecialTileRegistratorBase";

const { ccclass } = cc._decorator;

@ccclass
export class VerticalRocketSpecialTileRegistrator extends RocketSpecialTileRegistratorBase {
    protected onLoad(): void {
        if (this.rocketSpriteFrame === null) {
            cc.error("VerticalRocketSpecialTileView: rocketSpriteFrame is not assigned");
            return;
        }

        SpecialTileViewRegistry.RegisterLogic(SpecialTileType.VerticalRocket, 
                                                        new VerticalRocketSpecialTileViewLogic(this.rocketSpriteFrame, this.rocketSpeedPixelsPerSecond, this.rocketDistanceMultiplier,
                                                            this.tileKickDuration, this.tileKickDistance, this.tileForwardKickDistance, this.tileContactAdvanceTime));
    }
}