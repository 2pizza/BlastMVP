import { LevelRuntimeConfig, LevelRuntimeConfigStore } from "../Core/LevelRuntimeConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export class MainSceneController extends cc.Component {
    @property
    private gameSceneName: string = "GameScene";

    @property
    private minBoardSize: number = 3;

    @property
    private maxBoardSize: number = 9;

    @property
    private defaultBoardWidth: number = 9;

    @property
    private defaultBoardHeight: number = 9;

    @property(cc.Label)
    private widthValueLabel: cc.Label = null;

    @property(cc.Label)
    private heightValueLabel: cc.Label = null;

    @property(cc.Button)
    private widthDecrementButton: cc.Button = null;

    @property(cc.Button)
    private widthIncrementButton: cc.Button = null;

    @property(cc.Button)
    private heightDecrementButton: cc.Button = null;

    @property(cc.Button)
    private heightIncrementButton: cc.Button = null;

    @property(cc.Toggle)
    private colors3Toggle: cc.Toggle = null;

    @property(cc.Toggle)
    private colors4Toggle: cc.Toggle = null;

    @property(cc.Toggle)
    private colors5Toggle: cc.Toggle = null;

    @property(cc.Toggle)
    private groupSize2Toggle: cc.Toggle = null;

    @property(cc.Toggle)
    private groupSize3Toggle: cc.Toggle = null;

    @property(cc.Toggle)
    private groupSize4Toggle: cc.Toggle = null;

    @property(cc.EditBox)
    private targetScoreInput: cc.EditBox = null;

    @property(cc.EditBox)
    private turnsInput: cc.EditBox = null;

    @property(cc.EditBox)
    private shuffleLimitInput: cc.EditBox = null;

    @property(cc.EditBox)
    private swapInput: cc.EditBox = null;

    @property(cc.EditBox)
    private bombInput: cc.EditBox = null;

    @property(cc.Button)
    private playButton: cc.Button = null;

    private boardWidth: number = 9;
    private boardHeight: number = 9;

    protected override onLoad(): void {
        this.InitState();

        this.SubscribeEvents();
        this.RefreshBoardSize();

         cc.director.preloadScene(this.gameSceneName);
    }

    private InitState(): void {
        const config = LevelRuntimeConfigStore.GetConfig(this.CreateDefaultConfig());

        this.boardWidth = this.Clamp(config.width, this.minBoardSize, this.maxBoardSize);
        this.boardHeight = this.Clamp(config.height, this.minBoardSize, this.maxBoardSize);

        this.SetEditBoxValue(this.targetScoreInput, config.targetScore);
        this.SetEditBoxValue(this.turnsInput, config.moveLimit);
        this.SetEditBoxValue(this.shuffleLimitInput, config.shuffleAttemptLimit);
        this.SetEditBoxValue(this.bombInput, config.bombBoosterCount);
        this.SetEditBoxValue(this.swapInput, config.swapBoosterCount);

        this.SetSelectedColorCount(config.colorCount);
        this.SetSelectedMinGroupSize(config.minGroupSize);

        LevelRuntimeConfigStore.SetConfig(config);
    }

    private CreateDefaultConfig(): LevelRuntimeConfig {
        return {
            width: this.Clamp(this.defaultBoardWidth, this.minBoardSize, this.maxBoardSize),
            height: this.Clamp(this.defaultBoardHeight, this.minBoardSize, this.maxBoardSize),
            colorCount: 5,
            targetScore: this.ReadPositiveInt(this.targetScoreInput, 1500),
            moveLimit: this.ReadPositiveInt(this.turnsInput, 25),
            minGroupSize: 2,
            shuffleAttemptLimit: this.ReadNonNegativeInt(this.shuffleLimitInput, 3),
            bombBoosterCount: this.ReadNonNegativeInt(this.bombInput, 0),
            swapBoosterCount: this.ReadNonNegativeInt(this.swapInput, 0),
        };
    }

    private SubscribeEvents(): void {
        this.SubscribeButton(this.widthDecrementButton, this.OnWidthDecrementClicked);
        this.SubscribeButton(this.widthIncrementButton, this.OnWidthIncrementClicked);
        this.SubscribeButton(this.heightDecrementButton, this.OnHeightDecrementClicked);
        this.SubscribeButton(this.heightIncrementButton, this.OnHeightIncrementClicked);
        this.SubscribeButton(this.playButton, this.OnPlayClicked);
    }

    private OnWidthDecrementClicked(): void {
        this.boardWidth = Math.max(this.minBoardSize, this.boardWidth - 1);
        this.RefreshBoardSize();
    }

    private OnWidthIncrementClicked(): void {
        this.boardWidth = Math.min(this.maxBoardSize, this.boardWidth + 1);
        this.RefreshBoardSize();
    }

    private OnHeightDecrementClicked(): void {
        this.boardHeight = Math.max(this.minBoardSize, this.boardHeight - 1);
        this.RefreshBoardSize();
    }

    private OnHeightIncrementClicked(): void {
        this.boardHeight = Math.min(this.maxBoardSize, this.boardHeight + 1);
        this.RefreshBoardSize();
    }

    private OnPlayClicked(): void {
        const config = this.CreateConfig();

        LevelRuntimeConfigStore.SetConfig(config);

        cc.director.loadScene(this.gameSceneName);
    }

    private CreateConfig(): LevelRuntimeConfig {
        return {
            width: this.boardWidth,
            height: this.boardHeight,
            colorCount: this.GetSelectedColorCount(),
            targetScore: this.ReadPositiveInt(this.targetScoreInput, 1500),
            moveLimit: this.ReadPositiveInt(this.turnsInput, 25),
            minGroupSize: this.GetSelectedMinGroupSize(),
            shuffleAttemptLimit: this.ReadNonNegativeInt(this.shuffleLimitInput, 3),
            bombBoosterCount: this.ReadNonNegativeInt(this.bombInput, 0),
            swapBoosterCount: this.ReadNonNegativeInt(this.swapInput, 0),
        };
    }

    private GetSelectedColorCount(): number {
        if (this.colors3Toggle !== null && this.colors3Toggle.isChecked) {
            return 3;
        }

        if (this.colors4Toggle !== null && this.colors4Toggle.isChecked) {
            return 4;
        }

        return 5;
    }

    private GetSelectedMinGroupSize(): number {
        if (this.groupSize2Toggle !== null && this.groupSize2Toggle.isChecked) {
            return 2;
        }

        if (this.groupSize3Toggle !== null && this.groupSize3Toggle.isChecked) {
            return 3;
        }

        return 4;
    }

    private RefreshBoardSize(): void {
        if (this.widthValueLabel !== null) {
            this.widthValueLabel.string = "Ширина: " + this.boardWidth;
        }

        if (this.heightValueLabel !== null) {
            this.heightValueLabel.string = "Высота: " + this.boardHeight;
        }

        this.SetButtonInteractable(this.widthDecrementButton, this.boardWidth > this.minBoardSize);
        this.SetButtonInteractable(this.widthIncrementButton, this.boardWidth < this.maxBoardSize);
        this.SetButtonInteractable(this.heightDecrementButton, this.boardHeight > this.minBoardSize);
        this.SetButtonInteractable(this.heightIncrementButton, this.boardHeight < this.maxBoardSize);
    }

    private SetButtonInteractable(button: cc.Button, interactable: boolean): void {
        if (button === null) {
            return;
        }

        button.interactable = interactable;
    }

    private ReadPositiveInt(input: cc.EditBox, defaultValue: number): number {
        return Math.max(1, this.ReadInt(input, defaultValue));
    }

    private ReadNonNegativeInt(input: cc.EditBox, defaultValue: number): number {
        return Math.max(0, this.ReadInt(input, defaultValue));
    }

    private ReadInt(input: cc.EditBox, defaultValue: number): number {
        if (input === null) {
            return defaultValue;
        }

        const value = parseInt(input.string, 10);

        if (isNaN(value)) {
            return defaultValue;
        }

        return value;
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

    private SubscribeButton(button: cc.Button, callback: () => void): void {
        if (button === null) {
            return;
        }

        button.node.on(cc.Node.EventType.TOUCH_END, callback, this);
    }

    private SetEditBoxValue(input: cc.EditBox, value: number): void {
        if (input === null) {
            return;
        }

        input.string = value.toString();
    }

    private SetSelectedColorCount(colorCount: number): void {
        const value = this.Clamp(colorCount, 3, 5);

        if (this.colors3Toggle !== null) {
            this.colors3Toggle.isChecked = value === 3;
        }

        if (this.colors4Toggle !== null) {
            this.colors4Toggle.isChecked = value === 4;
        }

        if (this.colors5Toggle !== null) {
            this.colors5Toggle.isChecked = value === 5;
        }
    }

    private SetSelectedMinGroupSize(minGroupSize: number): void {
        const value = this.Clamp(minGroupSize, 2, 4);

        if (this.groupSize2Toggle !== null) {
            this.groupSize2Toggle.isChecked = value === 2;
        }

        if (this.groupSize3Toggle !== null) {
            this.groupSize3Toggle.isChecked = value === 3;
        }

        if (this.groupSize4Toggle !== null) {
            this.groupSize4Toggle.isChecked = value === 4;
        }
    }
}