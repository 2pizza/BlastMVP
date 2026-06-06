import { RemovedTile, TurnResult } from "../../../Core/BoardLogic";
import { SpecialTileType } from "../../../Core/TileModel";
import { ScoreController, ScoreFlyPrefixTweenBuilder } from "../../Animators/ScoreController";
import { SpecialTileAnimationHost, SpecialTileViewLogic } from "../SpecialTileViewLogic";

export interface RocketDirection {
    directionX: number;
    directionY: number;
    angle: number;
}

interface RocketAnimationInfo {
    direction: RocketDirection;
    removedTiles: RemovedTile[];
}

interface RocketPreparedTiles {
    scoreFlyTiles: RemovedTile[];
}

export abstract class RocketSpecialTileViewLogicBase implements SpecialTileViewLogic {
    private readonly rocketSpriteFrame: cc.SpriteFrame;
    private readonly rocketSpeedPixelsPerSecond: number;
    private readonly rocketDistanceMultiplier: number;

    private readonly tileKickDuration: number = 0.12;
    private readonly tileKickDistance: number = 90;
    private readonly tileForwardKickDistance: number = 40;
    private readonly tileContactAdvanceTime: number = 0.04;

    public constructor(rocketSpriteFrame: cc.SpriteFrame, rocketSpeedPixelsPerSecond: number, rocketDistanceMultiplier: number, tileKickDuration:number, tileKickDistance:number,
                       tileForwardKickDistance:number, tileContactAdvanceTime:number) {
        this.rocketSpriteFrame = rocketSpriteFrame;
        this.rocketSpeedPixelsPerSecond = rocketSpeedPixelsPerSecond;
        this.rocketDistanceMultiplier = rocketDistanceMultiplier;
        this.tileKickDuration = tileKickDuration;
        this.tileKickDistance = tileKickDistance;
        this.tileForwardKickDistance = tileForwardKickDistance;
        this.tileContactAdvanceTime = tileContactAdvanceTime;
    }

