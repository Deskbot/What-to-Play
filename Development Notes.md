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
