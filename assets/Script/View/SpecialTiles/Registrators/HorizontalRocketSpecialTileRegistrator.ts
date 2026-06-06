import { SpecialTileViewRegistry } from "../SpecialTileViewRegistry";
import { HorizontalRocketSpecialTileViewLogic } from "../Rocket/HorizontalRocketSpecialTileViewLogic";
import { SpecialTileType } from "../../../Core/TileModel";
import { RocketSpecialTileRegistratorBase } from "./RocketSpecialTileRegistratorBase";

const { ccclass, property } = cc._decorator;

@ccclass
export class HorizontalRocketSpecialTileRegistrator extends RocketSpecialTileRegistratorBase {
    protected onLoad(): void {
        if (this.rocketSpriteFrame === null) {
            cc.error("HorizontalRocketSpecialTileView: rocketSpriteFrame is not assigned");
            return;
        }

        SpecialTileViewRegistry.RegisterLogic(SpecialTileType.HorizontalRocket, 
                                                new HorizontalRocketSpecialTileViewLogic(this.rocketSpriteFrame, this.rocketSpeedSecondsPerPixel, this.rocketDistanceMultiplier,
                                                    this.tileKickDuration, this.tileKickDistance, this.tileForwardKickDistance, this.tileContactAdvanceTime));
    }
}