import { RemovedTile, TurnResult } from "../../Core/BoardLogic";
import { SpecialTileType } from "../../Core/TileModel";
import { ScoreFlyPrefixTweenBuilder } from "../Animators/ScoreController";
import { SpecialTileAnimationHost, SpecialTileViewLogic } from "./SpecialTileViewLogic";

export class BombSpecialTileViewLogic implements SpecialTileViewLogic {
    private explosionKickDuration: number = 0.14;
    private explosionKickDistance: number = 120;

    public constructor(explosionKickDuration:number, explosionKickDistance:number) {
        this.explosionKickDistance = explosionKickDistance;
        this.explosionKickDuration = explosionKickDuration;
    }

    public PlayRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, onComplete: () => void): void {
        const scoreController = host.GetScoreController();
        const explosionTiles: RemovedTile[] = [];

        for (let i = 0; i < turn.removedTiles.length; i++) {
            const removed = turn.removedTiles[i];

            if (removed.specialType !== SpecialTileType.None) {
                scoreController.AddInstant(removed.score);
                host.RemoveTileViewById(removed.tileId);
                continue;
            }

            explosionTiles.push(removed);
        }

        if (explosionTiles.length <= 0) {
            onComplete();
            return;
        }

        let completedExplosionCount = 0;
        let hasCompleted = false;

        const completeExplosionTile = () => {
            completedExplosionCount++;

            if (!hasCompleted && completedExplosionCount >= explosionTiles.length) {
                hasCompleted = true;
                onComplete();
            }
        };

        for (let i = 0; i < explosionTiles.length; i++) {
            const removed = explosionTiles[i];
            const prefixTween = this.CreateExplosionPrefixTween(host, turn, removed, completeExplosionTile);

            scoreController.PlayCustomStartScoreFlyAnimation(removed, prefixTween);
        }
    }

   private CreateExplosionPrefixTween(host: SpecialTileAnimationHost, turn: TurnResult, removed: RemovedTile, onExplosionComplete: () => void): ScoreFlyPrefixTweenBuilder {
        return (tween: cc.Tween, tile: cc.Node): void => {
            const explosionCenter = host.GetCellPositionForAnimation(turn.sourceX, turn.sourceY);
            const tilePosition = host.GetCellPositionForAnimation(removed.x, removed.y);
            const direction = this.GetExplosionDirection(tilePosition, explosionCenter);
            const kickTargetPosition = this.GetExplosionKickPosition(tile, direction.x, direction.y);

            tween
                .to(this.explosionKickDuration, {
                    x: kickTargetPosition.x,
                    y: kickTargetPosition.y,
                    angle: tile.angle + 180,
                }, {
                    easing: "quadOut",
                })
                .call(onExplosionComplete);
        };
    }

   private GetExplosionDirection(tilePosition: cc.Vec2, explosionCenter: cc.Vec2): cc.Vec2 {
        const direction = tilePosition.sub(explosionCenter);

        if (direction.magSqr() > 0.001 * 0.001) {
            return direction.normalize();
        }

        const angle = Math.random() * Math.PI * 2;

        return cc.v2(Math.cos(angle), Math.sin(angle));
    }

    private GetExplosionKickPosition(node: cc.Node, directionX: number, directionY: number): cc.Vec2 {
        const distance = this.explosionKickDistance;
        return cc.v2(node.x + directionX * distance, node.y + directionY * distance);
    }
}