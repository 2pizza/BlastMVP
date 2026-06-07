import { SpecialTileViewRegistry } from "../SpecialTileViewRegistry";
import { HorizontalRocketSpecialTileViewLogic } from "../Rocket/HorizontalRocketSpecialTileViewLogic";
import { SpecialTileType } from "../../../Core/TileModel";

const { ccclass, property } = cc._decorator;

@ccclass
export class RocketSpecialTileRegistratorBase extends cc.Component {
    @property(cc.SpriteFrame)
    protected rocketSpriteFrame: cc.SpriteFrame = null;

    @property
    protected rocketSpeedPixelsPerSecond: number = 2500;

    @property
    protected rocketDistanceMultiplier: number = 1.4;

    @property
    protected tileKickDuration: number = 0.12;

    @property
    protected tileKickDistance: number = 90;

    @property
    protected tileForwardKickDistance: number = 40;

    @property
    protected tileContactAdvanceTime: number = 0.04;
}