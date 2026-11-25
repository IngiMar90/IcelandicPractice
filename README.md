# Íslenskuæfingar

Myndrænt æfingaforrit fyrir stafsetningu, orðaforða og málfræði.

[Opna íslenskuæfingarnar](https://ingimar90.github.io/IcelandicPractice/)

- 12 myndræn verkefni á þremur færnistigum.
- **Stig 1:** andheiti, samheiti og eintala/fleirtala (létti spurningabankinn).
- **Stig 2:** orð og skýring, kyn, orðflokkar og tíð (miðlungsbankinn).
- **Stig 3:** i/í/y/ý, ei/ey, ng/nk, einfaldur/tvöfaldur samhljóði og föll (erfiði bankinn).
- Metin lota er alltaf 10 spurningar. Nemandi þarf þrjár 100% réttar lotur í röð í **hverju** verkefni til að klára það. Öll verkefni stigs þurfa að vera kláruð áður en næsta stig opnast.
- Mistök núllstilla röðina í viðkomandi ókláruðu verkefni strax, líka ef nemandi lokar svo lotunni. Önnur verkefni halda sinni framvindu.
- Áunnin verkefni og stig haldast opin. Hægt er að fara aftur og æfa.
- Framvinda er aðskilin eftir nemendum og vistast í sama vafra á sama tæki. Æfing án nafns opnar ekki næstu stig.
- Eldri lotur, met og markmið varðveitast. Þau reiknast ekki afturvirkt inn í nýju færniskilyrðin. Stigaframvinda vistast í `mastery_v1` innan fyrirliggjandi gagnasafns.
- Kennarasvæði sýnir stigaframvindu allra 12 verkefnanna ásamt fyrri niðurstöðum, markmiðum og CSV-útflutningi.
- Leiðbeiningar, sýnidæmi og valfrjáls íslenskur upplestur þegar rödd er tiltæk í vafranum.
- Virkar án nets eftir fyrstu skyndiminnisvistun. Myndir og letur þurfa engar ytri þjónustur.

## Keyra og prófa

Engin bygging eða uppsetning pakka er nauðsynleg til að keyra forritið:

```sh
python -m http.server 8000
```

Opnið `http://localhost:8000`. Sjálfvirkar prófanir á öllum 36 spurningabönkunum og stigaframvindu:

```sh
npm test
```

Reglur um stig og árangursraðir eru í `progression.js`. Spurningagerð er í `questions.js`, myndir og lýsingar verkefna í `exercises.js`, efni í `data.json` og viðmót í `app.js` og `styles.css`.

Við uppfærslu á birtu efni þarf að breyta `CACHE_NAME` í `sw.js` svo tæki sæki nýju útgáfuna. Fyrirliggjandi gögn nota áfram lykilinn `islenska_aefing_pwa_v2`. Rétt svör á mínútu í kennarayfirliti miðast við heildartíma lotunnar, þar með talinn lestur endurgjafar; hraði er ekki sýndur nemandanum.
