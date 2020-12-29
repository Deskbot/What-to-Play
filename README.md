# What-to-Play

This program takes a list of game names and outputs their scores given by various websites and how long it takes to beat the game.

Data is collected from:

* howlongtobeat.com
* gog.com
* metacritic.com
* steampowered.com

The output format is either of:

* [CSV](https://en.wikipedia.org/wiki/Comma-separated_values) (default) (compatible with popular spreadsheet software)
* [JSON](https://en.wikipedia.org/wiki/JSON)

This program can be used:

* on the command line reading from stdin or a file;
* as an npm package.

## Install

Global:

```
sudo npm install --global what-to-play
```

As a dependency:

```
npm install what-to-play
```

Quick and dirty download:

```
git clone https://github.com/Deskbot/What-to-Play --depth 1
npm install
npm run build
```

## Command Line Usage

### Arguments

```
Usage: command (file name)? (argument)*

Format of file/stdin: new-line-separated list of game names

Arguments:
-h | --help      : Print help.
-p | --platforms : A comma separated list of platforms. When the score differs by platform, the best score is chosen (defaults to all platforms).
--json           : Output in JSON format (defaults to CSV).
```

e.g. `what-to-play list_of_games.txt --json --platforms ps5,playstation4,switch,xbox series x,pc`

Platform strings are parsed forgivingly.

### Command

Global:

```
what-to-play ...
```

From dependency / Download and run:

```
npx what-to-play ...
```

From repository:

```
npm run main -- ...
```

## Library Usage

See [src/api.ts] for what exactly is available.

The main functions to look at are in [src/output.ts]. Functions for getting a subset of the output data are exposed under namespaces in [src/api.ts].

In terms of API stability. You can trust exports from [src/output.ts] to be less likely to change than other exports, but I'll try to keep to semantic versioning.

## Output

The default format is [CSV](https://en.wikipedia.org/wiki/Comma-separated_values).

The scores are reported the same as on the website the score came from, they are not normalised to be out of the same possible maximum.

The CSV columns and JSON fields are pretty self-explanatory and may change over time, so they are not specified here.

The output includes the title of the game as interpreted by each website. You should check this to be sure that the information you're seeing is actually for the given game.

For various reasons, a game or score might not be found from the website. As a CSV, this leaves an empty field. In JSON, the field is not present.

### Understanding the Numbers

Number                 | Maximum | Unit  | Measure of
-----------------------|---------|-------|------------
GOG rating             |   5     |       | Mean user-submitted rating
Metacritic Metascore   | 100     |       | Game Critic review scores put through some formula
Metacritic user score  |  10     |       | Presumably the mean user-submitted rating
Steam rating           | 100     | %     | Percent of users who gave a positive review
Aggregate Score        | 100     |       | Average of all other score fields, normalised to be out of 100. Each present score is weighted equally.
How Long to Beat times |  ∞      | hours | Time

### Format Differences

The JSON output has fields for hyperlinks to where the data came from. In the CSV output, these urls are encoded as hyperlinks in the cell containing the related data.

The hyperlinks are encoded as `=HYPERLINK("url","label")`, which is a valid formula with the same behaviour across Libre Office Calc, Google Sheets, and Microsoft Office Excel, and probably several others.
