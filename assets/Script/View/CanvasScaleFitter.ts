const { ccclass, property } = cc._decorator;

@ccclass
export class CanvasScaleFitter extends cc.Component {
    @property(cc.Node)
    private targetRoot: cc.Node | null = null;

    @property
    private designWidth: number = 1080;

    @property
    private designHeight: number = 1920;

    @property
    private fitOnLoad: boolean = true;

    @property
    private allowUpscale: boolean = true;

    @property
    private offsetX: number = 0;

    @property
    private offsetY: number = 0;

    protected onLoad(): void {
        if (this.fitOnLoad) {
            this.ApplyScale();
        }
    }

    protected onEnable(): void {
        cc.view.on("canvas-resize", this.ApplyScale, this);
    }

    protected onDisable(): void {
        cc.view.off("canvas-resize", this.ApplyScale, this);
    }

    public ApplyScale(): void {
        if (this.targetRoot === null) {
            cc.error("CanvasScaleFitter: targetRoot is not assigned");
            return;
        }

        const visibleSize = cc.view.getVisibleSize();

        const scaleX = visibleSize.width / this.designWidth;
        const scaleY = visibleSize.height / this.designHeight;

        let targetScale = Math.min(scaleX, scaleY);

        if (!this.allowUpscale) {
            targetScale = Math.min(1, targetScale);
        }

        this.targetRoot.scale = targetScale;
        this.targetRoot.setPosition(this.offsetX, this.offsetY);
    }
}