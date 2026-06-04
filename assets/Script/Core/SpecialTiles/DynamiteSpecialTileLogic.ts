import { CellPosition } from "../CellPosition";
import { SpecialTileActivationContext, SpecialTileLogic } from "./SpecialTileLogic";

export class DynamiteSpecialTileLogic implements SpecialTileLogic {
    public GetAffectedCells(context: SpecialTileActivationContext): CellPosition[] {
        const result: CellPosition[] = [];

        for (let y = 0; y < context.board.height; y++) {
            for (let x = 0; x < context.board.width; x++) {
                if (context.board.GetTile(x, y) === null) {
                    continue;
                }

                result.push({ x: x, y: y });
            }
        }

        return result;
    }
}
