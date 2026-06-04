import { CellPosition } from "../CellPosition";
import { SpecialTileActivationContext, SpecialTileLogic } from "./SpecialTileLogic";

export class HorizontalRocketSpecialTileLogic implements SpecialTileLogic {
    public GetAffectedCells(context: SpecialTileActivationContext): CellPosition[] {
        const result: CellPosition[] = [];

        for (let x = 0; x < context.board.width; x++) {
            if (context.board.GetTile(x, context.y) === null) {
                continue;
            }

            result.push({ x: x, y: context.y });
        }

        return result;
    }
}
