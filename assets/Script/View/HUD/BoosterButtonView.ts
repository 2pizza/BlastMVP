const { ccclass, property } = cc._decorator;

@ccclass
export class BoosterButtonView extends cc.Component {
    @property(cc.Node)
    private visualNode: cc.Node = null;

    @property
    private pressedOffsetY: number = -8;

    @property
    private pressedScale: number = 0.96;

    @property(cc.Label)
    private countLabel: cc.Label = null;

    private isSelected: boolean = false;
    private defaultPosition: cc.Vec3 = null;
    private defaultScale: number = 1;

    protected onLoad(): void {
        if (this.visualNode === null) {
            this.visualNode = this.node;
        }

        this.defaultPosition = this.visualNode.position.clone();
        this.defaultScale = this.visualNode.scale;
    }

    public SetCount(value: number): void {
         if (this.countLabel !== null) {
            this.countLabel.string = value.toString();
        }
    }

    public SetSelected(value: boolean): void {
        if (this.isSelected === value) {
            return;
        }

        this.isSelected = value;

        if (this.visualNode === null) {
            return;
        }

        this.visualNode.stopAllActions();

        if (value) {
            cc.tween(this.visualNode)
                .to(0.08, {
                    y: this.defaultPosition.y + this.pressedOffsetY,
                    scale: this.defaultScale * this.pressedScale,
                })
                .start();

            return;
        }

        cc.tween(this.visualNode)
            .to(0.08, {
                y: this.defaultPosition.y,
                scale: this.defaultScale,
            })
            .start();
    }
}