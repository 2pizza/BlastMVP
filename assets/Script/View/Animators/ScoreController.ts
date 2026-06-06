import { RemovedTile } from "../../Core/BoardLogic";
import { MoveResult } from "../../Core/GameModel";
import { SpecialTileType } from "../../Core/TileModel";
import { BoardView } from "../BoardView";
import { TopHudView } from "../HUD/TopHudView";

const { ccclass, property } = cc._decorator;

export type ScoreFlyPrefixTweenBuilder = (tween: cc.Tween, tile: cc.Node) => void;

@ccclass
export class ScoreController extends cc.Component {

    @property(TopHudView)
    private topHudView: TopHudView | null = null;

    @property(cc.Node)
    private animationLayer: cc.Node | null = null;

    @property
    private flyDuration: number = 0.28;

    @property
    private collapseDuration: number = 0.1;

    @property
    private flyRotation: number = 360;


    private boardView!: BoardView;

    private score: number = 0;
    private visualScore: number = 0;
    private expectedFlightCount: number = 0;

    protected onLoad(): void {
          if (this.topHudView === null)
            cc.error("ScoreController: topHudView in not assigned");

        if (this.animationLayer === null)
            cc.error("ScoreController: animationLayer in not assigned");
    }

    public Init(boardView:BoardView):void {
        this.boardView = boardView;
    }

    public Reset(): void {
        this.ClearAnimations();

        this.score = 0;
        this.visualScore = 0;
        this.expectedFlightCount = 0;

        this.SetHudScore(this.visualScore);
    }

    private ClearAnimations(): void {
        const children = this.animationLayer.children.slice();

        for (let i = 0; i < children.length; i++) {
            cc.Tween.stopAllByTarget(children[i]);
        }

        this.animationLayer.destroyAllChildren();
    }

    public GetAnimationLayer(): cc.Node
    {
        return this.animationLayer;
    }

    public BeginMove(moveResult: MoveResult): void {
        if (!moveResult.success) {
            return;
        }

        this.score = moveResult.totalScore;
        this.expectedFlightCount += this.CountMoveScoreFlights(moveResult);
    }

    public AddInstant(value:number):void {
        this.visualScore += value;
        this.SetHudScore(this.visualScore);
        this.PlayHudPunchAnimation();
    }

    public PlayScoreFlyAnimation(removed: RemovedTile, onComplete?: () => void): void {
        this.PlayCustomStartScoreFlyAnimation(removed, null, onComplete);
    }

    public PlayScoreFlyAnimations(removedTiles: RemovedTile[], onComplete?: () => void): void {
        if (removedTiles.length <= 0) {
            this.CallComplete(onComplete);
            return;
        }

        let completedCount = 0;

        const completeTile = () => {
            completedCount++;

            if (completedCount >= removedTiles.length) {
                this.CallComplete(onComplete);
            }
        };

        for (let i = 0; i < removedTiles.length; i++) {
            this.PlayScoreFlyAnimation(removedTiles[i], completeTile);
        }
    }

    public PlayCustomStartScoreFlyAnimation(removed: RemovedTile, createPrefixTween: ScoreFlyPrefixTweenBuilder | null, onComplete?: () => void): void {
        if (removed.specialType !== SpecialTileType.None) {
            cc.warn("ScoreController: score fly requested for special tile. Tile id: " + removed.tileId);
            this.CallComplete(onComplete);
            return;
        }

        const tileView = this.boardView.GetTileViewById(removed.tileId);

        if (tileView === null || tileView.node === null || !cc.isValid(tileView.node)) {
            cc.warn(
                "ScoreController: missing tile view for score fly. Tile id: " +
                removed.tileId
            );
            this.CompleteScoreFlightWithoutNode(removed, onComplete);
            return;
        }

        const clone = this.CreateClone(tileView.node, this.animationLayer);

        if (clone === null) {
            cc.warn("ScoreController: failed to create score fly clone. Tile id: " + removed.tileId);
            this.boardView.RemoveTileViewById(removed.tileId);
            this.CompleteScoreFlightWithoutNode(removed, onComplete);
            return;
        }

        this.boardView.RemoveTileViewById(removed.tileId);

        const tween = this.CreatePrefixTween(clone, createPrefixTween);
        this.AppendScoreFlyTail(tween, clone, removed, onComplete);
    }

    public GetExpectedFlightCount(): number {
        return this.expectedFlightCount;
    }

    public IsIdle(): boolean {
        return this.expectedFlightCount <= 0;
    }

    private CreatePrefixTween(clone: cc.Node, buildPrefixTween: ScoreFlyPrefixTweenBuilder | null): any {
        if (buildPrefixTween === null) {
            return cc.tween(clone);
        }

        const tween = cc.tween(clone);
        buildPrefixTween(tween, clone);
        
        return tween;
    }

