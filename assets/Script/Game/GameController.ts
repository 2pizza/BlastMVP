import { GameModel, GameConfig, GameState, MoveResult } from "../Core/GameModel";
import { BoardView } from "../View/BoardView";
import { TopHudView } from "../View/HUD/TopHudView";
import { ResultPopupView } from "../View/HUD/ResultPopupView";
import { ShuffleHintView } from "../View/HUD/ShuffleHintView";
import { BoosterButtonView } from "../View/HUD/BoosterButtonView";
import { LevelRuntimeConfig, LevelRuntimeConfigStore } from "../Core/LevelRuntimeConfig";

enum BoosterInputMode {
    None = 0,
    BombSelectCell = 1,
    SwapSelectFirstCell = 2,
    SwapSelectSecondCell = 3,
}


const { ccclass, property } = cc._decorator;

@ccclass
export class GameController extends cc.Component {
    @property(BoardView)
    private boardView: BoardView = null;

    @property(TopHudView)
    private topHudView: TopHudView = null;

    @property(ResultPopupView)
    private resultPopupView: ResultPopupView = null;

    @property(ShuffleHintView)
    private shuffleHintView: ShuffleHintView = null;

    @property(BoosterButtonView)
    private bombBoosterButtonView: BoosterButtonView = null;

    @property(BoosterButtonView)
    private swapBoosterButtonView: BoosterButtonView = null;

    @property(cc.Node)
    private inputRoot: cc.Node = null;

    @property
    private width: number = 8;

    @property
    private height: number = 8;

    @property
    private colorCount: number = 5;

    @property
    private targetScore: number = 100;

    @property
    private moveLimit: number = 25;

    @property
    private minGroupSize: number = 2;

    @property
    private shuffleAttemptLimit: number = 3;

    @property
    private bombBoosterCount: number = 3;

    @property
    private swapBoosterCount: number = 3;

    @property
    private mainSceneName: string = "MainScene";

    private currentLevelConfig: LevelRuntimeConfig = null;

    private game: GameModel = null;
    private inputLocked: boolean = false;

    private currentBombBoosterCount: number = 0;
    private currentSwapBoosterCount: number = 0;

    private boosterInputMode: BoosterInputMode = BoosterInputMode.None;

    private swapFirstX: number = -1;
    private swapFirstY: number = -1;

    protected override onLoad(): void {
        if (this.inputRoot !== null) {
            this.inputRoot.on(cc.Node.EventType.TOUCH_END, this.OnGlobalTouchEnd, this, true);
        }
    }

    protected override start(): void {
        this.StartGameSession();
    }

    private StartGameSession(): void {
        this.currentLevelConfig = LevelRuntimeConfigStore.GetConfig(this.CreateDefaultLevelConfig());

        this.currentBombBoosterCount = this.currentLevelConfig.bombBoosterCount;
        this.currentSwapBoosterCount = this.currentLevelConfig.swapBoosterCount;

        this.CreateGame();
        this.UpdateBoostersHud();
    }

    private CreateDefaultLevelConfig(): LevelRuntimeConfig {
        return {
            width: this.width,
            height: this.height,
            colorCount: this.colorCount,
            targetScore: this.targetScore,
            moveLimit: this.moveLimit,
            minGroupSize: this.minGroupSize,
            shuffleAttemptLimit: this.shuffleAttemptLimit,
            bombBoosterCount: this.bombBoosterCount,
            swapBoosterCount: this.swapBoosterCount,
        };
    }

    private OnGlobalTouchEnd(event: cc.Event.EventTouch): void {
        if (this.boosterInputMode === BoosterInputMode.None) {
            return;
        }

        if (this.inputLocked) {
            return;
        }

        if (this.boardView === null) {
            return;
        }

        const worldPosition = event.getLocation();
        const cell = this.boardView.TryGetCellFromWorldPosition(worldPosition);

        if (cell.success) {
            return;
        }

        //При активном бустере input вне поля воспринимается как сброс состояния - отменяем дальнеуюшую обработку и сбрасываем выбранный бустер
        event.stopPropagation();
        this.ResetBoosterSelection();
    }

