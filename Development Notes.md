An alternative way to get Steam review data is using this api call: https://store.steampowered.com/broadcast/ajaxgetbatchappcapsuleinfo?appids=${appId}

Unfortunately it only contains total review numbers and not recent reviews.

This is probably a quicker way of getting data because Steam probably queries less data and it's slower to parse HTML and use Cheerio than JSON.

---

Metacritic platform number (data-mcadvval)
Matacritic platform name

72496
PlayStation 4

1
PlayStation 3

80000
Xbox One

2
Xbox 360

3
PC

4
DS

16
3DS

67365
PlayStation Vita

7
PSP

8
Wii

68410
Wii U

268409
Switch

6
PlayStation 2

10
PlayStation

11
Game Boy Advance

9
iPhone/iPad

12
Xbox

13
GameCube

14
Nintendo 64

15
Dreamcast

---

Metacritic score locations

.product_scores
    .main_details
        .metascore_w
            span
                innerText

.product_scores
    .side_details
        .metascore_w
            innerText

---

Metacritic platform names in the urls

playstation-5
playstation-4
playstation-3
playstation-2
playstation
playstation-vita
psp
xbox-series-x
xbox-one
xbox-360
xbox
pc
switch
wii-u
wii
gamecube
nintendo-64
3ds
ds
game-boy-advance
ios
dreamcast

---

The score that GOG shows in the search menu is sometimes missing (0) when there is a score on the product page.

In the case of Cyberpunk 2077, the search menu shows 5 stars but the product page shows <4 stars.

---

How long to beat doesn't have very helpful classes where it displays the timings in the search results.

It uses "--" instead of some text when there is not enough data or the game isn't out.

---

String similarity:

I think Damerau–Levenshtein distance is overkill because all websites except opencritic show nothing if you have letters flipped

Levenshtein distance will probably do. All the other string algorithms I've looked at account for things I don't think we need to consider

The main trouble with matching is when your game's name is a substring of another e.g. Hollow vs Hollow Knight, Dark Souls vs Dark Souls 2. Levenshtein distance will prefer the shorter names.
Steam's search dropdown only loads 5 results.

--

When searching for "Obra din" in steam the dropdown shows "The Return of the Obra Dinn", but the search page shows no results.

---

steam search dropdown and steam search page show completely different results

e.g. search for "the messenger", dropdown : 1st, search page 4th

or better yet try searching for "dark sou", doesn't appear in search page but does with drop down

---

Searching for "Demons Souls" on opencritic results in demons souls being the third one down but it's got a long string at the end "Demon's Souls (2020 Remake)"

---

I will need to do more testing but Giant Bomb seems to have a decent search engine, and it could be used as the input to all the other websites, giving them an accurate title. But they restrict their API usage to 200/hour, which probably also applies to their main site? https://www.giantbomb.com/api/

---

Only steam matches "minimetro" to "mini metro". Not even giant bomb gets it.

---

No site matches "devil may cry 1" to "devil may cry"

---

sample things to check:

obra dinn       -> "return of the obra dinn"
bioshock        -> bioshock remastered
trine 4         -> trine 4 mare prince
minimetro       -> mini metro
devil may cry 1 -> devil may cry
fear            -> FEAR
