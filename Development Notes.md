An alternative way to get Steam review data is using this api call: https://store.steampowered.com/broadcast/ajaxgetbatchappcapsuleinfo?appids=${appId}

Unfortunately it only contains total review numbers and not recent reviews.

This is probably a quicker way of getting data because Steam probably queries less data and it's slower to parse HTML and use Cheerio than JSON.

---
