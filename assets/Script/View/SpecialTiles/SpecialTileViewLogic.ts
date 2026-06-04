import { RemovedTile, TurnResult } from "../../Core/BoardLogic";
import { TileView } from "../TileView";

export interface SpecialTileAnimationHost {
    GetTileViewById(tileId: number): TileView | null;
    RemoveTileViewById(tileId: number): void;
    GetCellPositionForAnimation(x: number, y: number): cc.Vec3;
    GetTileAnimationLayer(): cc.Node | null;
    MoveNodeToLayerKeepingWorldPosition(node: cc.Node, layer: cc.Node): void;
    PlayDefaultRemoveAnimation(removedTiles: RemovedTile[], onComplete: () => void): void;
}

export interface SpecialTileViewLogic {
    PlayRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, onComplete: () => void): void;
}
