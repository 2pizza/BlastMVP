import { CellPosition } from "../CellPosition";
import { SpecialTileActivationContext, SpecialTileLogic } from "./SpecialTileLogic";

export class BombSpecialTileLogic implements SpecialTileLogic {
    private radius: number;

    constructor(radius: number) {
        this.radius = radius;
    }

    public GetAffectedCells(context: SpecialTileActivationContext): CellPosition[] {
        const result: CellPosition[] = [];

        for (let y = context.y - this.radius; y <= context.y + this.radius; y++) {
            for (let x = context.x - this.radius; x <= context.x + this.radius; x++) {
                if (!context.board.IsInside(x, y)) {
                    continue;
                }

                if (context.board.GetTile(x, y) === null) {
                    continue;
                }

                result.push({ x: x, y: y });
            }
        }

        return result;
    }
}
