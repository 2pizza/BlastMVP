import { BoardModel } from "./BoardModel";
import { CellPosition } from "./CellPosition";
import { TileGenerator } from "./TileGenerator";
import { SpecialTileRegistry } from "./SpecialTiles/SpecialTileRegistry";
import { SpecialTileType, TileModel } from "./TileModel";

export interface RemovedTile {
    x: number;
    y: number;
    tileId: number;
    specialType: SpecialTileType;
    score: number;
}

export interface CreatedTile {
    x: number;
    y: number;
    tileId: number;
}

export interface MovedTile {
    tileId: number;
    path: CellPosition[];
}

export interface TurnResult {
    sourceX: number;
    sourceY: number;
    sourceSpecialType: SpecialTileType;
    removedTiles: RemovedTile[];
}

export class BoardLogic {
    public static FindGroup(board: BoardModel, startX: number, startY: number): CellPosition[] {
        const startTile = board.GetTile(startX, startY);

        if (startTile === null) {
            return [];
        }

        if (!startTile.CanBeGroupedByColor()) {
            return [];
        }

        const targetColorId = startTile.GetColorId();
        const visited = new Array<boolean>(board.width * board.height);
        const result: CellPosition[] = [];
        const queue: CellPosition[] = [];
        let queueIndex = 0;

        queue.push({ x: startX, y: startY });
        visited[board.ToIndex(startX, startY)] = true;

        while (queueIndex < queue.length) {
            const current = queue[queueIndex];
            queueIndex++;

            result.push(current);

            this.TryAddNeighbor(board, current.x + 1, current.y, targetColorId, visited, queue);
            this.TryAddNeighbor(board, current.x - 1, current.y, targetColorId, visited, queue);
            this.TryAddNeighbor(board, current.x, current.y + 1, targetColorId, visited, queue);
            this.TryAddNeighbor(board, current.x, current.y - 1, targetColorId, visited, queue);
        }

        return result;
    }

    public static GetSpecialAffectedCellsByType(
        board: BoardModel,
        x: number,
        y: number,
        specialType: SpecialTileType
    ): CellPosition[] {
        const descriptor = SpecialTileRegistry.GetDescriptor(specialType);

        if (descriptor === null) {
            return [];
        }

        return descriptor.logic.GetAffectedCells({
            board: board,
            x: x,
            y: y,
        });
    }

    public static RemoveGroup(board: BoardModel, group: CellPosition[]): RemovedTile[] {
        const removedTiles: RemovedTile[] = [];

        for (let i = 0; i < group.length; i++) {
            const cell = group[i];
            const tile = board.GetTile(cell.x, cell.y);

            if (tile === null) {
                continue;
            }

            removedTiles.push({ x: cell.x, y: cell.y, tileId: tile.id, specialType: tile.GetSpecialType(), score: 0 });

            board.SetTile(cell.x, cell.y, null);
        }

        return removedTiles;
    }

    public static ApplyGravity(board: BoardModel): MovedTile[] {
        const movedTiles: MovedTile[] = [];

        for (let x = 0; x < board.width; x++) {
            let writeY = 0;

            for (let readY = 0; readY < board.height; readY++) {
                const tile = board.GetTile(x, readY);

                if (tile === null) {
                    continue;
                }

                if (readY !== writeY) {
                    board.SetTile(x, writeY, tile);
                    board.SetTile(x, readY, null);

                    movedTiles.push({
                        tileId: tile.id,
                        path: [
                            { x: x, y: readY },
                            { x: x, y: writeY },
                        ],
                    });
                }

                writeY++;
            }
        }

        return movedTiles;
    }

    public static FillEmptyCells(board: BoardModel, generator: TileGenerator): { createdTiles: CreatedTile[]; movedTiles: MovedTile[] } {
        const createdTiles: CreatedTile[] = [];
        const movedTiles: MovedTile[] = [];

        for (let x = 0; x < board.width; x++) {
            let spawnOffset = 0;

            for (let y = 0; y < board.height; y++) {
                const tile = board.GetTile(x, y);

                if (tile !== null) {
                    continue;
                }

                const newTile = generator.CreateTile();
                const spawnY = board.height + spawnOffset;

                board.SetTile(x, y, newTile);

                createdTiles.push({
                    x: x,
                    y: spawnY,
                    tileId: newTile.id,
                });

                movedTiles.push({
                    tileId: newTile.id,
                    path: [
                        { x: x, y: spawnY },
                        { x: x, y: y },
                    ],
                });

                spawnOffset++;
            }
        }

        return {
            createdTiles: createdTiles,
            movedTiles: movedTiles,
        };
    }


