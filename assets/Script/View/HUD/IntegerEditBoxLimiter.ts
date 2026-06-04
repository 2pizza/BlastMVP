const { ccclass, property } = cc._decorator;

@ccclass
export class IntegerEditBoxLimiter extends cc.Component {
    @property(cc.EditBox)
    private editBox: cc.EditBox = null;

    @property
    private minValue: number = 0;

    @property
    private maxValue: number = 9999;

    @property
    private defaultValue: number = 0;

    protected onLoad(): void {
        if (this.editBox === null) {
            this.editBox = this.getComponent(cc.EditBox);
        }

        if (this.editBox === null) {
            cc.warn("IntegerEditBoxLimiter: editBox is not assigned");
            return;
        }

        this.editBox.node.on("editing-did-ended", this.OnEditingEnded, this);
        this.editBox.node.on("text-changed", this.OnTextChanged, this);

        this.ApplyFinalValue();
    }

    private OnTextChanged(): void {
        if (this.editBox === null) {
            return;
        }

        const filtered = this.FilterDigits(this.editBox.string);

        if (this.editBox.string !== filtered) {
            this.editBox.string = filtered;
        }
    }

    private OnEditingEnded(): void {
        this.ApplyFinalValue();
    }

    private ApplyFinalValue(): void {
        if (this.editBox === null) {
            return;
        }

        const filtered = this.FilterDigits(this.editBox.string);
        const parsedValue = parseInt(filtered, 10);
        const value = isNaN(parsedValue)
            ? this.defaultValue
            : parsedValue;

        this.editBox.string = this.Clamp(value, this.minValue, this.maxValue).toString();
    }

    private FilterDigits(value: string): string {
        if (value === null || value === undefined) {
            return "";
        }

        return value.replace(/[^0-9]/g, "");
    }

    private Clamp(value: number, min: number, max: number): number {
        if (value < min) {
            return min;
        }

        if (value > max) {
            return max;
        }

        return value;
    }
}