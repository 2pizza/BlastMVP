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
    private basePosition: cc.Vec3 = null;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.OnTouchEnd, this);
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_END, this.OnTouchEnd, this);
    }

    public Init(
        tileId: number,
        colorId: number,
        boardX: number,
        boardY: number,
        spriteFrame: cc.SpriteFrame,
        tapCallback: (x: number, y: number) => void
    ): void {
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

        this.StopSelectionAnimation();
    }

    private PlaySelectionAnimation(): void {
        this.StopSelectionAnimation();

        this.basePosition = this.node.position.clone();

        this.selectionTween = cc.tween(this.node)
            .repeatForever(
                cc.tween()
                    .by(0.04, { x: 2 })
                    .by(0.04, { x: -4 })
                    .by(0.04, { x: 2 })
                    .delay(0.12)
            )
            .start();
    }

    private StopSelectionAnimation(): void {
        if (this.selectionTween !== null) {
            this.selectionTween.stop();
            this.selectionTween = null;
        }

        if (this.basePosition !== null) {
            this.node.position = this.basePosition;
            this.basePosition = null;
        }
    }

    private OnTouchEnd(): void {
        if (this.tapCallback === null) {
            return;
        }

        this.tapCallback(this.boardX, this.boardY);
    }
}