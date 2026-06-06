import { TurnResult } from "../../Core/BoardLogic";
import { SpecialTileType } from "../../Core/TileModel";
import { SpecialTileAnimationHost, SpecialTileViewLogic } from "./SpecialTileViewLogic";

export class DefaultSpecialTileViewLogic implements SpecialTileViewLogic {
    public PlayRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, onComplete: () => void): void {
        const scoreController = host.GetScoreController();

        for (let i = 0; i < turn.removedTiles.length; i++) {
            const removed = turn.removedTiles[i];

            if (removed.specialType !== SpecialTileType.None) {
                scoreController.AddInstant(removed.score);
                host.RemoveTileViewById(removed.tileId);
                continue;
            }

            scoreController.PlayScoreFlyAnimation(removed);
        }

        onComplete();
    }
}
