import { RemovedTile, TurnResult } from "../../Core/BoardLogic";
import { SpecialTileType } from "../../Core/TileModel";
import { ScoreController, ScoreFlyPrefixTweenBuilder } from "../Animators/ScoreController";
import { TileView } from "../TileView";
import { SpecialTileAnimationHost, SpecialTileViewLogic } from "./SpecialTileViewLogic";

interface DynamiteBlastPoint {
    x: number;
    y: number;
    position: cc.Vec3;
    delay: number;
}

export class DynamiteSpecialTileViewLogic implements SpecialTileViewLogic {
    private readonly bombSpriteFrame: cc.SpriteFrame;

    private readonly blastStep: number ;
    private readonly blastWaveDelay: number;
    private readonly bombAppearDuration: number;
    private readonly bombExplodeDuration: number;

    private readonly tileHitDelay: number;
    private readonly tileKickDuration: number;
    private readonly tileKickDistance: number;

    public constructor(bombSpriteFrame: cc.SpriteFrame, blastStep: number, blastWaveDelay: number, bombAppearDuration: number, bombExplodeDuration: number,
                       tileHitDelay: number, tileKickDuration: number, tileKickDistance: number) {
        this.bombSpriteFrame = bombSpriteFrame;
        this.blastStep = blastStep;
        this.blastWaveDelay = blastWaveDelay;
        this.bombAppearDuration = bombAppearDuration;
        this.bombExplodeDuration = bombExplodeDuration;
        this.tileHitDelay = tileHitDelay;
        this.tileKickDuration = tileKickDuration;
        this.tileKickDistance = tileKickDistance;
    }

