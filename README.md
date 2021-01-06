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

Download without installing:

```
git clone https://github.com/Deskbot/What-to-Play --depth 1
cd What-to-Play
npm install
npm run build
```

## Command Line Usage

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

### Arguments

```
Usage: command (file path)? (arguments)*

If a file is given, the file will be used as input, otherwise stdin is used.

Input format: game titles on separate lines

Arguments:
-h | --help      : Print help.
--readme         : Print the readme.
-p | --platforms : A comma separated list of platforms. On Metacritic where the score differs by platform, the best score is chosen. (default: all platforms)
-c | --country   : A 2-character country code, used by Steam to tailor results. (default: US)
--json           : Output in JSON format (instead of CSV).
--rate-limit     : Set the maximum number of games that can be queried simultaneously. If set too high, queries will be rejected by the websites queried. (defaults to 5)
```

e.g. `what-to-play list_of_games.txt --json --platforms ps5,playstation4,switch,xbox series x,pc`

Platform strings are parsed forgivingly.

## Library Usage

See `src/api.ts` for what exactly is available.

The main functions to look at are in `src/output.ts`. Functions for getting a subset of the output data are exposed under namespaces in `src/api.ts`.

In terms of API stability. You can trust exports from `src/output.ts` to be less likely to change than other exports, but I'll try to keep to semantic versioning.

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
Aggregate score        | 100     |       | Mean of all other score fields, each normalised to be out of 100. Each score is weighted equally. If the score isn't present, it doesn't contribute to the average.
How Long to Beat times |   ∞     | hours | Time

The aggregate score exists so that there will be a score column filled in for every row for ease of sorting. However, doing this will skew games that exist on Steam further to the top because Steam's review system means it yields scores closer to 100.

### Shortcomings

Games with similar names could be confused for one another. An effort has been made to choose the best search result offered by each website, which is more accurate than taking the top result.

The game found by each website is included in the output so you know whether the score displayed is for the game you're looking for.

### Format Differences

The JSON output has fields for hyperlinks to where the data came from. In the CSV output, these urls are encoded as hyperlinks in the cell containing the related data.

The hyperlinks are encoded as `=HYPERLINK("url","label")`, which is a valid formula with the same behaviour across Libre Office Calc, Google Sheets, and Microsoft Office Excel, and probably several others.

## Rate Limiting

Your requests are rate limited to prevent the websites rejecting you and causing a timeout.

## Privacy

Be aware that by running the software, you may be subject to aspects of the privacy policies of the websites visited. The websites that could be visited are listed above.

This program does not send any cookies to those sites and scripts on the queried web pages are never executed. So it is not the same as if you were to visit these sites manually.

## License

The license is a slightly modified version of the MIT license to require that you to provide a notice about privacy like the one above.
