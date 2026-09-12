#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DynamicLoader , Version } from "bcdice";

// initialize BCDice
const loader = new DynamicLoader();
const gameSystems = loader.listAvailableGameSystems();

// initialize MCP server
const server = new McpServer(
    {
        name: "bcdicemcpwrapper",
        version: "0.0.0",
        description: "A wrapper MCP server of BCDice which is a famous dice bot used in various TRPGs in Japan.",
    }
);

// register tools
server.registerTool(
    "getVersion",
    {
        description: "Get the version of BCDice.",
        inputSchema: z.object({}),
    },
    () => {
        return {
            content: [
                {
                    type: "text" as const,
                    text: `BCDice version: ${ Version }`,
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
                .default("Dicebot")
                .describe("The system name which can be obtained via getGameSystemsList e.g. 'Dicebot', 'Cthulhu', or 'Cthulhu7th'"),
            diceCommand: z
                .string()
                .describe("The dice expression e.g. '1d100', '3d6', '2d6+4'"),
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
                            text: `Dice command "${args.diceCommand}" returned no result for game system "${args.system}".`,
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

// start server
const transport = new StdioServerTransport();
await server.connect(transport);
