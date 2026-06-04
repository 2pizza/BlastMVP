import { RemovedTile, TurnResult } from "../../Core/BoardLogic";
import { SpecialTileType } from "../../Core/TileModel";
import { SpecialTileAnimationHost, SpecialTileViewLogic } from "./SpecialTileViewLogic";

export class BombSpecialTileViewLogic implements SpecialTileViewLogic {

    private explosionKickDuration: number = 0.14;
    
    private explosionFlyToScoreDuration: number = 0.28;
    
    private explosionCollapseDuration: number = 0.1;
   
    private explosionKickDistanceMultiplier: number = 0.35;

    public PlayRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, onComplete: () => void): void {
        const explosionTiles: RemovedTile[] = [];
        const defaultTiles: RemovedTile[] = [];

        for (let i = 0; i < turn.removedTiles.length; i++) {
            const removed = turn.removedTiles[i];

            if (removed.specialType === SpecialTileType.None) {
                explosionTiles.push(removed);
            } else {
                defaultTiles.push(removed);
            }
        }

        let completedParts = 0;
        const totalParts = 2;

        const completePart = () => {
            completedParts++;

            if (completedParts >= totalParts) {
                onComplete();
            }
        };

        this.PlayExplosionRemoveAnimation(host, turn, explosionTiles, completePart);
        host.PlayDefaultRemoveAnimation(defaultTiles, completePart);
    }

    private PlayExplosionRemoveAnimation(
        host: SpecialTileAnimationHost,
        turn: TurnResult,
        removedTiles: RemovedTile[],
        onComplete: () => void
    ): void {
        if (removedTiles.length <= 0) {
            onComplete();
            return;
        }

        const layer = host.GetTileAnimationLayer();

        if (layer === null) {
            host.PlayDefaultRemoveAnimation(removedTiles, onComplete);
            return;
        }

        if (layer.parent !== null) {
            layer.setSiblingIndex(layer.parent.childrenCount - 1);
        }

        const explosionCenter = host.GetCellPositionForAnimation(turn.sourceX, turn.sourceY);
        const scoreTargetPosition = host.GetScoreFlyTargetPositionForAnimation(layer);

        let completedCount = 0;

        for (let i = 0; i < removedTiles.length; i++) {
            const removed = removedTiles[i];
            const tileView = host.GetTileViewById(removed.tileId);

            if (tileView === null) {
                completedCount++;

                if (completedCount >= removedTiles.length) {
                    onComplete();
                }

                continue;
            }

            const node = tileView.node;

            host.MoveNodeToLayerKeepingWorldPosition(node, layer);

            const tilePosition = host.GetCellPositionForAnimation(removed.x, removed.y);
            const direction = this.GetExplosionDirection(tilePosition, explosionCenter);
            const kickTargetPosition = this.GetExplosionKickPosition(node, direction.x, direction.y);

            cc.tween(node)
                .to(this.explosionKickDuration, {
                    x: kickTargetPosition.x,
                    y: kickTargetPosition.y,
                    angle: node.angle + 180,
                }, {
                    easing: "quadOut",
                })
                .to(this.explosionFlyToScoreDuration, {
                    x: scoreTargetPosition.x,
                    y: scoreTargetPosition.y,
                    angle: node.angle + 360,
                }, {
                    easing: "quadInOut",
                })
                .to(this.explosionCollapseDuration, {
                    scale: 0,
                    opacity: 0,
                }, {
                    easing: "quadIn",
                })
                .call(() => {
                    host.RemoveTileViewById(removed.tileId);
                    node.destroy();

                    completedCount++;

                    if (completedCount >= removedTiles.length) {
                        onComplete();
                    }
                })
                .start();
        }
    }

    private GetExplosionDirection(tilePosition: cc.Vec3, explosionCenter: cc.Vec3): cc.Vec2 {
        let directionX = tilePosition.x - explosionCenter.x;
        let directionY = tilePosition.y - explosionCenter.y;

        const length = Math.sqrt(directionX * directionX + directionY * directionY);

        if (length > 0.001) {
            directionX /= length;
            directionY /= length;
        } else {
            const angle = Math.random() * Math.PI * 2;

            directionX = Math.cos(angle);
            directionY = Math.sin(angle);
        }

        return cc.v2(directionX, directionY);
    }

    private GetExplosionKickPosition(node: cc.Node, directionX: number, directionY: number): cc.Vec3 {
        const distance = this.GetExplosionKickDistance();

        return cc.v3(
            node.x + directionX * distance,
            node.y + directionY * distance,
            node.z
        );
    }

    private GetExplosionKickDistance(): number {
        const visibleSize = cc.view.getVisibleSize();
        const baseDistance = Math.min(visibleSize.width, visibleSize.height);

        return baseDistance * this.explosionKickDistanceMultiplier;
    }
}
