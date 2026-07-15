// LOTE GRANDE — 42 modelos individuales (+ parejas de 2).
// verticales: cara | medio | cuerpo | pareja
// Poses variadas a propósito: nada de 42 personas mirando de frente igual.
export const BATCH = [
  // ─── BAILARINES · cara (encuadre VALIDADO) ─────────────────────────
  { id: "bail-cara-alba",    vertical: "cara", r2: "dance", desc: "a 26 year old Spanish woman dancer with dark hair in a sleek bun, chin lifted in a proud confident pose, wearing a black halter dance top" },
  { id: "bail-cara-tobias",  vertical: "cara", r2: "dance", desc: "a 31 year old Black man dancer with short dreadlocks, head turned in three-quarter profile looking off camera, wearing a fitted white tank top" },
  { id: "bail-cara-yuki",    vertical: "cara", r2: "dance", desc: "a 23 year old East Asian woman dancer with a short bob and blunt fringe, cool intense stare, wearing a cropped bomber jacket" },
  { id: "bail-cara-mateo",   vertical: "cara", r2: "dance", desc: "a 27 year old Latino man dancer with a fade haircut and light stubble, warm open smile, wearing a burgundy silk shirt" },

  // ─── BAILARINES · medio cuerpo ─────────────────────────────────────
  { id: "bail-medio-fatou",  vertical: "medio", r2: "dance", desc: "a 30 year old African woman dancer with long box braids, arms crossed confidently, wearing a vibrant orange dance top" },
  { id: "bail-medio-viktor", vertical: "medio", r2: "dance", desc: "a 34 year old white man dancer with athletic build and short hair, arms folded, serious expression, wearing a black fitted t-shirt" },
  { id: "bail-medio-priya",  vertical: "medio", r2: "dance", desc: "a 28 year old South Asian woman dancer with long black hair, one hand on hip and the other arm raised in a dance line, wearing a golden crop top" },
  { id: "bail-medio-hugo",   vertical: "medio", r2: "dance", desc: "a 44 year old Latino man dancer with grey-flecked temples, hands on hips, commanding presence, wearing a black shirt open at the collar" },

  // ─── BAILARINES · cuerpo completo ──────────────────────────────────
  { id: "bail-cuerpo-noa",    vertical: "cuerpo", r2: "dance", desc: "a 25 year old Mediterranean woman dancer with curly hair, mid dance move with one leg extended and arms sweeping, wearing a flowing red dress and dance heels" },
  { id: "bail-cuerpo-daniel", vertical: "cuerpo", r2: "dance", desc: "a 29 year old East Asian man dancer in a dynamic freeze pose leaning back, wearing black streetwear and sneakers" },
  { id: "bail-cuerpo-camila", vertical: "cuerpo", r2: "dance", desc: "a 32 year old Afro-Latina woman dancer with an afro, powerful wide stance with both arms out, wearing a blue fringe salsa dress and dance heels" },
  { id: "bail-cuerpo-luca",   vertical: "cuerpo", r2: "dance", desc: "a 24 year old Italian man dancer holding an elegant extended line, wearing black trousers and an open white shirt" },

  // ─── DJ · cara ─────────────────────────────────────────────────────
  { id: "dj-cara-nina",  vertical: "cara", r2: "dj", desc: "a 27 year old white woman DJ with platinum blonde hair and headphones resting around her neck, cool detached expression" },
  { id: "dj-cara-omar",  vertical: "cara", r2: "dj", desc: "a 33 year old Middle Eastern man DJ with a beard and a cap worn backwards, headphones around his neck, confident smirk" },
  { id: "dj-cara-keiko", vertical: "cara", r2: "dj", desc: "a 25 year old East Asian woman DJ with pink-streaked hair, large headphones on her ears, eyes closed feeling the music" },

  // ─── DJ · medio cuerpo ─────────────────────────────────────────────
  { id: "dj-medio-marcus", vertical: "medio", r2: "dj", desc: "a 38 year old Black man DJ with a shaved head and beard, arms crossed, wearing an oversized black hoodie with headphones around his neck" },
  { id: "dj-medio-elena",  vertical: "medio", r2: "dj", desc: "a 29 year old Latina woman DJ with long dark hair, one arm raised pointing up in a crowd-hyping gesture, wearing a neon crop top" },
  { id: "dj-medio-lars",   vertical: "medio", r2: "dj", desc: "a 45 year old white man DJ with a grey buzz cut and glasses, hands on hips, wearing a technical black jacket" },

  // ─── DJ · cuerpo completo ──────────────────────────────────────────
  { id: "dj-cuerpo-zara",  vertical: "cuerpo", r2: "dj", desc: "a 26 year old mixed-race woman DJ standing confidently with legs apart and arms crossed, wearing techwear and chunky sneakers" },
  { id: "dj-cuerpo-tariq", vertical: "cuerpo", r2: "dj", desc: "a 31 year old Black man DJ leaning back with one arm raised, wearing a colourful windbreaker and sneakers" },

  // ─── PROFES DE BAILE · medio cuerpo ────────────────────────────────
  { id: "profe-medio-rosa", vertical: "medio", r2: "profes", desc: "a 41 year old Latina dance teacher with her hair in a ponytail, warm welcoming open-arm gesture, wearing a fitted black dance top" },
  { id: "profe-medio-jean", vertical: "medio", r2: "profes", desc: "a 36 year old Black male dance teacher, one hand gesturing as if explaining a step, warm smile, wearing a burgundy fitted shirt" },
  { id: "profe-medio-inma", vertical: "medio", r2: "profes", desc: "a 52 year old Spanish woman dance teacher with silver-streaked hair, arms crossed with a kind confident smile, wearing an elegant black wrap top" },

  // ─── PROFES DE BAILE · cuerpo completo ─────────────────────────────
  { id: "profe-cuerpo-carlos", vertical: "cuerpo", r2: "profes", desc: "a 48 year old Latino dance teacher with salt-and-pepper hair demonstrating a salsa step with arms in dance frame, wearing black trousers and a fitted shirt" },
  { id: "profe-cuerpo-aisha",  vertical: "cuerpo", r2: "profes", desc: "a 35 year old Black woman dance teacher with braids demonstrating a strong dance stance, wearing leggings, a crop top and sneakers" },
  { id: "profe-cuerpo-pablo",  vertical: "cuerpo", r2: "profes", desc: "a 29 year old Spanish man dance teacher mid demonstration with one arm extended, wearing joggers and a tank top" },

  // ─── CANTANTES · medio (micro = patrón VALIDADO) ───────────────────
  { id: "cant-medio-lucia", vertical: "medio", r2: "cantantes", desc: "a 27 year old Latina singer with long wavy hair singing into a handheld microphone held close to her mouth, eyes closed with emotion, wearing a sequined black dress" },
  { id: "cant-medio-andre", vertical: "medio", r2: "cantantes", desc: "a 36 year old Black man singer with short hair and a beard singing into a handheld microphone, his other hand raised, wearing a white suit jacket" },
  { id: "cant-medio-siri",  vertical: "medio", r2: "cantantes", desc: "a 31 year old Scandinavian woman singer with a blonde bob singing into a handheld microphone, intense expression, wearing a leather jacket" },

  // ─── CANTANTES · cuerpo completo ───────────────────────────────────
  { id: "cant-cuerpo-rocio", vertical: "cuerpo", r2: "cantantes", desc: "a 30 year old Spanish woman singer with long dark hair standing and singing into a handheld microphone with one arm extended, wearing a long red gown and heels" },
  { id: "cant-cuerpo-kwame", vertical: "cuerpo", r2: "cantantes", desc: "a 34 year old Black man singer standing and singing into a handheld microphone in a dynamic stage stance, wearing a patterned suit and dress shoes" },
  { id: "cant-cuerpo-mina",  vertical: "cuerpo", r2: "cantantes", desc: "a 24 year old East Asian woman singer singing into a handheld microphone with her free arm raised, wearing a metallic mini dress and boots" },

  // ─── MÚSICOS (instrumento = fallo esperado, se prueba igualmente) ───
  { id: "musico-medio-gabriel", vertical: "medio",  r2: "musicos", desc: "a 40 year old Latino male guitarist holding an acoustic guitar, warm expression, wearing a casual denim shirt" },
  { id: "musico-medio-sofia",   vertical: "medio",  r2: "musicos", desc: "a 33 year old white woman violinist holding a violin and bow, elegant expression, wearing a black concert dress" },
  { id: "musico-cuerpo-teo",    vertical: "cuerpo", r2: "musicos", desc: "a 28 year old Black man saxophone player standing and playing a saxophone, wearing a dark suit" },
  { id: "musico-medio-hana",    vertical: "medio",  r2: "musicos", desc: "a 26 year old East Asian woman keyboard player with her hands on a synthesizer, focused expression, wearing an urban jacket" },

  // ─── PAREJAS DE BAILE ──────────────────────────────────────────────
  { id: "pareja-baile-salsa",   vertical: "pareja", r2: "parejas", desc: "a dance couple of exactly two people: a Latino man in his 30s and a Latina woman in her 20s in a close salsa dance hold, he in a black shirt, she in a red dress and heels" },
  { id: "pareja-baile-bachata", vertical: "pareja", r2: "parejas", desc: "a dance couple of exactly two people: a Black woman in her 30s and a white man in his 30s in an elegant bachata pose, she in a blue dress, he in a grey shirt" },
  { id: "pareja-baile-urbano",  vertical: "pareja", r2: "parejas", desc: "a dance duo of exactly two women in their 20s, one East Asian and one Latina, in a dynamic urban dance pose, both in black streetwear and sneakers" },

  // ─── PAREJAS DE MÚSICA (guitarra = fallo esperado) ─────────────────
  { id: "pareja-musica-acustica", vertical: "pareja", r2: "parejas", desc: "a music duo of exactly two people: a woman in her 20s singing into a handheld microphone and a man in his 30s playing an acoustic guitar beside her, both in elegant dark outfits" },
  { id: "pareja-musica-electrica", vertical: "pareja", r2: "parejas", desc: "a music duo of exactly two people: a Black man in his 30s singing into a handheld microphone and a white woman in her 20s playing an electric guitar, urban stage outfits" },
  { id: "pareja-musica-latina",   vertical: "pareja", r2: "parejas", desc: "a music duo of exactly two people: a Latina woman in her 30s singing into a handheld microphone and a Latino man in his 40s playing an acoustic guitar, warm acoustic session look" },
];
