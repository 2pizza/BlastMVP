import { RocketDirection, RocketSpecialTileViewLogicBase } from "./RocketSpecialTileViewLogicBase";

export class VerticalRocketSpecialTileViewLogic extends RocketSpecialTileViewLogicBase {
    protected GetRocketDirections(): RocketDirection[] {
        return [
            { directionX: 0, directionY: 1, angle: 90 },
            { directionX: 0, directionY: -1, angle: -90 },
        ];
    }
}