    private AppendScoreFlyTail(tween: any, clone: cc.Node, removed: RemovedTile, onComplete?: () => void): void {
        const targetPosition = this.GetScoreTargetPositionForNode(clone);

        tween
            .to(this.flyDuration, {
                x: targetPosition.x,
                y: targetPosition.y,
                angle: clone.angle + this.flyRotation,
            }, {
                easing: "linear",
            })
            .call(() => {
                this.CompleteScoreFlight(removed);
            })
            .to(this.collapseDuration, {
                scale: 0,
                opacity: 0,
            }, {
                easing: "quadIn",
            })
            .call(() => {
                clone.destroy();
                this.CallComplete(onComplete);
            })
            .start();
    }

    private CompleteScoreFlight(removed: RemovedTile): void {
        this.visualScore += removed.score;
        this.SetHudScore(this.visualScore);
        this.PlayHudPunchAnimation();

        this.expectedFlightCount--;

        if (this.expectedFlightCount < 0) {
            cc.warn("ScoreFlyAnimationController: expected flight count became negative.");
            this.expectedFlightCount = 0;
        }

        if (this.expectedFlightCount === 0) { //Тут мы восстановим состояние из логики и сверим с состоянием вижуала
            this.SetHudScore(this.score);
            this.visualScore = this.score;
            this.ValidateScore();
        }
    }

    private CompleteScoreFlightWithoutNode(removed: RemovedTile, onComplete?: () => void): void {
        this.CompleteScoreFlight(removed);
        this.CallComplete(onComplete);
    }

    private ValidateScore(): void {
        if (this.visualScore === this.score) {
            return;
        }

        cc.error("ScoreController: invalid score state. " + "Visual score: " + this.visualScore + ", expected flight count: " + this.expectedFlightCount + ", target score: " + this.score);
    }

    private CountMoveScore(moveResult: MoveResult): number {
        let count = 0;

        for (let i = 0; i < moveResult.turns.length; i++) {
            const turn = moveResult.turns[i];
            for (let j = 0; j < turn.removedTiles.length; j++) {
                count += turn.removedTiles[j].score;
            }
        }

        return count; 
    }

    private CountMoveScoreFlights(moveResult: MoveResult): number {
        let count = 0;

        for (let i = 0; i < moveResult.turns.length; i++) {
            const turn = moveResult.turns[i];
            for (let j = 0; j < turn.removedTiles.length; j++) {
                const removed = turn.removedTiles[j];

                if (removed.specialType === SpecialTileType.None) {
                    count++;
                }
            }
        }

        return count;
    }

    private CreateClone(sourceNode: cc.Node, layer: cc.Node): cc.Node | null {
        if (sourceNode.parent === null) {
            return null;
        }

        const clone = cc.instantiate(sourceNode);
        layer.addChild(clone);

        const worldPosition = sourceNode.parent.convertToWorldSpaceAR(sourceNode.position);
        const localPosition = layer.convertToNodeSpaceAR(worldPosition);

        clone.setPosition(localPosition);

        return clone;
    }

    private GetScoreTargetPositionForNode(node: cc.Node): cc.Vec2 {
        if (node.parent === null) {
            return cc.v2(node.x, node.y);
        }

        const scoreTarget = this.topHudView.GetScoreTarget();

        if (scoreTarget === null || scoreTarget.parent === null) {
            cc.warn("ScoreController: score fly target is not available.");
            return cc.v2(node.x, node.y);
        }

        const worldPosition = scoreTarget.parent.convertToWorldSpaceAR(scoreTarget.position);
        const localPosition = node.parent.convertToNodeSpaceAR(worldPosition);

        return cc.v2(localPosition.x, localPosition.y);
    }

    private SetHudScore(score: number): void {
        const hudAsAny = this.topHudView as any;

          if (typeof hudAsAny.SetVisualScore === "function") {
            hudAsAny.SetVisualScore(score);
            return;
        }

        this.topHudView.SetScore(score);
    }

    private PlayHudPunchAnimation(): void {
        const hudAsAny = this.topHudView as any;

        if (typeof hudAsAny.PlayScorePunchAnimation === "function") {
            hudAsAny.PlayScorePunchAnimation();
            return;
        }

        const scoreTarget = this.topHudView.GetScoreTarget();

        cc.Tween.stopAllByTarget(scoreTarget);
        scoreTarget.scale = 1;

        cc.tween(scoreTarget)
            .to(0.08, { scale: 1.18 }, { easing: "quadOut" })
            .to(0.12, { scale: 1 }, { easing: "quadIn" })
            .start();
    }

    private CallComplete(onComplete?: () => void): void {
        if (onComplete !== undefined) {
            onComplete();
        }
    }
}
