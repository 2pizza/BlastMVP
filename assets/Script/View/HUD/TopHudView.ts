const { ccclass, property } = cc._decorator;

@ccclass
export class TopHudView extends cc.Component {
    @property(cc.Label)
    private movesLabel: cc.Label = null;

    @property(cc.Label)
    private scoreLabel: cc.Label = null;

    private movesLeft: number = 0;
    private score: number = 0;
    private targetScore: number = 0;

    protected onLoad(): void {
        this.RefreshAll();
    }

    public SetMovesLeft(value: number): void {
        this.movesLeft = Math.max(0, value);
        this.RefreshMoves();
    }

    public SetScore(value: number): void {
        this.score = Math.max(0, value);
        this.RefreshScore();
    }

    public SetTargetScore(value: number): void {
        this.targetScore = Math.max(0, value);
        this.RefreshScore();
    }

    private RefreshAll(): void {
        this.RefreshMoves();
        this.RefreshScore();
    }

    private RefreshMoves(): void {
        if (this.movesLabel === null) {
            return;
        }

        this.movesLabel.string = this.movesLeft.toString();
    }

    private RefreshScore(): void {
        if (this.scoreLabel === null) {
            return;
        }

        this.scoreLabel.string = this.score.toString() + "/" + this.targetScore.toString();
    }
}