    private CreateGame(): void {
        if (this.boardView === null) {
            cc.error("GameController: boardView is not assigned");
            return;
        }

        if (this.currentLevelConfig === null) {
            this.currentLevelConfig = this.CreateDefaultLevelConfig();
        }

        const config: GameConfig = {
            width: this.currentLevelConfig.width,
            height: this.currentLevelConfig.height,
            colorCount: this.currentLevelConfig.colorCount,
            targetScore: this.currentLevelConfig.targetScore,
            moveLimit: this.currentLevelConfig.moveLimit,
            minGroupSize: this.currentLevelConfig.minGroupSize,
        };

        this.game = new GameModel(config);

        if (this.resultPopupView !== null) {
            this.resultPopupView.Init(
                this.RestartGame.bind(this),
                this.ExitToMainScene.bind(this)
            );

            this.resultPopupView.Hide();
        }

        this.boardView.Init(
            this.game.board,
            this.OnTileTap.bind(this)
        );

        this.UpdateHud();

        if (this.game.GetState() !== GameState.Playing) {
            this.HandleGameState(this.game.GetState());
            return;
        }

        this.inputLocked = true;
        this.ResolveNoAvailableMoves(0, true);
    }

    public SelectBombBooster(): void {
        if (!this.CanStartBoosterSelection()) {
            return;
        }

        if (this.currentBombBoosterCount <= 0) {
            return;
        }

        this.ResetBoosterSelection();

        this.boosterInputMode = BoosterInputMode.BombSelectCell;

        if (this.bombBoosterButtonView !== null) {
            this.bombBoosterButtonView.SetSelected(true);
        }
    }

    public SelectSwapBooster(): void {
        if (!this.CanStartBoosterSelection()) {
            return;
        }

        if (this.currentSwapBoosterCount <= 0) {
            return;
        }

        this.ResetBoosterSelection();

        this.boosterInputMode = BoosterInputMode.SwapSelectFirstCell;
        this.swapFirstX = -1;
        this.swapFirstY = -1;

        if (this.swapBoosterButtonView !== null) {
            this.swapBoosterButtonView.SetSelected(true);
        }
    }

    private CanStartBoosterSelection(): boolean {
        if (this.inputLocked) {
            return false;
        }

        if (this.game === null) {
            return false;
        }

        if (this.game.IsGameOver()) {
            return false;
        }

        return true;
    }

    private OnTileTap(x: number, y: number): void {
        if (this.inputLocked) {
            return;
        }

        if (this.game === null) {
            return;
        }

        if (this.game.IsGameOver()) {
            return;
        }

        if (this.boosterInputMode !== BoosterInputMode.None) {
            this.HandleBoosterTileTap(x, y);
            return;
        }

        this.TryMakeNormalMove(x, y);
    }

    private TryMakeNormalMove(x:number, y:number) {
        const result = this.game.TryMakeMove(x, y);

        if (!result.success) {
            this.HandleFailedMove(result);
            return;
        }

        this.inputLocked = true;

        this.boardView.PlayMoveResult(result, () => {
            this.OnBoardAnimationComplete(result);
        });
    }

    private HandleBoosterTileTap(x: number, y: number): void {
        if (this.game === null) {
            this.ResetBoosterSelection();
            return;
        }

        if (this.boosterInputMode === BoosterInputMode.BombSelectCell) {
            this.UseBombBooster(x, y);
            return;
        }

        if (this.boosterInputMode === BoosterInputMode.SwapSelectFirstCell) {
            this.swapFirstX = x;
            this.swapFirstY = y;
            this.boosterInputMode = BoosterInputMode.SwapSelectSecondCell;
            this.boardView.SetTileSelected(x, y, true);

            cc.log("Swap first cell:", x, y);
            return;
        }

        if (this.boosterInputMode === BoosterInputMode.SwapSelectSecondCell) {
            if (x === this.swapFirstX && y === this.swapFirstY) {
                this.boardView.SetTileSelected(x, y, false);
                this.boosterInputMode = BoosterInputMode.SwapSelectFirstCell;
                this.swapFirstX = -1;
                this.swapFirstY = -1;
                return;
            }

            this.UseSwapBooster(this.swapFirstX, this.swapFirstY, x, y);
        }
    }

    private ResetBoosterSelection(): void {
        this.boosterInputMode = BoosterInputMode.None;

        this.swapFirstX = -1;
        this.swapFirstY = -1;

        if (this.boardView !== null) {
            this.boardView.ClearTileSelection();
        }

        if (this.bombBoosterButtonView !== null) {
            this.bombBoosterButtonView.SetSelected(false);
        }

        if (this.swapBoosterButtonView !== null) {
            this.swapBoosterButtonView.SetSelected(false);
        }
    }

    private UseBombBooster(x: number, y: number): void {
        if (this.game === null) {
            this.ResetBoosterSelection();
            return;
        }

        this.ResetBoosterSelection();

        const result = this.game.TryUseBombBooster(x, y);

        if (!result.success) {
            this.HandleFailedMove(result);
            return;
        }

        this.inputLocked = true;

        this.currentBombBoosterCount--;
        this.UpdateBoostersHud();

        this.boardView.PlayMoveResult(result, () => {
            this.OnBoardAnimationComplete(result);
        });
    }

