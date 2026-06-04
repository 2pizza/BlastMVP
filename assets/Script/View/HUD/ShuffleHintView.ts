const { ccclass, property } = cc._decorator;

@ccclass
export class ShuffleHintView extends cc.Component {
    @property
    private showDuration: number = 0.45;

    protected onLoad(): void {
        this.node.active = false;
    }

    public PlayOnce(onComplete: () => void): void {
        this.node.active = true;
        this.node.opacity = 0;
        this.node.scale = 0.9;

        cc.tween(this.node)
            .to(0.12, {
                opacity: 255,
                scale: 1,
            })
            .delay(this.showDuration)
            .to(0.12, {
                opacity: 0,
                scale: 0.95,
            })
            .call(() => {
                this.node.active = false;

                if (onComplete !== null) {
                    onComplete();
                }
            })
            .start();
    }
}