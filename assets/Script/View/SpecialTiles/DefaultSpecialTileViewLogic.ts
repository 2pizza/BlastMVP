import { TurnResult } from "../../Core/BoardLogic";
import { SpecialTileAnimationHost, SpecialTileViewLogic } from "./SpecialTileViewLogic";

export class DefaultSpecialTileViewLogic implements SpecialTileViewLogic {
    public PlayRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, onComplete: () => void): void {
        host.PlayDefaultRemoveAnimation(turn.removedTiles, onComplete);
    }
}