    public PlayRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, onComplete: () => void): void {
        const animationLayer = host.GetAnimationLayer();
        const scoreController = host.GetScoreController();
        const sourcePosition = host.GetCellPositionForAnimation(turn.sourceX, turn.sourceY);

        if (sourcePosition === null) {
            cc.error("RocketSpecialTileViewLogicBase: setup error, sourcePosition is null");
            this.RemoveAllTileViews(host, turn.removedTiles);
            onComplete();
            return;
        }

        const preparedTiles = this.PrepareRemovedTiles(host, turn);
        const rocketAnimations = this.BuildRocketAnimations(turn, preparedTiles.scoreFlyTiles);

        if (rocketAnimations.length <= 0) {
            scoreController.PlayScoreFlyAnimations(preparedTiles.scoreFlyTiles, onComplete);
            return;
        }

        this.PlayRocketAnimations(host, animationLayer, scoreController, sourcePosition, rocketAnimations, onComplete);
    }

    protected abstract GetRocketDirections(): RocketDirection[];

    private PrepareRemovedTiles(host: SpecialTileAnimationHost, turn: TurnResult): RocketPreparedTiles {
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

        return {
            scoreFlyTiles: scoreFlyTiles,
        };
    }

    private BuildRocketAnimations(turn: TurnResult, removedTiles: RemovedTile[]): RocketAnimationInfo[] {
        const directions = this.GetRocketDirections();
        const result: RocketAnimationInfo[] = [];

        for (let i = 0; i < directions.length; i++) {
            const direction = directions[i];
            const tilesForRocket: RemovedTile[] = [];

            for (let j = 0; j < removedTiles.length; j++) {
                const removed = removedTiles[j];

                if (this.IsTileForRocket(removed, turn, direction)) {
                    tilesForRocket.push(removed);
                }
            }

            result.push({ direction: direction, removedTiles: tilesForRocket });
        }

        return result;
    }

    private PlayRocketAnimations(host: SpecialTileAnimationHost, animationLayer: cc.Node, scoreController: ScoreController, 
                                 sourcePosition: cc.Vec3, rocketAnimations: RocketAnimationInfo[], onComplete: () => void): void {
        let totalHitTiles = 0;

        for (let i = 0; i < rocketAnimations.length; i++) {
            totalHitTiles += rocketAnimations[i].removedTiles.length;
        }

        if (totalHitTiles <= 0) {
            for (let i = 0; i < rocketAnimations.length; i++) {
                this.PlayRocketNode(
                    animationLayer,
                    sourcePosition,
                    rocketAnimations[i].direction
                );
            }

            onComplete();
            return;
        }

        let completedHitTiles = 0;
        let hasCompleted = false;

        const completeHitTile = () => {
            completedHitTiles++;

            if (!hasCompleted && completedHitTiles >= totalHitTiles) {
                hasCompleted = true;
                onComplete();
            }
        };

        for (let i = 0; i < rocketAnimations.length; i++) {
            const rocketAnimation = rocketAnimations[i];

            this.PlayRocketNode(animationLayer, sourcePosition, rocketAnimation.direction);

            this.PlayRocketScoreFlyAnimations(host, scoreController, sourcePosition, rocketAnimation, completeHitTile);
        }
    }

    private PlayRocketScoreFlyAnimations(host: SpecialTileAnimationHost, scoreController: ScoreController, sourcePosition: cc.Vec3, rocketAnimation: RocketAnimationInfo, onHitComplete: () => void): void {
        for (let i = 0; i < rocketAnimation.removedTiles.length; i++) {
            const removed = rocketAnimation.removedTiles[i];

            let hasHitCompleted = false;

            const completeHit = () => {
                if (hasHitCompleted) {
                    return;
                }

                hasHitCompleted = true;
                onHitComplete();
            };

            const prefixTween = this.CreateRocketHitPrefixTween(host, sourcePosition, rocketAnimation.direction, removed, completeHit);
            scoreController.PlayCustomStartScoreFlyAnimation(removed, prefixTween);
        }
    }

    private CreateRocketHitPrefixTween(host: SpecialTileAnimationHost, sourcePosition: cc.Vec3, direction: RocketDirection, removed: RemovedTile, onPrefixComplete: () => void): ScoreFlyPrefixTweenBuilder {
        return (tween: cc.Tween, tile: cc.Node): void => {
            const tilePosition = host.GetCellPositionForAnimation(removed.x, removed.y);
            const contactDelay = this.GetTileContactDelay(tilePosition, sourcePosition, direction);
            const kickTargetPosition = this.GetTileKickPosition(tile, tilePosition, sourcePosition, direction);

            tween
                .delay(contactDelay)
                .to(this.tileKickDuration, {
                    x: kickTargetPosition.x,
                    y: kickTargetPosition.y,
                    angle: tile.angle + 120,
                }, {
                    easing: "quadOut",
                })
                .call(onPrefixComplete);
        };
    }

    private PlayRocketNode(animationLayer: cc.Node, sourcePosition: cc.Vec3, direction: RocketDirection): void {
        const rocketNode = this.CreateRocketNode(animationLayer);

        if (rocketNode === null) {
            return;
        }

        const rocketDistance = this.GetRocketTravelDistance();
        const rocketDuration = this.GetDurationBySpeed(rocketDistance);

        rocketNode.setPosition(sourcePosition);
        rocketNode.angle = direction.angle;

        const targetPosition = cc.v3(
            sourcePosition.x + direction.directionX * rocketDistance,
            sourcePosition.y + direction.directionY * rocketDistance,
            sourcePosition.z
        );

        cc.tween(rocketNode)
            .to(rocketDuration, {
                x: targetPosition.x,
                y: targetPosition.y,
                opacity: 0,
            }, {
                easing: "linear",
            })
            .call(() => {
                rocketNode.destroy();
            })
            .start();
    }

    private CreateRocketNode(animationLayer: cc.Node): cc.Node {
        const node = new cc.Node("RocketAnimation");

        node.setAnchorPoint(0.5, 0.5);

        const sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = this.rocketSpriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.RAW;

        animationLayer.addChild(node);

        return node;
    }

    private IsTileForRocket(removed: RemovedTile, turn: TurnResult, direction: RocketDirection): boolean {
        if (direction.directionX > 0) {
            return removed.y === turn.sourceY && removed.x > turn.sourceX;
        }

        if (direction.directionX < 0) {
            return removed.y === turn.sourceY && removed.x < turn.sourceX;
        }

        if (direction.directionY > 0) {
            return removed.x === turn.sourceX && removed.y > turn.sourceY;
        }

        if (direction.directionY < 0) {
            return removed.x === turn.sourceX && removed.y < turn.sourceY;
        }

        return false;
    }

    private GetRocketTravelDistance(): number {
        const visibleSize = cc.view.getVisibleSize();

        return Math.max(visibleSize.width, visibleSize.height) * this.rocketDistanceMultiplier;
    }

    private GetDurationBySpeed(distance: number): number {
        if (this.rocketSpeedPixelsPerSecond <= 0.001) {
            return 0;
        }

        return distance / this.rocketSpeedPixelsPerSecond;
    }

    private GetTileContactDelay(
        tilePosition: cc.Vec3,
        sourcePosition: cc.Vec3,
        direction: RocketDirection
    ): number {
        const projectedDistance = this.GetProjectedDistance(tilePosition, sourcePosition, direction);
        const delay = projectedDistance / this.rocketSpeedPixelsPerSecond - this.tileContactAdvanceTime;

        return Math.max(0, delay);
    }

    private GetProjectedDistance(
        position: cc.Vec3,
        sourcePosition: cc.Vec3,
        direction: RocketDirection
    ): number {
        const offsetX = position.x - sourcePosition.x;
        const offsetY = position.y - sourcePosition.y;
        const projection = offsetX * direction.directionX + offsetY * direction.directionY;

        return Math.max(0, projection);
    }

    private GetTileKickPosition(
        tile: cc.Node,
        tilePosition: cc.Vec3,
        sourcePosition: cc.Vec3,
        direction: RocketDirection
    ): cc.Vec3 {
        const perpendicularX = -direction.directionY;
        const perpendicularY = direction.directionX;
        const side = this.GetPerpendicularSide(tilePosition, sourcePosition, perpendicularX, perpendicularY);

        return cc.v3(
            tile.x + perpendicularX * side * this.tileKickDistance + direction.directionX * this.tileForwardKickDistance,
            tile.y + perpendicularY * side * this.tileKickDistance + direction.directionY * this.tileForwardKickDistance,
            tile.z
        );
    }

    private GetPerpendicularSide(
        tilePosition: cc.Vec3,
        sourcePosition: cc.Vec3,
        perpendicularX: number,
        perpendicularY: number
    ): number {
        const perpendicularOffset =
            (tilePosition.x - sourcePosition.x) * perpendicularX +
            (tilePosition.y - sourcePosition.y) * perpendicularY;

        if (Math.abs(perpendicularOffset) > 0.001) {
            return perpendicularOffset > 0 ? 1 : -1;
        }

        const checker = Math.floor(tilePosition.x + tilePosition.y);

        return checker % 2 === 0 ? 1 : -1;
    }

    private RemoveAllTileViews(host: SpecialTileAnimationHost, removedTiles: RemovedTile[]): void {
        for (let i = 0; i < removedTiles.length; i++) {
            host.RemoveTileViewById(removedTiles[i].tileId);
        }
    }
}