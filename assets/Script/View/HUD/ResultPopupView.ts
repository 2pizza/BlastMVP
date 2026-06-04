const { ccclass, property } = cc._decorator;

@ccclass
export class ResultPopupView extends cc.Component {
    @property(cc.Node)
    private overlayNode: cc.Node = null;

    @property(cc.Node)
    private windowNode: cc.Node = null;

    @property(cc.Label)
    private titleLabel: cc.Label = null;

    @property(cc.Label)
    private messageLabel: cc.Label = null;

    @property(cc.Button)
    private restartButton: cc.Button = null;

    @property(cc.Button)
    private exitButton: cc.Button = null;

    @property
    private overlayOpacity: number = 150;

    private restartCallback: () => void = null;
    private exitCallback: () => void = null;

    protected onLoad(): void {
        if (this.restartButton !== null) {
            this.restartButton.node.on(cc.Node.EventType.TOUCH_END, this.OnRestartClicked, this);
        }

        if (this.exitButton !== null) {
            this.exitButton.node.on(cc.Node.EventType.TOUCH_END, this.OnExitClicked, this);
        }

        cc.view.on("canvas-resize", this.ResizeOverlay, this);
    }

    public Init(onRestart: () => void, onExit: () => void): void {
        this.restartCallback = onRestart;
        this.exitCallback = onExit;
        this.ResizeOverlay();
    }

    public ShowVictory(): void {
        this.Show("Победа!", "Уровень пройден");
    }

    public ShowDefeat(message: string): void {
        this.Show("Поражение", message);
    }

    public Hide(): void {
        this.node.active = false;
    }

    private Show(title: string, message: string): void {
        this.ResizeOverlay();

        if (this.titleLabel !== null) {
            this.titleLabel.string = title;
        }

        if (this.messageLabel !== null) {
            this.messageLabel.string = message;
        }

        this.node.active = true;

        if (this.overlayNode !== null) {
            this.overlayNode.opacity = 0;

            cc.tween(this.overlayNode)
                .to(0.12, {
                    opacity: this.overlayOpacity,
                })
                .start();
        }

        if (this.windowNode !== null) {
            this.windowNode.opacity = 0;
            this.windowNode.scale = 0.9;

            cc.tween(this.windowNode)
                .to(0.12, {
                    opacity: 255,
                    scale: 1,
                })
                .start();
        }
    }

    private ResizeOverlay(): void {
        if (this.overlayNode === null) {
            return;
        }

        const visibleSize = cc.view.getVisibleSize();

        this.overlayNode.width = visibleSize.width;
        this.overlayNode.height = visibleSize.height;
        this.overlayNode.setPosition(0, 0);
    }

    private OnRestartClicked(): void {
        if (this.restartCallback === null) {
            return;
        }

        this.restartCallback();
    }

    private OnExitClicked(): void {
        if (this.exitCallback === null) {
            return;
        }

        this.exitCallback();
    }
}