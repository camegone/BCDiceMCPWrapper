[日本語版はこちら](./README_ja.md)

# BCDice MCP Server Wrapper

## Overview

This is an **MCP (Model Context Protocol) server** wrapper for **BCDice**. BCDice is a popular tabletop role-playing game (TRPG) dice bot in Japan, supporting **over 100 different game systems**. 

With this MCP server, LLMs can not only execute standard dice roll commands (**1d100**, **2d6**, etc.), but also retrieve game system help messages, command syntax patterns, and execute game-specific resolution mechanics.

## Features

- **Supports all BCDice game systems** (e.g., Call of Cthulhu, Emoklore TRPG, and many others).
- Retrieve **system-specific dice commands and rules**.
- Inspect **regex patterns** used for command parsing.
- Access **full BCDice capabilities**, from standard dice rolls to complex game-specific tables and custom user-defined tables.

## Installation

**Node.js** and **npm** are required as prerequisites.

### Using npx

Add the following configuration to your MCP-compatible client settings:

```json
{
  "mcpServers": {
    "bcdice": {
      "command": "npx",
      "args": [
        "-y",
        "@camegone/bcdice-mcp"
      ]
    }
  }
}
```

### Installing from Repository

Clone the repository or download and extract the ZIP file:

```bash
git clone https://github.com/camegone/BCDiceMCPWrapper.git
```

Then, add the following to your MCP client configuration file. **Make sure to replace `<YOUR_INSTALL_PATH>` with the actual path where this repository is located.**

```json
{
  "mcpServers": {
    "bcdice": {
      "command": "node",
      "args": [
        "<YOUR_INSTALL_PATH>/BCDiceMCPWrapper/build/index.js"
      ]
    }
  }
}
```

## Available Tools

This server provides the following tools:

### 1. `rollDice`
Executes a dice roll according to the rules of the specified game system. In addition to standard dice (`1d100`, `2d6+4`, etc.), system-specific check commands (such as Call of Cthulhu's `CC<=50`) are fully supported.
- **Arguments**:
  - `diceCommand` (string, **required**): The dice command expression to execute (e.g., `'1d100'`, `'3d6'`, `'2d6+4'`, `'CC<=50'`).
  - `system` (string, optional, default: `'DiceBot'`): Target game system name (retrievable via `getGameSystemsList`, e.g., `'Cthulhu'`, `'Cthulhu7th'`, `'DiceBot'`).
- **Returns**:
  - Dice roll result text (success/failure judgment, individual dice rolls, etc.). Returns the system help message if the command is invalid.
---
### 2. `getDescription`
Retrieves the help message (available commands and resolution explanations) and command regular expression patterns for the specified game system.
- **Arguments**:
  - `system` (string, optional, default: `'DiceBot'`): Game system name to get descriptions for.
- **Returns**:
  - System help message (command specifications and formats)
  - Regular expression patterns for command matching
---
### 3. `getGameSystemsList`
Retrieves a list of all game systems available in BCDice.
- **Arguments**: None
- **Returns**:
  - A metadata list (JSON format) containing system IDs, display names, etc.
---
### 4. `rollUserDefinedTable`
Rolls on a user-defined custom table defined in plain text format.
- **Arguments**:
  - `tableText` (string, **required**): Table definition text containing table title, dice expression, and mapped outcomes.
    ```text
    Table Title
    1D6
    1:One
    2:Two
    3:Three
    4:Four
    5:Five
    6:Six
    ```
- **Returns**:
  - Result text from rolling on the custom table.
---
### 5. `getDiceBotVersion`
Retrieves the version of the underlying BCDice library.
- **Arguments**: None
- **Returns**:
  - BCDice version string (e.g., `BCDice version: 4.10.0`).
---
### 6. `getMCPServerVersion`
Retrieves the version of this MCP server.
- **Arguments**: None
- **Returns**:
  - MCP server version string (e.g., `MCP server version: 1.0.1`).

## Example Usage (Chat Log)

**User**: I'd like to test the BCDice MCP server. Let's execute rolls step by step. The system is Call of Cthulhu 6th Edition.

**AI**: I have checked the command specifications for Call of Cthulhu 6th Edition in BCDice. The check command format is `CC<=skill_value` (using the 1% critical/fumble rules).

Shall we start with ability score generation, or would you like to test skill checks (`CC`) first? For instance, a STR check is rolled as `CC<=STR`. Let me know what you'd like to roll. For now, shall we do a test roll with `1d100`, which is commonly used for Sanity checks?

**User**: Let's do a test roll of 1d100 first.

**AI**: The result of rolling 1d100 was **27**.

Let's move on to the next step. As typical in CoC 6th Edition, would you like to roll ability scores (3d6, 2d6+6, etc.), skill checks (`CC<=skill_value`), or a SAN check next?

**User**: An enemy is attacking. Let's decide who gets targeted. The party has five members: Ichiro through Goro.

**AI**: The enemy's attack target was determined to be **Goro**.

Next, shall we proceed with Goro's Dodge check (e.g., `CC<=DEX*5`) or the damage roll?

**User**: Let's roll Dodge.

**AI**: Please tell me Goro's Dodge skill value (DEX × 5, or the modified value if developed). Once you share it, I will roll `CC<=skill_value`.

**User**: DEX is 9.

**AI**: Goro's Dodge check: `29 <= 45 -> Success`. The attack was successfully dodged!

What would you like to do next? (Enemy's follow-up attack, damage roll, another check, etc.)

**User**: Next is Ichiro's turn. Rolling Fist. Skill value is 50, base damage is 1d3, and damage bonus is 1d4.

**AI**: Ichiro's Brawl check: `56 > 50 -> Failure`. The punch swung through the air and missed.

What would you like to do next? (Enemy's turn, another character's action, etc.)

**User**: Let's stop here. That was a great test. Thank you!

**AI**: You're very welcome! The BCDice MCP server handled Call of Cthulhu 6th Edition checks and dice expressions smoothly. Feel free to reach out anytime you want to play again. Have a great session!
