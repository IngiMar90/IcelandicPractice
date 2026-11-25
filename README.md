# Íslenskuæfingar

Myndrænt æfingaforrit fyrir stafsetningu, orðaforða og málfræði.

[Opna íslenskuæfingarnar](https://ingimar90.github.io/IcelandicPractice/)

- 12 verkefnaspjöld með eigin skýringarmyndum.
- Þrjú erfiðleikastig og 5, 10, 15 eða 20 spurningar í lotu.
- Leiðbeiningar og sýnidæmi áður en æfing hefst.
- Nemandinn velur sjálfur „Næsta“ eftir endurgjöf.
- Valfrjáls upplestur á leiðbeiningum, spurningum og svarmöguleikum þegar íslensk rödd er tiltæk í vafranum.
- Hægt að æfa án nafns. Nafngreindar lotur og fyrri framvinda vistast áfram í sama vafra á sama tæki.
- Kennarasvæði með niðurstöðum, markmiðum og CSV-útflutningi.
- Virkar án nettengingar eftir fyrstu opnun og skyndiminnisvistun.
- Engin ytri mynda- eða leturþjónusta; myndirnar eru innbyggðar SVG-teikningar.

## Keyra og prófa

Engin bygging eða uppsetning pakka er nauðsynleg til að keyra forritið:

```sh
python -m http.server 8000
```

Opnið `http://localhost:8000`. Sjálfvirkar prófanir á öllum 36 spurningabönkunum:

```sh
npm test
```

Spurningagerð er í `questions.js`, myndir og lýsingar verkefna í `exercises.js`, efni í `data.json` og viðmót í `app.js` og `styles.css`.

Við uppfærslu á birtu efni þarf að breyta `CACHE_NAME` í `sw.js` svo tæki sæki nýju útgáfuna. Fyrirliggjandi gögn nota áfram lykilinn `islenska_aefing_pwa_v2`. Rétt svör á mínútu í kennarayfirliti miðast við heildartíma lotunnar, þar með talinn lestur endurgjafar; hraði er ekki sýndur nemandanum.
