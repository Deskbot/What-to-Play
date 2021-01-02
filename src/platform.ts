const mappingInput = [
    [/^(ps|playstation).*5$/i, "playstation-5"],
    [/^(ps|playstation).*4$/i, "playstation-4"],
    [/^(ps|playstation).*3$/i, "playstation-3"],
    [/^(ps|playstation).*2$/i, "playstation-2"],
    [/^(ps|playstation).*1?$/i, "playstation"],
    [/^(ps|playstation).*v(ita)?$/i, "playstation-vita"],
    [/^(ps|playstation).*(p|portable)$/i, "psp"],
    [/^xbox.*series.*$/i, "xbox-series-x"],
    [/^xbox.*(one|1)$/i, "xbox-one"],
    [/^xbox.*360$/i, "xbox-360"],
    [/^xbox$/i, "xbox"],
    [/^pc|windows|mac|linux|desktop$/i, "pc"],
    [/^(nintendo.*)?switch$/i, "switch"],
    [/^(nintendo.*)?wii.*u$/i, "wii-u"],
    [/^(nintendo.*)?wii$/i, "wii"],
    [/^(nintendo.*)?gamecube$/i, "gamecube"],
    [/^n(intendo)?.*64$/i, "nintendo-64"],
    [/^(nintendo.*)?3ds$/i, "3ds"],
    [/^(nintendo.*)?ds.*$/i, "ds"],
    [/^(nintendo.*)?(game.*boy.*advance|gba)$/i, "game-boy-advance"],
    [/^ios|android|mobile|(smart)?phone|tablet$/i, "ios"],
    [/^(sega.*)?dreamcast$/i, "dreamcast"],
] as const;

export type MetacriticPlatform = typeof mappingInput[number][1];

const platformMapping: ReadonlyMap<RegExp, MetacriticPlatform> = new Map(mappingInput);

export function getPlatforms(): IterableIterator<MetacriticPlatform> {
    return platformMapping.values();
}

export class PlatformParseError extends Error {
    constructor(input: unknown) {
        const message = [
            `Could not parse platform: "${input}"`,
            "It should be similar to one of:",
            ...getPlatforms()
        ]
        .join("\n");

        super(message);
    }
}

/**
 * @throws PlatformParseError
 */
export function parsePlatforms(str: string): MetacriticPlatform[] {
    const result = [] as MetacriticPlatform[];

    for (let input of str.split(",")) {
        input = input.trim();

        if (input.length === 0) continue;

        const maybePlatform = toPlatform(input);
        if (maybePlatform) {
            result.push(maybePlatform);
        } else {
            throw new PlatformParseError(input);
        }
    }

    return result;
}

export function toPlatform(str: string): MetacriticPlatform | undefined {
    for (const [pattern, platform] of platformMapping) {
        if (str.match(pattern)) {
            return platform;
        }
    }

    return undefined;
}
