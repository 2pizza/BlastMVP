import { SpecialTileType } from "../TileModel";
import { BombSpecialTileLogic } from "./BombSpecialTileLogic";
import { DynamiteSpecialTileLogic } from "./DynamiteSpecialTileLogic";
import { HorizontalRocketSpecialTileLogic } from "./HorizontalRocketSpecialTileLogic";
import { SpecialTileDescriptor } from "./SpecialTileDescriptor";
import { VerticalRocketSpecialTileLogic } from "./VerticalRocketSpecialTileLogic";

export class SpecialTileRegistry {
    private static descriptors: SpecialTileDescriptor[] = [
        {
            type: SpecialTileType.Bomb,
            minCreatedFromGroupSize: 5,
            createWeight: 100,
            logic: new BombSpecialTileLogic(1),
        },
        {
            type: SpecialTileType.HorizontalRocket,
            minCreatedFromGroupSize: 7,
            createWeight: 50,
            logic: new HorizontalRocketSpecialTileLogic(),
        },
        {
            type: SpecialTileType.VerticalRocket,
            minCreatedFromGroupSize: 7,
            createWeight: 50,
            logic: new VerticalRocketSpecialTileLogic(),
        },
        {
            type: SpecialTileType.Dynamite,
            minCreatedFromGroupSize: 9,
            createWeight: 20,
            logic: new DynamiteSpecialTileLogic(),
        },
    ];

    public static GetDescriptor(type: SpecialTileType): SpecialTileDescriptor | null {
        for (let i = 0; i < this.descriptors.length; i++) {
            if (this.descriptors[i].type === type) {
                return this.descriptors[i];
            }
        }

        return null;
    }

    public static GetCreatableDescriptors(groupSize: number): SpecialTileDescriptor[] {
        const result: SpecialTileDescriptor[] = [];

        for (let i = 0; i < this.descriptors.length; i++) {
            const descriptor = this.descriptors[i];

            if (groupSize >= descriptor.minCreatedFromGroupSize) {
                result.push(descriptor);
            }
        }

        return result;
    }

    public static GetRandomCreatableType(groupSize: number): SpecialTileType {
        const descriptors = this.GetCreatableDescriptors(groupSize);

        if (descriptors.length <= 0) {
            return SpecialTileType.None;
        }

        let bestThreshold = -1;

        for (let i = 0; i < descriptors.length; i++) {
            const descriptor = descriptors[i];

            if (descriptor.minCreatedFromGroupSize > bestThreshold) {
                bestThreshold = descriptor.minCreatedFromGroupSize;
            }
        }

        const bestDescriptors: SpecialTileDescriptor[] = [];

        for (let i = 0; i < descriptors.length; i++) {
            const descriptor = descriptors[i];

            if (descriptor.minCreatedFromGroupSize === bestThreshold) {
                bestDescriptors.push(descriptor);
            }
        }

        let totalWeight = 0;

        for (let i = 0; i < bestDescriptors.length; i++) {
            totalWeight += bestDescriptors[i].createWeight;
        }

        if (totalWeight <= 0) {
            return SpecialTileType.None;
        }

        let roll = Math.random() * totalWeight;

        for (let i = 0; i < bestDescriptors.length; i++) {
            roll -= bestDescriptors[i].createWeight;

            if (roll <= 0) {
                return bestDescriptors[i].type;
            }
        }

        return bestDescriptors[bestDescriptors.length - 1].type;
    }
}
