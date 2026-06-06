import { RocketDirection, RocketSpecialTileViewLogicBase } from "./RocketSpecialTileViewLogicBase";

export class HorizontalRocketSpecialTileViewLogic extends RocketSpecialTileViewLogicBase {
    protected GetRocketDirections(): RocketDirection[] {
        return [
            { directionX: 1, directionY: 0, angle: 0 },
            { directionX: -1, directionY: 0, angle: 180 },
        ];
    }
}
