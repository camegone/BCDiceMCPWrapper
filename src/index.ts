#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DynamicLoader, UserDefinedDiceTable } from "bcdice";
import { MCP_SERVER_VERSION, BCDICE_VERSION, COMMON_DICE_COMMANDS } from "./constants.js";

// initialize BCDice
const loader = new DynamicLoader();
const gameSystems = loader.listAvailableGameSystems();

// initialize MCP server
const server = new McpServer(
    {
        name: "bcdicemcpwrapper",
        version: MCP_SERVER_VERSION,
        description: "A wrapper MCP server of BCDice which is a famous dice bot used in various TRPGs in Japan. Capable of rolling dice (e.g. '1d100', '2d6+4') and getting information of game systems.",
    }
);

// register tools
server.registerTool(
    "getDiceBotVersion",
    {
        description: "Get the version of BCDice.",
        inputSchema: z.object({}),
    },
    () => {
        return {
            content: [
                {
                    type: "text" as const,
                    text: `BCDice version: ${ BCDICE_VERSION }`,
                },
            ],
        };
    }
);

server.registerTool(
    "getMCPServerVersion",
    {
        description: "Get the version of this MCP server.",
        inputSchema: z.object({}),
    },
    () => {
        return {
            content: [
                {
                    type: "text" as const,
                    text: `MCP server version: ${MCP_SERVER_VERSION}`,
                },
            ],
        };
    }
);

server.registerTool(
    "getGameSystemsList",
    {
        description: "Get a list of all supported game systems.",
        inputSchema: z.object({}),
    },
    () => {
        const list = gameSystems.map((system) => ({
            type: "text" as const,
            text: JSON.stringify(system),
        }));
        return { content: list };
    }
);

server.registerTool(
    "rollDice",
    {
        description: "Roll a dice with a specified system",
        inputSchema: {
            system: z
                .string()
                .default("DiceBot")
                .describe("The system name which can be obtained via getGameSystemsList e.g. 'DiceBot', 'Cthulhu', or 'Cthulhu7th'"),
            diceCommand: z
                .string()
                .describe(`The dice expression e.g. '1d100', '3d6', '2d6+4'. You must see system-specific dice command from getDescription(system) once.\nCommon dice commands:\n${COMMON_DICE_COMMANDS}`),
        },
    },
    async (args) => {
        try {
            const gameSystem = await loader.dynamicLoad(args.system);

            if (!gameSystem) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text" as const,
                            text: `Game system "${args.system}" not found.`,
                        },
                    ],
                };
            }

            const result = gameSystem.eval(args.diceCommand);

            if (!result) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text" as const,
                            text: `Dice command "${args.diceCommand}" returned no result for game system "${args.system}". Available dice commands:
${gameSystem.HELP_MESSAGE}`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text" as const,
                        text: result.text,
                    },
                ],
            };
        } catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text" as const,
                        text: `Error executing dice roll: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
);

server.registerTool(
    "getDescription",
    {
        description: "Get the description of a game system.",
        inputSchema: {
            system: z
                .string()
                .default("DiceBot")
                .describe("The system name which can be obtained via getGameSystemsList e.g. 'DiceBot', 'Cthulhu', or 'Cthulhu7th'"),
        },
    },
    async (args) => {
        try {
            const gameSystem = await loader.dynamicLoad(args.system);

            if (!gameSystem) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text" as const,
                            text: `Game system "${args.system}" not found.`,
                        },
                    ],
                };
            }

            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Game system "${args.system}" help message:\n${gameSystem.HELP_MESSAGE}`,
                    },
                    {
                        type: "text" as const,
                        text: `Game system "${args.system}" command pattern (regex):\n${gameSystem.COMMAND_PATTERN.source}`,
                    },
                ],
            };
        } catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text" as const,
                        text: `Error getting game system description: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
);

server.registerTool(
    "rollUserDefinedTable",
    {
        description: `Roll a userdefined table such as:
        テスト表
        1D6
        1:いち
        2:に
        3:さん
        4:し
        5:ご
        6:ろく
        `,
        inputSchema: {
            tableText: z
                .string()
                .describe("The userdefined table to roll. See the example above."),
        },
    },
    async (args) => {
        try {
            const userDefinedTable = new UserDefinedDiceTable(args.tableText);
            const result = userDefinedTable.roll();
            if (!result) {
                return {
                    isError: true,
                    content: [
                        {
                            type: "text" as const,
                            text: `Userdefined table "${args.tableText}" returned no result.`,
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: "text" as const,
                        text: result.text,
                    },
                ],
            };
        } catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text" as const,
                        text: `Error rolling userdefined table: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
);

// start server
const transport = new StdioServerTransport();
await server.connect(transport);
