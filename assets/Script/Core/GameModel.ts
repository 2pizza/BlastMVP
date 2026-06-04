import { BoardModel } from "./BoardModel";
import { TileGenerator } from "./TileGenerator";
import { SpecialTileType } from "./TileModel";
import {
    BoardLogic,
    CreatedTile,
    MovedTile,
    TurnResult,
} from "./BoardLogic";
import { CellPosition } from "./CellPosition";

export interface GameConfig {
    width: number;
    height: number;
    colorCount: number;
    targetScore: number;
    moveLimit: number;
    minGroupSize: number;
}

export enum GameState {
    Playing = "Playing",
    Victory = "Victory",
    DefeatNoMovesLeft = "DefeatNoMovesLeft",
    DefeatNoAvailableGroups = "DefeatNoAvailableGroups",
}

export enum MoveFailReason {
    GameIsOver = "GameIsOver",
    CellIsEmpty = "CellIsEmpty",
    GroupTooSmall = "GroupTooSmall",
}

interface PendingSpecialActivation {
    x: number;
    y: number;
    tileId: number;
    specialType: SpecialTileType;
}

export interface MoveResult {
    success: boolean;

    failReason?: MoveFailReason;

    tappedX: number;
    tappedY: number;

    turns: TurnResult[];
    createdTiles: CreatedTile[];
    movedTiles: MovedTile[];

    scoreAdded: number;
    totalScore: number;
    movesLeft: number;

    state: GameState;
}

export class GameModel {
    public readonly board: BoardModel;
    public readonly config: GameConfig;

    private generator: TileGenerator;

    private score: number = 0;
    private movesLeft: number = 0;
    private state: GameState = GameState.Playing;

    constructor(config: GameConfig) {
        this.config = config;

        this.board = new BoardModel(config.width, config.height);
        this.generator = new TileGenerator(config.colorCount);

        this.Restart();
    }

    public Restart(): void {
        this.score = 0;
        this.movesLeft = this.config.moveLimit;
        this.state = GameState.Playing;

        this.board.Clear();
        this.board.Fill(this.generator);

        this.state = this.CalculateGameState();
    }

    public TryMakeMove(x: number, y: number): MoveResult {
        if (this.state !== GameState.Playing) {
            return this.CreateFailedMoveResult(x, y, MoveFailReason.GameIsOver);
        }

        const clickedTile = this.board.GetTile(x, y);

        if (clickedTile === null) {
            return this.CreateFailedMoveResult(x, y, MoveFailReason.CellIsEmpty);
        }

        const turns: TurnResult[] = [];
        let initialNormalGroupSize = 0;
        let scoreAdded = 0;

        if (clickedTile.HasSpecialLogic()) {
            this.ResolveSpecialChain(
                [{ x: x, y: y, tileId: clickedTile.id, specialType: clickedTile.GetSpecialType() }],
                turns
            );

            scoreAdded = this.CalculateScoreFromTurns(turns);
        } else {
            const group = BoardLogic.FindGroup(this.board, x, y);

            if (group.length < this.config.minGroupSize) {
                return this.CreateFailedMoveResult(x, y, MoveFailReason.GroupTooSmall);
            }

            initialNormalGroupSize = group.length;

            const turn = this.CreateRemoveTurn(
                x,
                y,
                SpecialTileType.None,
                group
            );

            turns.push(turn);
            scoreAdded = group.length;
        }

        if (turns.length <= 0) {
            return this.CreateFailedMoveResult(x, y, MoveFailReason.GroupTooSmall);
        }

        const createdTiles: CreatedTile[] = [];
        const movedTiles: MovedTile[] = [];

        if (initialNormalGroupSize > 0) {
            const specialTile = this.generator.CreateRandomSpecialTileForGroup(initialNormalGroupSize);

            if (specialTile !== null) {
                this.board.SetTile(x, y, specialTile);

                createdTiles.push({
                    x: x,
                    y: y,
                    tileId: specialTile.id,
                });
            }
        }

        this.AppendMovedTiles(movedTiles, BoardLogic.ApplyGravity(this.board));

        const fillResult = BoardLogic.FillEmptyCells(this.board, this.generator);
        this.AppendCreatedTiles(createdTiles, fillResult.createdTiles);
        this.AppendMovedTiles(movedTiles, fillResult.movedTiles);

        this.score += scoreAdded;
        this.movesLeft--;

        this.state = this.CalculateGameState();

        return {
            success: true,

            tappedX: x,
            tappedY: y,

            turns: turns,
            createdTiles: createdTiles,
            movedTiles: movedTiles,

            scoreAdded: scoreAdded,
            totalScore: this.score,
            movesLeft: this.movesLeft,

            state: this.state,
        };
    }

