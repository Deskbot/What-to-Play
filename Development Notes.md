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

Searching for "Demon's Souls" on metacritic only shows the right game if you include the apostraphe.

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

---

Searching on metacritic using https://www.metacritic.com/autosearch (typing into the search box to get a dropdown) is unreliable. It 504s too often.

---

Quality of latest set of matches

Steam tends to give overly long names to game. I don't know a way to get a smaller number out of it.

@ could be fixed with LCS, with something else to choose between games that have the same lcs e.g. hob: "hob (2017)" vs "xenophobe"
    Downside: this breaks initialism titles like "F.E.A.R."
@@ could be fixed by preferring the beginning of the string
@@@ filter out steam dlc
@@@@ levenshtein with non [a-z0-9] chars removed
@@@@@ special case with hltb to remove year

Yonder
steam: @@@ I could filter out dlc (on steam) (but maybe you want to search for dlc)
metacritic: @@ I could have picked closest leven where the string started with the right thing

minimetro
metacritic: can't handle lack of space
gog: can't handle lack of space

luna nights
metacritic: has bad data
hltb: @ I could change best match algorithm with something that prefers "touhou luna nights" over "luna knights", however "touhou nights" matches correctly

fallout new vegas ultimate edition
steam: bad search engine, also full search page gets it wrong

the room
gog: matches game with "the room" as a substring, doesn't have "the room"

journey
ditto

fallout
steam: gets fallout 4 because fallout 1 is called "Fallout: A Post Nuclear Role Playing Game" ahahahah

nioh
ditto but "Nioh: Complete Edition / 仁王 Complete Edition" is longer than "Nioh 2 – The Complete Edition"

mega man x
ditto

Trine 4
gog: finds "Phantom Doctrine", which is fair I suppose

fear
gog: @@@@ "fear equation" actually wanted "f.e.a.r. platinum" could have achieved this by doing the levenshtein distance of the strings with all non [a-z0-9] characters removed, which would give both "fear equation" and "f.e.a.r. platinum" a distance of 9. But "f.e.a.r. platinum was higher up" therefore it would have been picked.

ghost runner
steam: doesn't find "ghostrunner" because it needs the lack of a space, therefore for steam only. If I remove all spaces from the input, it becomes very flaky

e.g. "wayofthepassive" -> "way of the passive fist", but
     "wayofthepassivef" -> nothing
     "wayofthepassivefist" -> nothing

I don't think there's a way to correct the user input here without relying on a better search engine from a different website. But also there is an ios game called "ghost runner", which is what metacritic finds, so probably can't do anything here. A user will see that it didn't get the result and check for themself then adjust their input/output probably.

hob
hltb: @@ @@@@@ xenophobe, another that could be fixed by preferring ones that start with the string

the last door
steam: @@@ The Last Door Season 2 Soundtrack, another case of dlc

NORTH
hltb: 0°N 0°W (due to the levenshtein function for treating capitals different to lower case)

---

after fixing case issue

NORTH
hltb: @@ matches "bad north" instead of "north (2016)", could be a case of preferring matches at the beginning,
      @@@@@  or I could remove ([0-9]{4}) from the end of titles on hltb, because it likes to add years to remove ambiguity
        e.g. it would be good if "doom" matched "doom (2016)" or "doom (1993)" instead of "doom 3"

devil may cry 3
metacritic: matches "devil may cry 4" instead of "devil may cry 3: some subtitle/special edition"
    @ @@ a case of preferring the beginning of the game, or... longest common substring,
        I should probably compare LCS to the current output and check for differences in results. I suspect that anything spelled wrong isn't going to appear anyway. levenshtein has the advantage of working better with typos

---

after implementing LCS followed by Levenshtein

@@@@@@ fixable with making steam redirect dlc to the main game

mega man x
steam: @@@@@@ gets 'Mega Man X Sound Collection' instead of 'Mega Man X Legacy Collection'

---

original rate limit code (10 every 20 s)

real    9m32.632s
user    2m47.898s
sys     0m3.124s

sequential

about 6min 30s?

max concurrent 2

real    3m15.412s
user    0m52.083s
sys     0m1.985s

max concurrent 3

real    2m29.719s
user    0m51.939s
sys     0m2.123s

max concurrent 4

real    2m39.156s
user    0m50.329s
sys     0m2.231s

// are the websites rate-limiting me? :O

max concurrent 5

real    2m20.290s
user    0m49.617s
sys     0m2.098s

max concurrent 6

real    2m21.036s
user    0m50.178s
sys     0m1.948s

max concurrent 7

metacritic failed with timeout

real    2m56.593s
user    0m50.791s
sys     0m1.970s

---

no open critic, it's search feature is too bad, and it's needed because the urls contain an "appid" specific to the website
