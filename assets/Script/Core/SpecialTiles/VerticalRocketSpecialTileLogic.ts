import { CellPosition } from "../CellPosition";
import { SpecialTileActivationContext, SpecialTileLogic } from "./SpecialTileLogic";

export class VerticalRocketSpecialTileLogic implements SpecialTileLogic {
    public GetAffectedCells(context: SpecialTileActivationContext): CellPosition[] {
        const result: CellPosition[] = [];

        for (let y = 0; y < context.board.height; y++) {
            if (context.board.GetTile(context.x, y) === null) {
                continue;
            }

            result.push({ x: context.x, y: y });
        }

        return result;
    }
}
