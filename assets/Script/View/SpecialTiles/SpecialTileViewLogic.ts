import { RemovedTile, TurnResult } from "../../Core/BoardLogic";
import { ScoreController } from "../Animators/ScoreController";

export interface SpecialTileAnimationHost {
    GetScoreController(): ScoreController;
    RemoveTileViewById(tileId: number): void
    GetCellPositionForAnimation(x: number, y: number): cc.Vec3
    GetAnimationLayer(): cc.Node
}

export interface SpecialTileViewLogic {
    PlayRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, onComplete: () => void): void;
}