    public TryShuffle(): MoveResult {
        if (this.state !== GameState.Playing) {
            return this.CreateFailedMoveResult(-1, -1, MoveFailReason.GameIsOver);
        }

        const movedTiles = BoardLogic.ShuffleTiles(this.board);

        return {
            success: true,

            tappedX: -1,
            tappedY: -1,

            turns: [],
            createdTiles: [],
            movedTiles: movedTiles,

            scoreAdded: 0,
            totalScore: this.score,
            movesLeft: this.movesLeft,

            state: this.state,
        };
    }

    public TryUseBombBooster(x: number, y: number): MoveResult {
        if (this.IsGameOver()) {
            return this.CreateFailedMoveResult(x, y, MoveFailReason.GameIsOver);
        }

        if (!this.board.IsInside(x, y)) {
            return this.CreateFailedMoveResult(x, y, MoveFailReason.CellIsEmpty);
        }

        const tile = this.board.GetTile(x, y);

        if (tile === null) {
            return this.CreateFailedMoveResult(x, y, MoveFailReason.CellIsEmpty);
        }

        const turns: TurnResult[] = [];

        this.ResolveSpecialChain(
            [
                {
                    x: x,
                    y: y,
                    tileId: -1,
                    specialType: SpecialTileType.Bomb,
                },
            ],
            turns
        );

        if (turns.length <= 0) {
            return this.CreateFailedMoveResult(x, y, MoveFailReason.CellIsEmpty);
        }

        const createdTiles: CreatedTile[] = [];
        const movedTiles: MovedTile[] = [];

        this.AppendMovedTiles(movedTiles, BoardLogic.ApplyGravity(this.board));

        const fillResult = BoardLogic.FillEmptyCells(this.board, this.generator);

        this.AppendCreatedTiles(createdTiles, fillResult.createdTiles);
        this.AppendMovedTiles(movedTiles, fillResult.movedTiles);

        const scoreAdded = this.CalculateScoreFromTurns(turns);

        this.score += scoreAdded;

        this.state = this.CalculateGameState();

        return {
            success: true,

            tappedX: x,
            tappedY: y,

            turns: turns,
            createdTiles: createdTiles,
            movedTiles: movedTiles,

            scoreAdded: scoreAdded,
            totalScore: this.score,
            movesLeft: this.movesLeft,

            state: this.state,
        };
    }

    public TryUseSwapBooster(
        firstX: number,
        firstY: number,
        secondX: number,
        secondY: number
    ): MoveResult {
        if (this.IsGameOver()) {
            return this.CreateFailedMoveResult(secondX, secondY, MoveFailReason.GameIsOver);
        }

        if (!this.board.IsInside(firstX, firstY) || !this.board.IsInside(secondX, secondY)) {
            return this.CreateFailedMoveResult(secondX, secondY, MoveFailReason.CellIsEmpty);
        }

        if (firstX === secondX && firstY === secondY) {
            return this.CreateFailedMoveResult(secondX, secondY, MoveFailReason.GroupTooSmall);
        }

        const firstTile = this.board.GetTile(firstX, firstY);
        const secondTile = this.board.GetTile(secondX, secondY);

        if (firstTile === null || secondTile === null) {
            return this.CreateFailedMoveResult(secondX, secondY, MoveFailReason.CellIsEmpty);
        }

        this.board.SetTile(firstX, firstY, secondTile);
        this.board.SetTile(secondX, secondY, firstTile);

        return {
            success: true,

            tappedX: secondX,
            tappedY: secondY,

            turns: [],
            createdTiles: [],
            movedTiles: [
                {
                    tileId: firstTile.id,
                    path: [
                        { x: firstX, y: firstY },
                        { x: secondX, y: secondY },
                    ],
                },
                {
                    tileId: secondTile.id,
                    path: [
                        { x: secondX, y: secondY },
                        { x: firstX, y: firstY },
                    ],
                },
            ],

            scoreAdded: 0,
            totalScore: this.score,
            movesLeft: this.movesLeft,

            state: this.state,
        };
    }

