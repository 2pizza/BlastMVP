import { BoardModel } from "../Core/BoardModel";
import { CreatedTile, MovedTile, RemovedTile, TurnResult } from "../Core/BoardLogic";
import { MoveResult } from "../Core/GameModel";
import { SpecialTileRegistry } from "../Core/SpecialTiles/SpecialTileRegistry";
import { SpecialTileType, TileModel } from "../Core/TileModel";
import { SpecialTileSpriteBinding } from "./SpecialTiles/SpecialTileSpriteBinding";
import { SpecialTileViewRegistry } from "./SpecialTiles/SpecialTileViewRegistry";
import { TileView } from "./TileView";
import { SpecialTileAnimationHost } from "./SpecialTiles/SpecialTileViewLogic";

const { ccclass, property } = cc._decorator;

@ccclass
export class BoardView extends cc.Component implements SpecialTileAnimationHost {
    @property(cc.Node)
    private boardRoot: cc.Node = null;

    @property(cc.Node)
    private tileAnimationLayer: cc.Node = null;

    @property(cc.Node)
    private boardBackground: cc.Node = null;

    @property(cc.Node)
    private boardMask: cc.Node = null;

    @property
    private referenceColumns: number = 9;

    @property
    private referenceRows: number = 9;

    private referenceBackgroundSize: cc.Size = null;
    private referenceMaskSize: cc.Size = null;

    @property(cc.Prefab)
    private tilePrefab: cc.Prefab = null;

    @property([cc.SpriteFrame])
    private tileSprites: cc.SpriteFrame[] = [];

    @property([SpecialTileSpriteBinding])
    private specialTileSprites: SpecialTileSpriteBinding[] = [];

    @property
    private cellSize: number = 100;

    @property
    private removeDuration: number = 0.12;

    @property
    private moveDuration: number = 0.18;
    

    private board: BoardModel = null;
    private tileViewsById: { [tileId: number]: TileView } = {};
    private tapCallback: (x: number, y: number) => void = null;

    private selectedTileView: TileView = null;

    protected onLoad(): void {
        if (this.boardBackground !== null) {
            this.referenceBackgroundSize = this.boardBackground.getContentSize();
        }

        if (this.boardMask !== null) {
            this.referenceMaskSize = this.boardMask.getContentSize();
    }
}

    public Init(board: BoardModel, onTileTap: (x: number, y: number) => void): void {
        this.board = board;
        this.tapCallback = onTileTap;

        this.ClearAllTiles();
        this.CreateAllTilesFromBoard();

        this.ResizeBoardArea(board.width, board.height);
    }

    public RefreshInstant(board: BoardModel): void {
        this.board = board;

        this.ClearAllTiles();
        this.CreateAllTilesFromBoard();
        this.ResizeBoardArea(board.width, board.height);
    }

    public PlayMoveResult(result: MoveResult, onComplete: () => void): void {
        this.ClearTileSelection();
        
        if (!result.success) {
            onComplete();
            return;
        }

        this.PlayTurns(result.turns, 0, () => {
            this.CreateCreatedTiles(result.createdTiles);
            this.PlayMoveAnimation(result.movedTiles, () => {
                this.SortTileViewsByBoardOrder();
                this.scheduleOnce(() => { onComplete();}, 0.25);
            });
        });
    }

    public TryGetCellFromWorldPosition(worldPosition: cc.Vec2): { success: boolean; x: number; y: number } {
        if (this.board === null || this.boardRoot === null) {
            return {
                success: false,
                x: -1,
                y: -1,
            };
        }

        const localPosition = this.boardRoot.convertToNodeSpaceAR(worldPosition);

        const boardWidth = this.board.width * this.cellSize;
        const boardHeight = this.board.height * this.cellSize;

        const left = -boardWidth * 0.5;
        const bottom = -boardHeight * 0.5;

        const localX = localPosition.x - left;
        const localY = localPosition.y - bottom;

        if (localX < 0 || localY < 0 || localX >= boardWidth || localY >= boardHeight) {
            return {
                success: false,
                x: -1,
                y: -1,
            };
        }

        const x = Math.floor(localX / this.cellSize);
        const y = Math.floor(localY / this.cellSize);

        if (!this.board.IsInside(x, y)) {
            return {
                success: false,
                x: -1,
                y: -1,
            };
        }

        return {
            success: true,
            x: x,
            y: y,
        };
    }