    public PlayRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, onComplete: () => void): void {
        const animationLayer = host.GetAnimationLayer();
        const scoreController = host.GetScoreController();
        const sourcePosition = host.GetCellPositionForAnimation(turn.sourceX, turn.sourceY);

        if (sourcePosition === null) {
            cc.error("DynamiteSpecialTileViewLogic: sourcePosition is null");
            this.RemoveAllTileViews(host, turn.removedTiles);
            onComplete();
            return;
        }

        const preparedTiles = this.PrepareRemovedTiles(host, turn);
        const blastPoints = this.CreateBlastPoints(host, turn);

        this.PlayBlastPointAnimations(animationLayer, blastPoints);
        this.PlayScoreFlyAnimations(host, scoreController, preparedTiles, blastPoints, onComplete);
    }

    private PrepareRemovedTiles(host: SpecialTileAnimationHost, turn: TurnResult): RemovedTile[] {
        const scoreFlyTiles: RemovedTile[] = [];

        for (let i = 0; i < turn.removedTiles.length; i++) {
            const removed = turn.removedTiles[i];

            if (removed.specialType !== SpecialTileType.None) {
                host.GetScoreController().AddInstant(removed.score);
                host.RemoveTileViewById(removed.tileId);
                continue;
            }

            scoreFlyTiles.push(removed);
        }

        return scoreFlyTiles;
    }

    private PlayScoreFlyAnimations(host: SpecialTileAnimationHost, scoreFlyController: ScoreController, scoreFlyTiles: RemovedTile[], blastPoints: DynamiteBlastPoint[], onComplete: () => void): void {
        if (scoreFlyTiles.length <= 0) {
            this.CompleteAfterBlastPoints(blastPoints, onComplete);
            return;
        }

        let completedBlockingCount = 0;
        let hasCompleted = false;

        const completeBlockingTile = () => {
            completedBlockingCount++;

            if (!hasCompleted && completedBlockingCount >= scoreFlyTiles.length) {
                hasCompleted = true;
                onComplete();
            }
        };

        for (let i = 0; i < scoreFlyTiles.length; i++) {
            const removed = scoreFlyTiles[i];
            let hasTileBlockingCompleted = false;

            const completeTileBlocking = () => {
                if (hasTileBlockingCompleted) {
                    return;
                }

                hasTileBlockingCompleted = true;
                completeBlockingTile();
            };

            const prefixTween = this.CreateDynamiteHitPrefixTween(host, removed, blastPoints, completeTileBlocking);

            scoreFlyController.PlayCustomStartScoreFlyAnimation(removed, prefixTween, completeTileBlocking);
        }
    }

    private CreateDynamiteHitPrefixTween(host: SpecialTileAnimationHost, removed: RemovedTile, blastPoints: DynamiteBlastPoint[], onPrefixComplete: () => void): ScoreFlyPrefixTweenBuilder {
        return (tween: cc.Tween, tile: cc.Node): void => {
            const tilePosition = host.GetCellPositionForAnimation(removed.x, removed.y);
            const blastPoint = this.FindNearestBlastPoint(tilePosition, blastPoints);

            if (blastPoint === null) {
                tween.call(onPrefixComplete);
                return;
            }

            const direction = this.GetTileKickDirection(tilePosition, blastPoint.position);
            const kickPosition = this.GetTileKickPosition(tile, direction);
            const delay = blastPoint.delay + this.tileHitDelay;

            tween
                .delay(delay)
                .to(this.tileKickDuration, {
                    x: kickPosition.x,
                    y: kickPosition.y,
                    angle: tile.angle + 180,
                }, {
                    easing: "quadOut",
                })
                .call(onPrefixComplete);
        };
    }

    private CreateBlastPoints(host: SpecialTileAnimationHost, turn: TurnResult): DynamiteBlastPoint[] {
        const bounds = this.GetRemovedTilesBounds(turn);
        const points: DynamiteBlastPoint[] = [];

        this.AddBlastPoint(host, turn.sourceX, turn.sourceY, turn, points);

        for (let y = turn.sourceY; y <= bounds.maxY; y += this.blastStep) {
            for (let x = turn.sourceX; x <= bounds.maxX; x += this.blastStep) {
                this.AddBlastPoint(host, x, y, turn, points);
            }

            for (let x = turn.sourceX - this.blastStep; x >= bounds.minX; x -= this.blastStep) {
                this.AddBlastPoint(host, x, y, turn, points);
            }
        }

        for (let y = turn.sourceY - this.blastStep; y >= bounds.minY; y -= this.blastStep) {
            for (let x = turn.sourceX; x <= bounds.maxX; x += this.blastStep) {
                this.AddBlastPoint(host, x, y, turn, points);
            }

            for (let x = turn.sourceX - this.blastStep; x >= bounds.minX; x -= this.blastStep) {
                this.AddBlastPoint(host, x, y, turn, points);
            }
        }

        points.sort((a, b) => a.delay - b.delay);

        return points;
    }

    private AddBlastPoint(host: SpecialTileAnimationHost, x: number, y: number, turn: TurnResult, points: DynamiteBlastPoint[]): void {
        if (this.ContainsBlastPoint(points, x, y)) {
            return;
        }

        const distanceFromSource = Math.abs(x - turn.sourceX) + Math.abs(y - turn.sourceY);

        points.push({ x: x, y: y, position: host.GetCellPositionForAnimation(x, y), delay: distanceFromSource * this.blastWaveDelay, });
    }

    private ContainsBlastPoint(points: DynamiteBlastPoint[], x: number, y: number): boolean {
        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            if (point.x === x && point.y === y) {
                return true;
            }
        }

        return false;
    }

    private GetRemovedTilesBounds(turn: TurnResult): { minX: number; maxX: number; minY: number; maxY: number } {
        let minX = turn.sourceX;
        let maxX = turn.sourceX;
        let minY = turn.sourceY;
        let maxY = turn.sourceY;

        for (let i = 0; i < turn.removedTiles.length; i++) {
            const removed = turn.removedTiles[i];

            if (removed.x < minX) {
                minX = removed.x;
            }

            if (removed.x > maxX) {
                maxX = removed.x;
            }

            if (removed.y < minY) {
                minY = removed.y;
            }

            if (removed.y > maxY) {
                maxY = removed.y;
            }
        }

        return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
    }

    private PlayBlastPointAnimations(layer: cc.Node, blastPoints: DynamiteBlastPoint[]): void {
        for (let i = 0; i < blastPoints.length; i++) {
            const point = blastPoints[i];
            const bombNode = this.CreateBombNode(layer);

            if (bombNode === null) {
                continue;
            }

            bombNode.setPosition(point.position);
            bombNode.scale = 0;
            bombNode.opacity = 255;

            cc.tween(bombNode)
                .delay(point.delay)
                .to(this.bombAppearDuration, {
                    scale: 1,
                }, {
                    easing: "backOut",
                })
                .to(this.bombExplodeDuration, {
                    scale: 1.6,
                    opacity: 0,
                }, {
                    easing: "quadOut",
                })
                .call(() => {
                    bombNode.destroy();
                })
                .start();
        }
    }

    private CreateBombNode(layer: cc.Node): cc.Node | null {
        if (this.bombSpriteFrame === null) {
            return null;
        }

        const node = new cc.Node("DynamiteBombAnimation");

        node.setAnchorPoint(0.5, 0.5);

        const sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = this.bombSpriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.RAW;

        layer.addChild(node);

        return node;
    }

    private FindNearestBlastPoint(position: cc.Vec3, blastPoints: DynamiteBlastPoint[]): DynamiteBlastPoint | null {
        if (blastPoints.length <= 0) {
            return null;
        }

        let nearestPoint = blastPoints[0];
        let nearestDistance = Number.MAX_VALUE;

        for (let i = 0; i < blastPoints.length; i++) {
            const point = blastPoints[i];
            const dx = position.x - point.position.x;
            const dy = position.y - point.position.y;
            const distance = dx * dx + dy * dy;

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPoint = point;
            }
        }

        return nearestPoint;
    }

    private GetTileKickDirection(tilePosition: cc.Vec3, blastPosition: cc.Vec3): cc.Vec2 {
        let directionX = tilePosition.x - blastPosition.x;
        let directionY = tilePosition.y - blastPosition.y;
        const length = Math.sqrt(directionX * directionX + directionY * directionY);

        if (length > 0.001) {
            directionX /= length;
            directionY /= length;
        } else {
            directionX = 0;
            directionY = 1;
        }

        return cc.v2(directionX, directionY);
    }

    private GetTileKickPosition(node: cc.Node, direction: cc.Vec2): cc.Vec3 {
        return cc.v3(
            node.x + direction.x * this.tileKickDistance,
            node.y + direction.y * this.tileKickDistance,
            node.z
        );
    }

    private CompleteAfterBlastPoints(blastPoints: DynamiteBlastPoint[], onComplete: () => void): void {
        const delay = this.GetBlastPointsCompleteDelay(blastPoints);

        if (delay <= 0) {
            onComplete();
            return;
        }

        cc.tween({ value: 0 })
            .delay(delay)
            .call(() => {
                onComplete();
            })
            .start();
    }

    private GetBlastPointsCompleteDelay(blastPoints: DynamiteBlastPoint[]): number {
        let maxDelay = 0;

        for (let i = 0; i < blastPoints.length; i++) {
            if (blastPoints[i].delay > maxDelay) {
                maxDelay = blastPoints[i].delay;
            }
        }

        return maxDelay + this.bombAppearDuration + this.bombExplodeDuration;
    }

    private RemoveAllTileViews(host: SpecialTileAnimationHost, removedTiles: RemovedTile[]): void {
        for (let i = 0; i < removedTiles.length; i++) {
            host.RemoveTileViewById(removedTiles[i].tileId);
        }
    }
}