    public HasAvailableMoves(): boolean {
        return BoardLogic.HasAvailableMoves(this.board, this.config.minGroupSize);
    }

    public MarkDefeatNoAvailableGroups(): void {
        if (this.state !== GameState.Playing) {
            return;
        }

        this.state = GameState.DefeatNoAvailableGroups;
    }

    public GetScore(): number {
        return this.score;
    }

    public GetMovesLeft(): number {
        return this.movesLeft;
    }

    public GetState(): GameState {
        return this.state;
    }

    public IsGameOver(): boolean {
        return this.state !== GameState.Playing;
    }

    private ResolveSpecialChain(activationQueue: PendingSpecialActivation[], turns: TurnResult[]): void {
        const activatedTileIds: { [tileId: number]: boolean } = {};
        let queueIndex = 0;

        while (queueIndex < activationQueue.length) {
            const activation = activationQueue[queueIndex];
            queueIndex++;

            if (activation.tileId >= 0) {
                if (activatedTileIds[activation.tileId]) {
                    continue;
                }

                activatedTileIds[activation.tileId] = true;
            }

            const affectedCells = BoardLogic.GetSpecialAffectedCellsByType(
                this.board,
                activation.x,
                activation.y,
                activation.specialType
            );

            const cellsToRemove: CellPosition[] = [];

            for (let i = 0; i < affectedCells.length; i++) {
                const cell = affectedCells[i];
                const tile = this.board.GetTile(cell.x, cell.y);

                if (tile === null) {
                    continue;
                }

                if (tile.HasSpecialLogic() && tile.id !== activation.tileId) {
                    if (!activatedTileIds[tile.id]) {
                        activationQueue.push({
                            x: cell.x,
                            y: cell.y,
                            tileId: tile.id,
                            specialType: tile.GetSpecialType(),
                        });
                    }

                    continue;
                }

                cellsToRemove.push(cell);
            }

            if (cellsToRemove.length <= 0) {
                continue;
            }

            const turn = this.CreateRemoveTurn(
                activation.x,
                activation.y,
                activation.specialType,
                cellsToRemove
            );

            turns.push(turn);
        }
    }

    private CreateRemoveTurn(
        sourceX: number,
        sourceY: number,
        sourceSpecialType: SpecialTileType,
        cellsToRemove: CellPosition[]
    ): TurnResult {
        return {
            sourceX: sourceX,
            sourceY: sourceY,
            sourceSpecialType: sourceSpecialType,
            removedTiles: BoardLogic.RemoveGroup(this.board, cellsToRemove),
        };
    }

    private CalculateScoreFromTurns(turns: TurnResult[]): number {
        let score = 0;

        for (let i = 0; i < turns.length; i++) {
            score += turns[i].removedTiles.length;
        }

        return score;
    }

    private CalculateGameState(): GameState {
        if (this.score >= this.config.targetScore) {
            return GameState.Victory;
        }

        if (this.movesLeft <= 0) {
            return GameState.DefeatNoMovesLeft;
        }

        return GameState.Playing;
    }

    private CreateFailedMoveResult(
        x: number,
        y: number,
        reason: MoveFailReason
    ): MoveResult {
        return {
            success: false,

            failReason: reason,

            tappedX: x,
            tappedY: y,

            turns: [],
            createdTiles: [],
            movedTiles: [],

            scoreAdded: 0,
            totalScore: this.score,
            movesLeft: this.movesLeft,

            state: this.state,
        };
    }

    private AppendCreatedTiles(target: CreatedTile[], source: CreatedTile[]): void {
        for (let i = 0; i < source.length; i++) {
            target.push(source[i]);
        }
    }

    private AppendMovedTiles(target: MovedTile[], source: MovedTile[]): void {
        for (let i = 0; i < source.length; i++) {
            target.push(source[i]);
        }
    }
}