    public SetTileSelected(x: number, y: number, selected: boolean): void {
        if (this.board === null) {
            return;
        }

        const tile = this.board.GetTile(x, y);

        if (tile === null) {
            return;
        }

        const tileView = this.tileViewsById[tile.id];

        if (tileView === undefined || tileView === null) {
            return;
        }

        if (selected) {
            this.ClearTileSelection();
            this.selectedTileView = tileView;
            tileView.SetSelected(true);
            return;
        }

        if (this.selectedTileView === tileView) {
            tileView.SetSelected(false);
            this.selectedTileView = null;
        }
    }

    public ClearTileSelection(): void {
        if (this.selectedTileView !== null) {
            this.selectedTileView.SetSelected(false);
            this.selectedTileView = null;
        }
    }

    private PlayTurns(turns: TurnResult[], index: number, onComplete: () => void): void {
        if (index >= turns.length) {
            onComplete();
            return;
        }

        const turn = turns[index];

        this.PlayTurnRemoveAnimation(turn, () => {
            this.PlayTurns(turns, index + 1, onComplete);
        });
    }

    private CreateAllTilesFromBoard(): void {
        if (this.board === null) {
            cc.error("BoardView: board is null");
            return;
        }

        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                const tile = this.board.GetTile(x, y);

                if (tile === null) {
                    continue;
                }

                this.CreateTileViewFromModel(tile, x, y, y);
            }
        }
    }

    private CreateCreatedTiles(createdTiles: CreatedTile[]): void {
        for (let i = 0; i < createdTiles.length; i++) {
            const created = createdTiles[i];

            if (this.tileViewsById[created.tileId] !== undefined) {
                continue;
            }

            if (this.board === null) {
                cc.error("BoardView: board is null");
                return;
            }

            const found = this.board.FindTileById(created.tileId);

            if (found === null) {
                cc.error("BoardView: created tile is not found in board:", created.tileId);
                continue;
            }

            this.CreateTileViewFromModel(
                found.tile,
                created.x,
                created.y,
                created.y
            );
        }
    }

    private CreateTileViewFromModel(
        tile: TileModel,
        boardX: number,
        boardY: number,
        visualY: number
    ): TileView {
        if (this.boardRoot === null) {
            cc.error("BoardView: boardRoot is not assigned");
            return null;
        }

        if (this.tilePrefab === null) {
            cc.error("BoardView: tilePrefab is not assigned");
            return null;
        }

        const spriteFrame = this.GetTileSpriteFrame(tile);

        if (spriteFrame === null) {
            cc.error("BoardView: spriteFrame is null for tileId:", tile.id);
            return null;
        }

        const node = cc.instantiate(this.tilePrefab);
        node.parent = this.boardRoot;

        node.position = this.GetCellPosition(boardX, visualY);
        node.scale = 1;
        node.opacity = 255;
        node.active = true;

        const tileView = node.getComponent(TileView);

        if (tileView === null) {
            cc.error("BoardView: Tile prefab does not have TileView component");
            node.destroy();
            return null;
        }

        tileView.Init(
            tile.id,
            tile.GetColorId(),
            boardX,
            boardY,
            spriteFrame,
            this.tapCallback
        );

        tileView.SetLogicalSize(this.cellSize, this.cellSize);

        this.tileViewsById[tile.id] = tileView;

        return tileView;
    }

    private PlayTurnRemoveAnimation(turn: TurnResult, onComplete: () => void): void {
        const specialLogic = SpecialTileViewRegistry.GetLogic(turn.sourceSpecialType);

        if (specialLogic !== null) {
            specialLogic.PlayRemoveAnimation(this, turn, onComplete);
            return;
        }

        this.PlayDefaultRemoveAnimation(turn.removedTiles, onComplete);
    }

    public PlayDefaultRemoveAnimation(removedTiles: RemovedTile[], onComplete: () => void): void {
        if (removedTiles.length <= 0) {
            onComplete();
            return;
        }

        let completedCount = 0;

        for (let i = 0; i < removedTiles.length; i++) {
            const removed = removedTiles[i];
            const tileView = this.tileViewsById[removed.tileId];

            if (tileView === undefined || tileView === null) {
                completedCount++;

                if (completedCount >= removedTiles.length) {
                    onComplete();
                }

                continue;
            }

            cc.tween(tileView.node)
                .to(this.removeDuration, {
                    scale: 0,
                    opacity: 0,
                })
                .call(() => {
                    delete this.tileViewsById[removed.tileId];
                    tileView.node.destroy();

                    completedCount++;

                    if (completedCount >= removedTiles.length) {
                        onComplete();
                    }
                })
                .start();
        }
    }

    private PlayMoveAnimation(movedTiles: MovedTile[], onComplete: () => void): void {
        if (movedTiles.length <= 0) {
            onComplete();
            return;
        }

        let completedCount = 0;

        for (let i = 0; i < movedTiles.length; i++) {
            const moved = movedTiles[i];
            const tileView = this.tileViewsById[moved.tileId];

            if (tileView === undefined || tileView === null) {
                cc.error("BoardView: missing TileView for moved tileId:", moved.tileId);
                completedCount++;

                if (completedCount >= movedTiles.length) {
                    onComplete();
                }

                continue;
            }

            this.PlaySingleTileMove(tileView, moved, () => {
                completedCount++;

                if (completedCount >= movedTiles.length) {
                    onComplete();
                }
            });
        }
    }

    private PlaySingleTileMove(tileView: TileView, moved: MovedTile, onComplete: () => void): void {
        if (moved.path.length <= 0) {
            onComplete();
            return;
        }

        const first = moved.path[0];
        tileView.node.position = this.GetCellPosition(first.x, first.y);

        if (moved.path.length === 1) {
            tileView.SetBoardPosition(first.x, first.y);
            onComplete();
            return;
        }

        let tween = cc.tween(tileView.node);

        for (let i = 1; i < moved.path.length; i++) {
            const point = moved.path[i];
            const targetPosition = this.GetCellPosition(point.x, point.y);

            tween = tween.to(this.moveDuration, {
                x: targetPosition.x,
                y: targetPosition.y,
            });
        }

        const last = moved.path[moved.path.length - 1];

        tween
            .call(() => {
                tileView.SetBoardPosition(last.x, last.y);
                onComplete();
            })
            .start();
    }

    private ClearAllTiles(): void {
        this.tileViewsById = {};

        this.boardRoot.destroyAllChildren();
        this.tileAnimationLayer.destroyAllChildren();
    }

    public GetTileViewById(tileId: number): TileView | null {
        const tileView = this.tileViewsById[tileId];

        if (tileView === undefined) {
            return null;
        }

        return tileView;
    }

    public RemoveTileViewById(tileId: number): void {
        delete this.tileViewsById[tileId];
    }

    public GetCellPositionForAnimation(x: number, y: number): cc.Vec3 {
        return this.GetCellPosition(x, y);
    }

    public GetTileAnimationLayer(): cc.Node | null {
        if (this.tileAnimationLayer !== null) {
            return this.tileAnimationLayer;
        }

        return this.boardRoot;
    }

    public MoveNodeToLayerKeepingWorldPosition(node: cc.Node, layer: cc.Node): void {
        if (node.parent === null) {
            node.parent = layer;
            return;
        }

        const worldPosition = node.parent.convertToWorldSpaceAR(node.position);

        node.parent = layer;
        node.position = layer.convertToNodeSpaceAR(worldPosition);
    }

    private GetCellPosition(x: number, y: number): cc.Vec3 {
        if (this.board === null) {
            return cc.v3(0, 0, 0);
        }

        const offsetX = -((this.board.width - 1) * this.cellSize) * 0.5;
        const offsetY = -((this.board.height - 1) * this.cellSize) * 0.5;

        return cc.v3(
            offsetX + x * this.cellSize,
            offsetY + y * this.cellSize,
            0
        );
    }

    private GetTileSpriteFrame(tile: TileModel): cc.SpriteFrame {
        if (tile.HasSpecialLogic()) {
            return this.GetSpecialTileSpriteFrame(tile.GetSpecialType());
        }

        return this.GetSpriteFrame(tile.GetColorId());
    }

    private GetSpecialTileSpriteFrame(specialType: SpecialTileType): cc.SpriteFrame {
        for (let i = 0; i < this.specialTileSprites.length; i++) {
            const binding = this.specialTileSprites[i];

            if (binding === null) {
                continue;
            }

            if (binding.specialType === specialType) {
                if (binding.spriteFrame === null) {
                    cc.error("BoardView: spriteFrame is null for special tile:", specialType);
                    return null;
                }

                return binding.spriteFrame;
            }
        }

        cc.error("BoardView: no sprite binding for special tile:", specialType);
        return null;
    }

    private GetSpriteFrame(colorId: number): cc.SpriteFrame {
        if (this.tileSprites === null || this.tileSprites.length <= 0) {
            cc.error("BoardView: tileSprites is empty");
            return null;
        }

        if (colorId < 0 || colorId >= this.tileSprites.length) {
            cc.error("BoardView: no sprite frame for colorId:", colorId);
            return null;
        }

        const spriteFrame = this.tileSprites[colorId];

        if (spriteFrame === null) {
            cc.error("BoardView: sprite frame is null for colorId:", colorId);
            return null;
        }

        return spriteFrame;
    }

    private SortTileViewsByBoardOrder(): void {
        if (this.board === null) {
            return;
        }

        if (this.boardRoot === null) {
            return;
        }

        let siblingIndex = 0;

        for (let y = 0; y < this.board.height; y++) {
            for (let x = 0; x < this.board.width; x++) {
                const tile = this.board.GetTile(x, y);

                if (tile === null) {
                    continue;
                }

                const tileView = this.tileViewsById[tile.id];

                if (tileView === undefined || tileView === null) {
                    continue;
                }

                if (tileView.node.parent !== this.boardRoot) {
                    continue;
                }

                tileView.node.setSiblingIndex(siblingIndex);
                siblingIndex++;
            }
        }
    }

    private ResizeBoardArea(boardWidth: number, boardHeight: number): void {
        const tilesWidth = boardWidth * this.cellSize;
        const tilesHeight = boardHeight * this.cellSize;

        const referenceTilesWidth = this.referenceColumns * this.cellSize;
        const referenceTilesHeight = this.referenceRows * this.cellSize;

        if (this.boardBackground !== null && this.referenceBackgroundSize !== null) {
            const backgroundPaddingX = Math.max(
                0,
                (this.referenceBackgroundSize.width - referenceTilesWidth) * 0.5
            );

            const backgroundPaddingY = Math.max(
                0,
                (this.referenceBackgroundSize.height - referenceTilesHeight) * 0.5
            );

            this.boardBackground.setContentSize(
                tilesWidth + backgroundPaddingX * 2,
                tilesHeight + backgroundPaddingY * 2
            );
        }

        if (this.boardMask !== null && this.referenceMaskSize !== null) {
            const maskPaddingX = Math.max(
                0,
                (this.referenceMaskSize.width - referenceTilesWidth) * 0.5
            );

            const maskPaddingY = Math.max(
                0,
                (this.referenceMaskSize.height - referenceTilesHeight) * 0.5
            );

            this.boardMask.setContentSize(
                tilesWidth + maskPaddingX * 2,
                tilesHeight + maskPaddingY * 2
            );
        }

        if (this.boardRoot !== null) {
            this.boardRoot.setContentSize(tilesWidth, tilesHeight);
            this.boardRoot.setPosition(0, 0);
        }
    }
}