    public static ShuffleTiles(board: BoardModel): MovedTile[] {
        const entries: { x: number; y: number; tile: TileModel }[] = [];

        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                const tile = board.GetTile(x, y);

                if (tile === null) {
                    continue;
                }

                entries.push({
                    x: x,
                    y: y,
                    tile: tile,
                });
            }
        }

        if (entries.length <= 1) {
            return [];
        }

        const order: number[] = [];

        for (let i = 0; i < entries.length; i++) {
            order.push(i);
        }

        this.ShuffleArray(order);

        const movedTiles: MovedTile[] = [];

        for (let i = 0; i < order.length; i++) {
            const sourceIndex = order[i];
            const targetIndex = order[(i + 1) % order.length];

            const sourceEntry = entries[sourceIndex];
            const targetEntry = entries[targetIndex];

            board.SetTile(targetEntry.x, targetEntry.y, sourceEntry.tile);

            movedTiles.push({
                tileId: sourceEntry.tile.id,
                path: [
                    { x: sourceEntry.x, y: sourceEntry.y },
                    { x: targetEntry.x, y: targetEntry.y },
                ],
            });
        }

        return movedTiles;
    }

    public static HasAvailableMoves(board: BoardModel, minGroupSize: number): boolean {
        const visited = new Array<boolean>(board.width * board.height);

        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                const index = board.ToIndex(x, y);

                if (visited[index]) {
                    continue;
                }

                const tile = board.GetTile(x, y);

                if (tile === null) {
                    visited[index] = true;
                    continue;
                }

                if (tile.HasSpecialLogic()) {
                    return true;
                }

                const group = this.FindGroupWithVisited(board, x, y, visited);

                if (group.length >= minGroupSize) {
                    return true;
                }
            }
        }

        return false;
    }


    private static ShuffleArray<T>(items: T[]): void {
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = items[i];
            items[i] = items[j];
            items[j] = temp;
        }
    }

    private static TryAddNeighbor(board: BoardModel, x: number, y: number, targetColorId: number, visited: boolean[], queue: CellPosition[]): void {
        if (!board.IsInside(x, y)) {
            return;
        }

        const index = board.ToIndex(x, y);

        if (visited[index]) {
            return;
        }

        const tile = board.GetTile(x, y);

        if (tile === null) {
            return;
        }

        if (!tile.IsSameColor(targetColorId)) {
            return;
        }

        visited[index] = true;
        queue.push({ x: x, y: y });
    }

    private static FindGroupWithVisited(board: BoardModel, startX: number, startY: number, visited: boolean[]): CellPosition[] {
        const startTile = board.GetTile(startX, startY);

        if (startTile === null) {
            return [];
        }

        if (!startTile.CanBeGroupedByColor()) {
            visited[board.ToIndex(startX, startY)] = true;
            return [];
        }

        const targetColorId = startTile.GetColorId();
        const result: CellPosition[] = [];
        const queue: CellPosition[] = [];
        let queueIndex = 0;

        queue.push({ x: startX, y: startY });
        visited[board.ToIndex(startX, startY)] = true;

        while (queueIndex < queue.length) {
            const current = queue[queueIndex];
            queueIndex++;

            result.push(current);

            this.TryAddNeighbor(board, current.x + 1, current.y, targetColorId, visited, queue);
            this.TryAddNeighbor(board, current.x - 1, current.y, targetColorId, visited, queue);
            this.TryAddNeighbor(board, current.x, current.y + 1, targetColorId, visited, queue);
            this.TryAddNeighbor(board, current.x, current.y - 1, targetColorId, visited, queue);
        }

        return result;
    }

}
