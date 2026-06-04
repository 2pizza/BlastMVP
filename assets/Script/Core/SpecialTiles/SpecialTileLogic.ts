import { BoardModel } from "../BoardModel";
import { CellPosition } from "../CellPosition";

export interface SpecialTileActivationContext {
    board: BoardModel;
    x: number;
    y: number;
}

export interface SpecialTileLogic {
    GetAffectedCells(context: SpecialTileActivationContext): CellPosition[];
}
