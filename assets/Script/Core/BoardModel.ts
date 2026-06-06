import { TileModel } from "./TileModel";
import { TileGenerator } from "./TileGenerator";

export class BoardModel {
    public readonly width: number;
    public readonly height: number;

    private cells: Array<TileModel | null>;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.cells = new Array<TileModel | null>(width * height);
        this.Clear();
    }

    public Fill(generator: TileGenerator): void {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = generator.CreateTile();
        }
    }

    public Clear(): void {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = null;
        }
    }

    public GetTile(x: number, y: number): TileModel | null {
        if (!this.IsInside(x, y)) {
            return null;
        }

        return this.cells[this.ToIndex(x, y)];
    }

    public SetTile(x: number, y: number, tile: TileModel | null): void {
        if (!this.IsInside(x, y)) {
            return;
        }

        this.cells[this.ToIndex(x, y)] = tile;
    }

    public FindTileById(tileId: number): { tile: TileModel; x: number; y: number } | null {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.GetTile(x, y);

                if (tile === null) {
                    continue;
                }

                if (tile.id === tileId) {
                    return { tile: tile, x: x, y: y };
                }
            }
        }

        return null;
    }

    public IsInside(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    public ToIndex(x: number, y: number): number {
        return y * this.width + x;
    }

    public ToPosition(index: number): { x: number; y: number } {
        const x = index % this.width;
        const y = Math.floor(index / this.width);

        return { x, y };
    }
}