    private UseSwapBooster(
        firstX: number,
        firstY: number,
        secondX: number,
        secondY: number
    ): void {
        if (this.game === null) {
            this.ResetBoosterSelection();
            return;
        }

        this.ResetBoosterSelection();

        const result = this.game.TryUseSwapBooster(
            firstX,
            firstY,
            secondX,
            secondY
        );

        if (!result.success) {
            this.HandleFailedMove(result);
            return;
        }

        this.inputLocked = true;

        this.currentSwapBoosterCount--;
        this.UpdateBoostersHud();

        this.boardView.PlayMoveResult(result, () => {
            this.OnBoardAnimationComplete(result);
        });
    }

    public RestartGame(): void {
        if (this.game === null) {
            this.CreateGame();
            return;
        }

        this.inputLocked = true;

        if (this.resultPopupView !== null) {
            this.resultPopupView.Hide();
        }

        this.game.Restart();

        this.boardView.RefreshInstant(this.game.board);

        this.UpdateHud();

        if (this.game.GetState() !== GameState.Playing) {
            this.HandleGameState(this.game.GetState());
            return;
        }

        this.ResolveNoAvailableMoves(0);
    }

    private ExitToMainScene(): void {
        cc.director.loadScene(this.mainSceneName);
    }

    private OnBoardAnimationComplete(result: MoveResult): void {
        this.UpdateHud();

        if (result.state !== GameState.Playing) {
            this.inputLocked = true;
            this.HandleGameState(result.state);
            return;
        }

        this.ResolveNoAvailableMoves(0);
    }

    private ResolveNoAvailableMoves(attempt: number, initial: boolean = false): void {
        if (this.game === null) {
            return;
        }

        if (this.game.HasAvailableMoves()) {
            this.inputLocked = false;
            return;
        }

        if (attempt >= this.currentLevelConfig.shuffleAttemptLimit) {
            this.inputLocked = true;
            this.game.MarkDefeatNoAvailableGroups();
            this.HandleGameState(this.game.GetState());
            return;
        }

        if (!initial && attempt === 0 && this.shuffleHintView !== null) {
            this.shuffleHintView.PlayOnce(() => {
                this.PlayShuffleAttempt(attempt);
            });

            return;
        }

        this.PlayShuffleAttempt(attempt);
    }

    private PlayShuffleAttempt(attempt: number): void {
        if (this.game === null) {
            return;
        }

        const shuffleResult = this.game.TryShuffle();

        this.boardView.PlayMoveResult(shuffleResult, () => {
            this.ResolveNoAvailableMoves(attempt + 1);
        });
}

    private HandleFailedMove(result: MoveResult): void {
        // Пока ничего критичного не делаем.
        // Позже здесь можно добавить shake тайла, звук ошибки или подсказку.

        cc.log("Move failed:", result.failReason);
    }

    private HandleGameState(state: GameState): void {
        if (state === GameState.Playing) {
            return;
        }

        this.inputLocked = true;

        if (state === GameState.Victory) {
            this.OnVictory();
            return;
        }

        if (state === GameState.DefeatNoMovesLeft) {
            this.OnDefeatNoMovesLeft();
            return;
        }

        if (state === GameState.DefeatNoAvailableGroups) {
            this.OnDefeatNoAvailableGroups();
            return;
        }
    }

    private OnVictory(): void {
        cc.log("Victory");

        if (this.resultPopupView !== null) {
            this.resultPopupView.ShowVictory();
        }
    }

    private OnDefeatNoMovesLeft(): void {
        cc.log("Defeat: no moves left");

        if (this.resultPopupView !== null) {
            this.resultPopupView.ShowDefeat("Закончились ходы");
        }
    }

    private OnDefeatNoAvailableGroups(): void {
        cc.log("Defeat: no available groups");

        if (this.resultPopupView !== null) {
            this.resultPopupView.ShowDefeat("Нет доступных ходов");
        }
    }

    private UpdateHud(): void {
        if (this.game === null) {
            return;
        }

        if (this.topHudView === null) {
            cc.warn("GameController: topHudView is not assigned");
            return;
        }

        this.topHudView.SetMovesLeft(this.game.GetMovesLeft());
        this.topHudView.SetTargetScore(this.currentLevelConfig.targetScore);
    }

    private UpdateBoostersHud(): void {
        this.bombBoosterButtonView.SetCount(this.currentBombBoosterCount);
        this.swapBoosterButtonView.SetCount(this.currentSwapBoosterCount);
    }
    
}
