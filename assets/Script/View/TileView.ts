const { ccclass, property } = cc._decorator;

@ccclass
export class TileView extends cc.Component {
    @property(cc.Node)
    private visualNode: cc.Node = null;

    @property(cc.Sprite)
    private sprite: cc.Sprite = null;

    private tileId: number = -1;
    private colorId: number = -1;
    private boardX: number = 0;
    private boardY: number = 0;

    private tapCallback: (x: number, y: number) => void = null;

    private selectionTween: cc.Tween = null;
    private failTween: cc.Tween = null;
    private basePosition: cc.Vec2 = null;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.OnTouchEnd, this);
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_END, this.OnTouchEnd, this);
    }

    public Init(tileId: number,colorId: number, boardX: number, boardY: number, spriteFrame: cc.SpriteFrame, tapCallback: (x: number, y: number) => void): void {
        this.tileId = tileId;
        this.colorId = colorId;
        this.boardX = boardX;
        this.boardY = boardY;
        this.tapCallback = tapCallback;

        if (this.visualNode === null) {
            this.visualNode = this.node.getChildByName("Visual");
        }

        if (this.sprite === null && this.visualNode !== null) {
            this.sprite = this.visualNode.getComponent(cc.Sprite);
        }

        if (this.sprite === null) {
            cc.error("TileView: Sprite component is not found");
            return;
        }

        this.sprite.spriteFrame = spriteFrame;
    }

    public SetBoardPosition(boardX: number, boardY: number): void {
        this.boardX = boardX;
        this.boardY = boardY;
    }

    public SetLogicalSize(width: number, height: number): void {
        this.node.width = width;
        this.node.height = height;
    }

    public SetVisualSize(width: number, height: number, offsetX: number, offsetY: number): void {
        if (this.visualNode === null) {
            this.visualNode = this.node.getChildByName("Visual");
        }

        if (this.visualNode === null) {
            cc.error("TileView: Visual node is not found");
            return;
        }

        this.visualNode.width = width;
        this.visualNode.height = height;
        this.visualNode.setPosition(offsetX, offsetY);
    }

    public GetTileId(): number {
        return this.tileId;
    }

    public GetColorId(): number {
        return this.colorId;
    }

    public SetSelected(value: boolean): void {
        if (value) {
            this.PlaySelectionAnimation();
            return;
        }

        this.StopAllAnimation();
    }

    private PlaySelectionAnimation(): void {
        this.StopAllAnimation();

        this.basePosition = this.visualNode.getPosition();

        this.selectionTween = cc.tween(this.visualNode)
            .repeatForever(
                cc.tween()
                    .by(0.04, { x: 2 })
                    .by(0.04, { x: -4 })
                    .by(0.04, { x: 2 })
                    .delay(0.12)
            )
            .start();
    }

    public PlayFailedMove(): void {
        this.StopAllAnimation();

        this.basePosition = this.visualNode.getPosition();

        this.failTween = cc.tween(this.visualNode)
        .by(0.035, { x: -6, skewX: -4 })
        .by(0.035, { x: 12, skewX: 8 })
        .by(0.035, { x: -10, skewX: -7 })
        .by(0.035, { x: 8, skewX: 5 })
        .by(0.035, { x: -4, skewX: -2 })
        .to(0.025, { skewX: 0 })
        .start();
    }

    private StopAllAnimation(): void {
        if (this.selectionTween !== null) {
            this.selectionTween.stop();
            this.selectionTween = null;
        }

        if (this.failTween !== null) {
            this.failTween.stop();
            this.failTween = null;
        }

        if (this.basePosition !== null) {
            this.visualNode.setPosition(this.basePosition);
            this.basePosition = null;
        }

        this.visualNode.skewX = 0;
    }

    private OnTouchEnd(): void {
        if (this.tapCallback === null) {
            return;
        }

        this.tapCallback(this.boardX, this.boardY);
    }
}