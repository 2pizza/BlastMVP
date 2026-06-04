import { SpecialTileType } from "../TileModel";
import { SpecialTileLogic } from "./SpecialTileLogic";

export interface SpecialTileDescriptor {
    type: SpecialTileType;
    minCreatedFromGroupSize: number;
    createWeight: number;
    logic: SpecialTileLogic;
}
