import { RemovedTile, TurnResult } from "../../Core/BoardLogic";
import { SpecialTileType } from "../../Core/TileModel";
import { SpecialTileAnimationHost, SpecialTileViewLogic } from "./SpecialTileViewLogic";

export class BombSpecialTileViewLogic implements SpecialTileViewLogic {
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

    private PlayExplosionRemoveAnimation(host: SpecialTileAnimationHost, turn: TurnResult, removedTiles: RemovedTile[], onComplete: () => void): void {
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

            const targetPosition = this.GetExplosionTargetPositionForAnimation(node, directionX, directionY, layer);

            cc.tween(node)
                .to(0.22, {
                    x: targetPosition.x,
                    y: targetPosition.y,
                    angle: node.angle + 360,
                    opacity: 0,
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

    private GetExplosionTargetPositionForAnimation(node: cc.Node, directionX: number, directionY: number, layer: cc.Node): cc.Vec3 
    {
        const visibleSize = cc.view.getVisibleSize();
        const distance = Math.max(visibleSize.width, visibleSize.height) * 1.5;
        const worldStart = layer.convertToWorldSpaceAR(node.position);

        const worldTarget = cc.v2(worldStart.x + directionX * distance, worldStart.y + directionY * distance);

        const localTarget = layer.convertToNodeSpaceAR(worldTarget);

        return cc.v3(localTarget.x, localTarget.y, 0);
    }
}
