import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

// Inject fonts
const _fs = document.createElement("style");
_fs.textContent = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,900;1,400&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:6px;background:#0a0e1a;}
::-webkit-scrollbar-thumb{background:#2a3050;border-radius:3px;}
.flip-card{perspective:1000px;cursor:pointer;}
.flip-inner{position:relative;width:100%;height:100%;transition:transform 0.6s;transform-style:preserve-3d;}
.flip-inner.flipped{transform:rotateY(180deg);}
.flip-front,.flip-back{position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:16px;}
.flip-back{transform:rotateY(180deg);}
.mode-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 20px 40px rgba(0,0,0,0.4)!important;}
.mode-card{transition:transform 0.2s, box-shadow 0.2s;}
.tree-item:hover{background:rgba(255,255,255,0.05)!important;}
.quiz-opt:hover{background:rgba(212,164,56,0.15)!important;}
.quiz-opt{transition:background 0.15s;}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeIn 0.3s ease forwards;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
.pulse{animation:pulse 1.5s infinite;}`;
document.head.appendChild(_fs);

// ─── COLORS ───────────────────────────────────────────────────────────────────
const FC = {
  "Indo-European":"#4e91f7","Sino-Tibetan":"#f87171","Afro-Asiatic":"#fbbf24",
  "Niger-Congo":"#34d399","Austronesian":"#a78bfa","Turkic":"#fb923c",
  "Dravidian":"#f472b6","Japonic":"#2dd4bf","Koreanic":"#818cf8",
  "Uralic":"#a3e635","Caucasian":"#e879f9","Austro-Asiatic":"#38bdf8",
  "Kra-Dai":"#86efac","Mongolic":"#fca5a5","Nilo-Saharan":"#c084fc",
  "Khoisan":"#fdba74","Hmongic":"#67e8f9","Papuan":"#d8b4fe",
  "Tungusic":"#fda4af","Creole":"#94a3b8","Pama-Nyungan":"#e2e8f0",
};

// ─── LANGUAGE DATA ─────────────────────────────────────────────────────────────
const LANGS = [
  // Indo-European / Celtic
  {id:"gaelic",name:"Gaelic",f:"Indo-European",sf:"Celtic",spoken:"Scotland, Ireland",wiki:"Scottish_Gaelic",role:"Cultural identity marker in Scotland & Ireland; revitalization efforts ongoing",note:"Celtic language family; tied to Irish nationalism"},
  {id:"welsh",name:"Welsh",f:"Indo-European",sf:"Celtic",spoken:"Wales, England, Chubut (Argentina)",wiki:"Welsh_language",role:"Official language of Wales; symbol of Welsh national identity",note:"Active revival; Welsh-medium education thrives"},
  {id:"cornish",name:"Cornish",f:"Indo-European",sf:"Celtic",spoken:"Cornwall, SW England",wiki:"Cornish_language",role:"Revived extinct language; Cornish ethnic recognition in UK",note:"Linked to campaign for official Cornish ethnic group status"},
  {id:"manx",name:"Manx",f:"Indo-European",sf:"Celtic",spoken:"Isle of Man",wiki:"Manx_language",role:"Cultural symbol of Manx identity",note:"Revived from extinction; last native speaker died 1974"},
  {id:"breton",name:"Breton",f:"Indo-European",sf:"Celtic",spoken:"Brittany, NW France",wiki:"Breton_language",role:"Only Celtic language on European mainland; devolutionary pressure in France",note:"Related to Welsh & Cornish; Breton identity movement"},
  // Indo-European / Germanic
  {id:"german",name:"German",f:"Indo-European",sf:"Germanic",spoken:"Germany, Austria, Switzerland, Belgium, Luxembourg, Liechtenstein",wiki:"German_language",role:"Lingua franca of Central Europe; key EU language",note:"Gutenberg printed first mass Bible in German street vernacular"},
  {id:"high-german",name:"High German",f:"Indo-European",sf:"Germanic",spoken:"S Germany, Switzerland, Austria",wiki:"High_German_languages",role:"Basis of standardized modern German",note:"Spoken in mountainous southern regions; Luther's Bible helped standardize"},
  {id:"bavarian",name:"Bavarian Austrian",f:"Indo-European",sf:"Germanic",spoken:"Bavaria, Austria, N Italy, Switzerland",wiki:"Bavarian_language",role:"Regional dialect with strong cultural identity in Bavaria & Austria",note:"Distinct from standard German; strong local pride"},
  {id:"swiss-german",name:"Swiss German",f:"Indo-European",sf:"Germanic",spoken:"N, E, C Switzerland",wiki:"Swiss_German",role:"Marker of Swiss-German cultural identity",note:"Not mutually intelligible with standard German when spoken"},
  {id:"central-german",name:"Central German",f:"Indo-European",sf:"Germanic",spoken:"Central Germany",wiki:"Central_German_dialects",role:"Dialect continuum; part of Germanic dialect chain",note:"Part of the High/Low German dialect continuum"},
  {id:"low-german",name:"Low German",f:"Indo-European",sf:"Germanic",spoken:"N Netherlands, N Germany",wiki:"Low_German",role:"Distinct dialect grouping in Northern Europe",note:"Closer to Old Saxon; differs significantly from High German"},
  {id:"dutch",name:"Dutch",f:"Indo-European",sf:"Germanic",spoken:"Netherlands, Belgium",wiki:"Dutch_language",role:"National language of Netherlands; official in Belgium (Flanders)",note:"Similar to Flemish; spread globally through Dutch colonialism"},
  {id:"flemish",name:"Flemish",f:"Indo-European",sf:"Germanic",spoken:"Northern Belgium",wiki:"Flemish_dialect",role:"Source of Belgium's linguistic political divide; centrifugal force",note:"Similar to Dutch; Flemish vs Walloon split defines Belgian politics"},
  {id:"english",name:"English",f:"Indo-European",sf:"Germanic",spoken:"USA, UK, Australia, Canada, New Zealand (globally)",wiki:"English_language",role:"Global lingua franca; language of business, tech, diplomacy",note:"4th waves of IE expansion; American post-war influence key"},
  {id:"danish",name:"Danish",f:"Indo-European",sf:"Germanic",spoken:"Denmark",wiki:"Danish_language",role:"Official language; part of Scandinavian dialect chain",note:"Part of Continental Scandinavian Dialect Chain with Norwegian & Swedish"},
  {id:"norwegian",name:"Norwegian",f:"Indo-European",sf:"Germanic",spoken:"Norway",wiki:"Norwegian_language",role:"Official language; partially mutually intelligible with Swedish/Danish",note:"Part of Scandinavian dialect chain; two written standards"},
  {id:"swedish",name:"Swedish",f:"Indo-European",sf:"Germanic",spoken:"Sweden",wiki:"Swedish_language",role:"Official language; Scandinavian dialect chain",note:"Partially intelligible with Norwegian and Danish"},
  {id:"finland-swedish",name:"Finland Swedish",f:"Indo-European",sf:"Germanic",spoken:"Coastal Finland (W and S)",wiki:"Finland_Swedish",role:"Second official language of Finland; minority language rights",note:"Exception — non-Finnish language with official status in Finland"},
  {id:"icelandic",name:"Icelandic",f:"Indo-European",sf:"Germanic",spoken:"Iceland",wiki:"Icelandic_language",role:"Monolingual state; preserved Old Norse features",note:"Most conservative Germanic language; Icelanders can still read medieval sagas"},
  {id:"faroese",name:"Faroese",f:"Indo-European",sf:"Germanic",spoken:"Faroe Islands, Denmark",wiki:"Faroese_language",role:"Cultural identity of Faroese people; autonomous language",note:"Closely related to Icelandic; spoken by ~70,000 people"},
  {id:"yiddish",name:"Yiddish",f:"Indo-European",sf:"Germanic",spoken:"Israel, USA (New York)",wiki:"Yiddish_language",role:"Language of Ashkenazi Jewish diaspora; cultural heritage",note:"Germanic base + Hebrew/Aramaic + Slavic; non-Caribbean creole"},
  {id:"afrikaans",name:"Afrikaans",f:"Indo-European",sf:"Germanic",spoken:"South Africa, Namibia",wiki:"Afrikaans",role:"Legacy of Dutch colonialism; one of 11 official SA languages",note:"Developed from Dutch; strongly tied to Apartheid history"},
  // Indo-European / Romance
  {id:"italian",name:"Italian",f:"Indo-European",sf:"Romance",spoken:"Italy, Switzerland, San Marino, Vatican City",wiki:"Italian_language",role:"Lingua franca; national identity; Dante's Divina Commedia standardized it",note:"Dante Alighieri's work helped create Italian national identity → nationalism"},
  {id:"spanish",name:"Spanish",f:"Indo-European",sf:"Romance",spoken:"Spain, Latin America, North America",wiki:"Spanish_language",role:"Global lingua franca; 2nd most spoken native language",note:"Spread through Spanish colonization of Americas; reterritorialized Tenochtitlan"},
  {id:"aragonese",name:"Aragonese",f:"Indo-European",sf:"Romance",spoken:"Aragon region of Spain (Pyrenees Valley)",wiki:"Aragonese_language",role:"Endangered regional language; Aragonese cultural identity",note:"Spoken in mountainous Pyrenees valleys; endangered"},
  {id:"occitan",name:"Occitan",f:"Indo-European",sf:"Romance",spoken:"S France, Spain, Monaco, Italy",wiki:"Occitan_language",role:"Endangered; regional identity in southern France; devolutionary pressure",note:"Mentioned in teacher slides as endangered language in France"},
  {id:"catalan",name:"Catalan",f:"Indo-European",sf:"Romance",spoken:"Catalonia, Balearic Islands, Valencian Community (Spain)",wiki:"Catalan_language",role:"Central to Catalan independence movement; centrifugal force in Spain",note:"Catalonia referendum 2017; economic powerhouse wanting autonomy"},
  {id:"galician",name:"Galician",f:"Indo-European",sf:"Romance",spoken:"Galicia, Spain",wiki:"Galician_language",role:"Regional identity in NW Spain; related to Portuguese",note:"Once the same language as Portuguese before political divergence"},
  {id:"portuguese",name:"Portuguese",f:"Indo-European",sf:"Romance",spoken:"Brazil, Portugal, Mozambique, Angola, parts of Africa",wiki:"Portuguese_language",role:"Lingua franca; 9th most spoken globally; spread through colonialism",note:"More speakers in Brazil than Portugal; colonial diffusion"},
  {id:"french",name:"French",f:"Indo-European",sf:"Romance",spoken:"France, Belgium, Switzerland, Canada, W Africa",wiki:"French_language",role:"Lingua franca; diplomatic language; growing African speaker base",note:"More French speakers in Africa than France; key UN official language"},
  {id:"walloon",name:"Walloon",f:"Indo-European",sf:"Romance",spoken:"Wallonia, S Belgium",wiki:"Walloon_language",role:"Key to Belgian linguistic divide; centrifugal force",note:"French-speaking south; economic divide with Flemish north"},
  {id:"swiss-french",name:"Swiss French",f:"Indo-European",sf:"Romance",spoken:"W Switzerland",wiki:"Swiss_French",role:"Official in Switzerland; multilingual state example",note:"Switzerland has 4 official languages: German, French, Italian, Romansh"},
  {id:"corsican",name:"Corsican",f:"Indo-European",sf:"Romance",spoken:"Corsica (France), NE Sardinia (Italy)",wiki:"Corsican_language",role:"Regional identity; Corsican autonomy movement",note:"Closely related to Italian; Corsica is a French island"},
  {id:"romanian",name:"Romanian",f:"Indo-European",sf:"Romance",spoken:"Romania, Moldova",wiki:"Romanian_language",role:"Only Romance language in Eastern Europe — notable exception",note:"Exception to IE pattern; surrounded by Slavic languages"},
  {id:"romansh",name:"Romansh",f:"Indo-European",sf:"Romance",spoken:"Grisons, Switzerland",wiki:"Romansh_language",role:"4th official language of Switzerland; protected minority language",note:"Spoken by <1% of Swiss population; Alpine isolation preserved it"},
  // Indo-European / Slavic
  {id:"russian",name:"Russian",f:"Indo-European",sf:"Slavic (Eastern)",spoken:"Russia, Belarus, Kazakhstan, Kyrgyzstan",wiki:"Russian_language",role:"Lingua franca of post-Soviet space; political tool of Russian influence",note:"Used as superstratum language over Soviet republics"},
  {id:"ukrainian",name:"Ukrainian",f:"Indo-European",sf:"Slavic (Eastern)",spoken:"Ukraine, Russia, Canada, USA, Poland, Brazil, Argentina, Kazakhstan",wiki:"Ukrainian_language",role:"National identity deeply tied to language; resisting Russian linguistic hegemony",note:"Language policy central to Ukraine-Russia conflict"},
  {id:"belarusian",name:"Belarusian",f:"Indo-European",sf:"Slavic (Eastern)",spoken:"Belarus",wiki:"Belarusian_language",role:"Suppressed in favor of Russian under Lukashenko; identity issue",note:"Russian dominates official use; Belarusian marginalized"},
  {id:"rusyn",name:"Rusyn",f:"Indo-European",sf:"Slavic (Eastern)",spoken:"SE Poland, NE Slovakia, Transcarpathian Ukraine",wiki:"Rusyn_language",role:"Contested: some say dialect of Ukrainian, others a separate language",note:"Political/linguistic debate on language vs dialect status"},
  {id:"polish",name:"Polish",f:"Indo-European",sf:"Slavic (Western)",spoken:"Poland",wiki:"Polish_language",role:"National language; strong national identity",note:"Survived partition and occupation; key to Polish nationalism"},
  {id:"czech",name:"Czech",f:"Indo-European",sf:"Slavic (Western)",spoken:"Czech Republic, Slovakia, Austria, Poland",wiki:"Czech_language",role:"National language; Czechoslovak split partly linguistic",note:"Czech and Slovak are highly mutually intelligible"},
  {id:"slovak",name:"Slovak",f:"Indo-European",sf:"Slavic (Western)",spoken:"Slovakia",wiki:"Slovak_language",role:"National language; Velvet Divorce from Czech in 1993",note:"Very similar to Czech; political separation created divergence"},
  {id:"kashubian",name:"Kashubian",f:"Indo-European",sf:"Slavic (Western)",spoken:"Pomerania, N Poland (Baltic coast)",wiki:"Kashubian_language",role:"Recognized minority language in Poland; Kashubian identity",note:"Only recognized regional language in Poland"},
  {id:"serbian",name:"Serbian",f:"Indo-European",sf:"Slavic (Southwestern)",spoken:"Serbia, Bosnia, Montenegro, Croatia",wiki:"Serbian_language",role:"Central to Yugoslav Wars; religious-ethnic-linguistic overlap",note:"Uses Cyrillic; Croatian uses Latin — same language, different scripts"},
  {id:"croatian",name:"Croatian",f:"Indo-European",sf:"Slavic (Southwestern)",spoken:"Croatia, Bosnia, Montenegro, Vojvodina (Serbia)",wiki:"Croatian_language",role:"National identity; Croatian-Serbian debate = language vs. dialect",note:"Politically distinct from Serbian despite high mutual intelligibility"},
  {id:"slovenian",name:"Slovenian",f:"Indo-European",sf:"Slavic (Southwestern)",spoken:"Slovenia",wiki:"Slovenian_language",role:"National language; cultural cornerstone of Slovenian identity",note:"First Slavic language to gain EU official status"},
  {id:"bosnian",name:"Bosnian",f:"Indo-European",sf:"Slavic (Southwestern)",spoken:"Bosnia and Herzegovina",wiki:"Bosnian_language",role:"Identity language for Bosniak Muslims; post-Yugoslav recognition",note:"Politically recognized after Bosnian War; mutual intelligibility with Serbian/Croatian"},
  {id:"montenegrin",name:"Montenegrin",f:"Indo-European",sf:"Slavic (Southwestern)",spoken:"Montenegro",wiki:"Montenegrin_language",role:"National language since Montenegrin independence 2006",note:"Very similar to Serbian; separate language status is politically driven"},
  {id:"bulgarian",name:"Bulgarian",f:"Indo-European",sf:"Slavic (Southeastern)",spoken:"Bulgaria",wiki:"Bulgarian_language",role:"National language; uses Cyrillic script",note:"First Slavic language to be written (Old Church Slavonic)"},
  {id:"macedonian",name:"Macedonian",f:"Indo-European",sf:"Slavic (Southeastern)",spoken:"North Macedonia",wiki:"Macedonian_language",role:"Core of Macedonian national identity; dispute with Greece",note:"Country renamed North Macedonia after 2018 Prespa Agreement — toponym dispute"},
  // Hellenic
  {id:"greek",name:"Greek",f:"Indo-European",sf:"Hellenic",spoken:"Greece, Cyprus",wiki:"Greek_language",role:"One of oldest living languages; root of scientific/medical terminology",note:"Major empire spread Greek (Hellenic) as lingua franca across Mediterranean"},
  // Armenian
  {id:"armenian",name:"Armenian",f:"Indo-European",sf:"Armenian",spoken:"Armenia",wiki:"Armenian_language",role:"Diaspora language (genocide); national identity",note:"Armenian genocide (1915) scattered speakers globally"},
  // Albanian
  {id:"albanian",name:"Albanian",f:"Indo-European",sf:"Albanian",spoken:"Albania, Kosovo",wiki:"Albanian_language",role:"National language; Kosovo independence tied to Albanian ethnicity",note:"Language isolate within IE; no close relatives"},
  // Baltic
  {id:"latvian",name:"Latvian",f:"Indo-European",sf:"Baltic",spoken:"Latvia",wiki:"Latvian_language",role:"Official language; Baltic identity post-Soviet",note:"Baltic branch is the most conservative IE subfamily still spoken"},
  {id:"lithuanian",name:"Lithuanian",f:"Indo-European",sf:"Baltic",spoken:"Lithuania",wiki:"Lithuanian_language",role:"Most archaic living IE language; linguists' reference point",note:"Closest living language to Proto-Indo-European; key for backward reconstruction"},
  // Indo-Iranian / Iranian
  {id:"persian",name:"Persian/Farsi",f:"Indo-European",sf:"Indo-Iranian (Iranian)",spoken:"Iran",wiki:"Persian_language",role:"Lingua franca of Iran; ancient literary and cultural prestige",note:"One of world's oldest literary languages; spread with Persian empires"},
  {id:"pashto",name:"Pashto",f:"Indo-European",sf:"Indo-Iranian (Iranian)",spoken:"Afghanistan, Pakistan",wiki:"Pashto_language",role:"One of two official languages of Afghanistan; Pashtun identity",note:"Language of Pashtun people; Taliban speak Pashto"},
  {id:"dari",name:"Dari",f:"Indo-European",sf:"Indo-Iranian (Iranian)",spoken:"Afghanistan",wiki:"Dari_language",role:"Lingua franca of Afghanistan; Afghan Persian",note:"Variety of Persian; used as inter-ethnic communication language"},
  {id:"tajiki",name:"Tajiki",f:"Indo-European",sf:"Indo-Iranian (Iranian)",spoken:"Tajikistan, Kazakhstan, Kyrgyzstan, Russia, Turkmenistan, Ukraine, Afghanistan, Uzbekistan",wiki:"Tajik_language",role:"National language of Tajikistan; IE island in Turkic sea",note:"Variety of Persian; Tajikistan surrounded by Turkic states"},
  {id:"balochi",name:"Balochi",f:"Indo-European",sf:"Indo-Iranian (Iranian)",spoken:"Balochistan (Pakistan/Iran/Afghanistan)",wiki:"Balochi_language",role:"Language of Baloch people; separatist movement in Balochistan",note:"Balochistan straddles 3 countries; Baloch identity movement exists"},
  {id:"kurdish",name:"Kurdish (Yazidis)",f:"Indo-European",sf:"Indo-Iranian (Iranian)",spoken:"SE Turkey, N Iraq, NW Iran, NE Syria",wiki:"Kurdish_languages",role:"Stateless nation across 4 countries; Kurdish independence aspirations",note:"Kurds are one of the world's largest stateless peoples; Yazidis speak it"},
  // Indo-Aryan
  {id:"sanskrit",name:"Sanskrit",f:"Indo-European",sf:"Indo-Aryan",spoken:"India (historical/liturgical)",wiki:"Sanskrit",role:"Sacred language of Hinduism, Buddhism, Jainism; mother of Indo-Aryan",note:"Extinct as spoken language; used in religious texts; root of IndoAryan branch"},
  {id:"hindustani",name:"Hindustani (Hindi/Urdu)",f:"Indo-European",sf:"Indo-Aryan",spoken:"India, Pakistan",wiki:"Hindustani_language",role:"Lingua franca of Indian subcontinent; same spoken form, two scripts",note:"Hindi = Devanagari script (India); Urdu = Nastaliq script (Pakistan) — political divergence"},
  {id:"bengali",name:"Bengali",f:"Indo-European",sf:"Indo-Aryan",spoken:"Bangladesh, W Bengal (India), Tripura (India)",wiki:"Bengali_language",role:"National language of Bangladesh; major Indian regional language",note:"Bangladesh war of independence (1971) partly fought over Bengali language rights"},
  {id:"rohingya",name:"Rohingya",f:"Indo-European",sf:"Indo-Aryan",spoken:"Rakhine State (Myanmar), Bangladesh",wiki:"Rohingya_language",role:"Language of persecuted Muslim minority in Myanmar",note:"Rohingya genocide/ethnic cleansing; stateless and dispersed"},
  {id:"sinhala",name:"Sinhala/Sinhalese",f:"Indo-European",sf:"Indo-Aryan",spoken:"Sri Lanka",wiki:"Sinhala_language",role:"Official language; tied to Buddhist colonists from N India ~5th c. BCE",note:"Mentioned in slides: Sri Lanka intrafaith conflict with Tamil (Dravidian) speakers"},
  {id:"nepali",name:"Nepali",f:"Indo-European",sf:"Indo-Aryan",spoken:"Nepal, Bhutan",wiki:"Nepali_language",role:"Lingua franca of Nepal; national identity",note:"Nepal is one of the most linguistically diverse countries"},
  {id:"punjabi",name:"Punjabi",f:"Indo-European",sf:"Indo-Aryan",spoken:"Punjab (India), Punjab (Pakistan)",wiki:"Punjabi_language",role:"Divided across India-Pakistan border; Sikh cultural language",note:"Partition of Punjab (1947) split the Punjabi-speaking region"},
  {id:"gujarati",name:"Gujarati",f:"Indo-European",sf:"Indo-Aryan",spoken:"Gujarat, India",wiki:"Gujarati_language",role:"Major Indian regional language; diaspora language worldwide",note:"Gandhi spoke Gujarati; large Gujarati diaspora in UK and USA"},
  {id:"marathi",name:"Marathi",f:"Indo-European",sf:"Indo-Aryan",spoken:"Maharashtra, India; Goa",wiki:"Marathi_language",role:"Major regional language of Maharashtra; Mumbai's linguistic base",note:"Maharashtra state was created along linguistic lines in 1960"},
  {id:"dhivehi",name:"Dhivehi",f:"Indo-European",sf:"Indo-Aryan",spoken:"Maldives, Lakshadweep Islands (India)",wiki:"Dhivehi_language",role:"National and official language of Maldives",note:"Isolated Indo-Aryan variety due to island geography"},
  // Caucasian
  {id:"abkhaz",name:"Abkhaz",f:"Caucasian",sf:"North Caucasian",spoken:"Abkhazia (de facto independent from Georgia)",wiki:"Abkhaz_language",role:"De facto state; Russian backing; unresolved territorial conflict",note:"Recognized by Russia as independent; rest of world considers it Georgian"},
  {id:"chechen",name:"Chechen",f:"Caucasian",sf:"North Caucasian",spoken:"Chechnya, Russia",wiki:"Chechen_language",role:"Language of Chechen people; two wars with Russia; resistance symbol",note:"Chechen wars (1994-96, 1999-2009) — language tied to resistance identity"},
  {id:"georgian",name:"Georgian",f:"Caucasian",sf:"South Caucasian",spoken:"Georgia",wiki:"Georgian_language",role:"Language isolate; unique Mkhedruli script; strong cultural identity",note:"Has own unique alphabet; not related to IE or Semitic families — exception"},
  // Uralic
  {id:"sami",name:"Sami",f:"Uralic",sf:"Sami",spoken:"Sápmi (N Norway, Sweden, Finland, Kola Peninsula, Russia)",wiki:"Sámi_languages",role:"Indigenous language of the Sami people; revitalization movement",note:"Example of indigenous language suppression and revival"},
  {id:"finnish",name:"Finnish",f:"Uralic",sf:"Finnic",spoken:"Finland",wiki:"Finnish_language",role:"Exception in Europe — not IE; agglutinative language structure",note:"Finland, Estonia, Hungary are Uralic speakers in otherwise IE Europe"},
  {id:"estonian",name:"Estonian",f:"Uralic",sf:"Finnic",spoken:"Estonia",wiki:"Estonian_language",role:"Exception in Europe; post-Soviet national identity symbol",note:"Uralic exception; closely related to Finnish"},
  {id:"hungarian",name:"Hungarian",f:"Uralic",sf:"Ugric",spoken:"Hungary, neighboring countries",wiki:"Hungarian_language",role:"Exception in Europe — Uralic island in IE sea; strong national identity",note:"Migrated from Ural region ~9th century; surrounded by IE speakers"},
  // Dravidian
  {id:"tamil",name:"Tamil",f:"Dravidian",sf:"Southern Dravidian",spoken:"Tamil Nadu (India), Sri Lanka, Singapore",wiki:"Tamil_language",role:"Official in 3 countries; one of world's oldest living literary languages",note:"Sri Lanka conflict: Sinhalese (IE) vs Tamil (Dravidian) — interfaith + inter-language"},
  {id:"telugu",name:"Telugu",f:"Dravidian",sf:"South-Central Dravidian",spoken:"Andhra Pradesh, Telangana (India)",wiki:"Telugu_language",role:"Major South Indian language; IT diaspora globally (Hyderabad = 'Cyberabad')",note:"Andhra Pradesh was split in 2014 partly over linguistic-cultural claims"},
  // Turkic
  {id:"turkish",name:"Turkish",f:"Turkic",sf:"Oghuz",spoken:"Turkey, Northern Cyprus",wiki:"Turkish_language",role:"Exception in Europe; Atatürk replaced Arabic script with Latin in 1928",note:"Exception: non-IE language in Europe; spread with Ottoman Empire"},
  {id:"turkmen",name:"Turkmen",f:"Turkic",sf:"Oghuz",spoken:"Turkmenistan",wiki:"Turkmen_language",role:"National language; post-Soviet identity",note:"Turkmenistan is one of world's most isolated authoritarian states"},
  {id:"azeri",name:"Azeri/Azerbaijani",f:"Turkic",sf:"Oghuz",spoken:"Azerbaijan, NW Iran",wiki:"Azerbaijani_language",role:"National language; Nagorno-Karabakh conflict (Armenian vs Azeri)",note:"Significant Azeri population in NW Iran; Nagorno-Karabakh war"},
  {id:"kyrgyz",name:"Kyrgyz",f:"Turkic",sf:"Kipchak",spoken:"Kyrgyzstan",wiki:"Kyrgyz_language",role:"National language; post-Soviet identity",note:"Kyrgyzstan is host to both US and Russian military bases"},
  {id:"uzbek",name:"Uzbek",f:"Turkic",sf:"Karluk",spoken:"Uzbekistan",wiki:"Uzbek_language",role:"Most spoken Central Asian language; Uzbek cultural heritage",note:"Uzbekistan hosts Samarkand; Silk Road linguistic crossroads"},
  {id:"kazakh",name:"Kazakh",f:"Turkic",sf:"Kipchak",spoken:"Kazakhstan, Xinjiang (China), Russia, Mongolia, Uzbekistan, Turkey, Iran, Afghanistan",wiki:"Kazakh_language",role:"Official in Kazakhstan; Kazakh identity vs Russian cultural dominance",note:"Kazakhstan switching script from Cyrillic to Latin — decolonization"},
  {id:"uyghur",name:"Uyghur",f:"Turkic",sf:"Karluk",spoken:"Xinjiang, China",wiki:"Uyghur_language",role:"Language of persecuted Muslim minority in China; cultural suppression",note:"Xinjiang 'reeducation' camps; language and culture actively suppressed"},
  {id:"bashkir",name:"Bashkir",f:"Turkic",sf:"Kipchak",spoken:"Bashkortostan, Russia",wiki:"Bashkir_language",role:"Co-official with Russian in Bashkortostan",note:"One of few Turkic languages with official status within Russia"},
  {id:"volga-tatar",name:"Volga-Ural Tatar",f:"Turkic",sf:"Kipchak",spoken:"Volga Federal District, Russia",wiki:"Tatar_language",role:"Tatar cultural identity within Russia",note:"Tatars were once rulers of Russia (Golden Horde)"},
  {id:"crimean-tatar",name:"Crimean Tatar",f:"Turkic",sf:"Kipchak",spoken:"Crimea, Uzbekistan",wiki:"Crimean_Tatar_language",role:"Symbol of Crimean Tatar resistance; deportation history",note:"Stalin deported all Crimean Tatars in 1944; now minority in Crimea"},
  {id:"siberian-tatar",name:"Siberian Tatar",f:"Turkic",sf:"Kipchak",spoken:"W Siberia (Tyumen, Novosibirsk, Omsk, Tomsk, Kemerovo oblasts, Russia)",wiki:"Siberian_Tatar_language",role:"Minority Turkic language in Siberia",note:"Distinct from Volga Tatar; endangered"},
  {id:"afghan-tatar",name:"Afghan Tatar",f:"Turkic",sf:"Kipchak",spoken:"Afghanistan",wiki:"Tatar_language",role:"Remnant Turkic presence in Afghanistan",note:"Very few speakers; possibly extinct"},
  // Mongolic
  {id:"mongolian",name:"Mongolian",f:"Mongolic",sf:"Mongolic",spoken:"Mongolia, Inner Mongolia (China)",wiki:"Mongolian_language",role:"National language; Mongol cultural heritage",note:"Inner Mongolia is an autonomous region of China with significant Mongolian speakers"},
  // Tungusic
  {id:"manchu",name:"Manchu",f:"Tungusic",sf:"Manchu",spoken:"Manchuria, NE China",wiki:"Manchu_language",role:"Near-extinct; was official language of Qing Dynasty (China's last empire)",note:"Exception: Manchu rulers adopted Chinese; language nearly died out"},
  // Nilo-Saharan
  {id:"songhai",name:"Songhai",f:"Nilo-Saharan",sf:"Songhai",spoken:"Along Niger River, W Africa",wiki:"Songhai_languages",role:"Language of the historic Songhai Empire; W African trade",note:"Songhai Empire was one of largest in African history"},
  {id:"saharan-langs",name:"Saharan Languages",f:"Nilo-Saharan",sf:"Saharan",spoken:"Around Lake Chad",wiki:"Saharan_languages",role:"Languages of pastoral and nomadic peoples around Lake Chad",note:"Lake Chad is shrinking; speakers face environmental crisis"},
  {id:"central-sudanic",name:"Central Sudanic",f:"Nilo-Saharan",sf:"Central Sudanic",spoken:"CAR, Chad, South Sudan, Sudan, Uganda, DRC, Cameroon",wiki:"Central_Sudanic_languages",role:"Ethnic and cultural identity across Central Africa",note:"Spread across heart of sub-Saharan Africa"},
  {id:"eastern-sudanic",name:"Eastern Sudanic",f:"Nilo-Saharan",sf:"Eastern Sudanic",spoken:"S Egypt, E Chad, W Eritrea/Ethiopia, N Tanzania",wiki:"Eastern_Sudanic_languages",role:"Links East African peoples across national boundaries",note:"Languages like Nubian are Eastern Sudanic"},
  // Niger-Congo A
  {id:"yoruba",name:"Yoruba",f:"Niger-Congo",sf:"Niger-Congo A (non-Bantu)",spoken:"SW Nigeria, Benin, Togo",wiki:"Yoruba_language",role:"Major ethnic language; Yoruba religion influenced Caribbean (Voodoo, Candomblé)",note:"50M+ speakers; Yorubaland; cultural diffusion via Atlantic slave trade"},
  {id:"igbo",name:"Igbo",f:"Niger-Congo",sf:"Niger-Congo A (non-Bantu)",spoken:"SE Nigeria",wiki:"Igbo_language",role:"Major ethnic language of SE Nigeria; Biafra War (1967) was partly ethnic-linguistic",note:"Biafran independence movement had Igbo cultural basis"},
  {id:"fula",name:"Fula/Fulani",f:"Niger-Congo",sf:"Niger-Congo A (non-Bantu)",spoken:"Guinea, Senegal, Nigeria, Mali, Cameroon",wiki:"Fula_language",role:"Trans-national language; Fulani people are major pastoral group in W Africa",note:"Fulani herder-farmer conflicts are ongoing across Sahel"},
  // Niger-Congo B (Bantu)
  {id:"zulu",name:"Zulu",f:"Niger-Congo",sf:"Niger-Congo B (Bantu)",spoken:"South Africa",wiki:"Zulu_language",role:"Largest spoken language in South Africa; Zulu Kingdom history",note:"Zulu Kingdom resisted British colonialism; Battle of Isandlwana (1879)"},
  {id:"xhosa",name:"Xhosa",f:"Niger-Congo",sf:"Niger-Congo B (Bantu)",spoken:"South Africa (E Cape, W Cape, Gauteng)",wiki:"Xhosa_language",role:"Nelson Mandela's native language; anti-Apartheid identity",note:"Mandela was Xhosa; click consonants borrowed from Khoisan"},
  {id:"swahili",name:"Swahili",f:"Niger-Congo",sf:"Niger-Congo B (Bantu)",spoken:"Tanzania, Kenya, DRC, Uganda, Rwanda, Somalia, Mozambique",wiki:"Swahili_language",role:"Lingua franca of East Africa; Bantu base + Arabic influence",note:"Spread via Indian Ocean trade; most common African language on internet"},
  // Khoisan
  {id:"khoisan",name:"Khoisan Languages",f:"Khoisan",sf:"Khoisan",spoken:"Botswana, Namibia, Angola, Zambia, Zimbabwe, Lesotho",wiki:"Khoisan_languages",role:"Oldest living languages (60,000+ years); click consonants",note:"San people are among the oldest continuous cultures on Earth; indigenous"},
  // Afro-Asiatic / Chadic
  {id:"hausa",name:"Hausa",f:"Afro-Asiatic",sf:"Chadic",spoken:"N Nigeria, S Niger",wiki:"Hausa_language",role:"Lingua franca of W and C Africa; major trade language",note:"Hausaland straddles Nigeria-Niger border; Boko Haram operates in this region"},
  // Afro-Asiatic / Cushitic
  {id:"oromo",name:"Oromo",f:"Afro-Asiatic",sf:"Cushitic",spoken:"Oromia (Ethiopia), Kenya",wiki:"Oromo_language",role:"Largest ethnic group in Ethiopia; political tension with Tigrayans/Amhara",note:"Mentioned in slides: Tigrayans vs Oromo vs Amhara conflict in Ethiopia"},
  {id:"somali",name:"Somali",f:"Afro-Asiatic",sf:"Cushitic",spoken:"Somalia, Djibouti, Ethiopia, Kenya",wiki:"Somali_language",role:"Transnational Somali identity across failed state borders",note:"Somali speakers spread across 4 countries; pan-Somali nationalism"},
  {id:"afar",name:"Afar",f:"Afro-Asiatic",sf:"Cushitic",spoken:"Djibouti, Eritrea, Afar Region (Ethiopia)",wiki:"Afar_language",role:"Afar Triangle is geologically and culturally significant region",note:"Afar people span 3 countries; Djibouti is strategically crucial (US/French bases)"},
  // Afro-Asiatic / Egyptian
  {id:"ancient-egyptian",name:"Ancient Egyptian",f:"Afro-Asiatic",sf:"Egyptian",spoken:"Coptic Orthodox Church (liturgical only)",wiki:"Egyptian_language",role:"Extinct spoken language; liturgical survival in Coptic Church",note:"Evolved from hieroglyphs; died as spoken language ~17th century"},
  // Afro-Asiatic / Semitic
  {id:"akkadian",name:"Akkadian (Babylonian/Assyrian)",f:"Afro-Asiatic",sf:"Semitic",spoken:"Ancient Mesopotamia (EXTINCT)",wiki:"Akkadian_language",role:"Extinct; first major empire language (Babylon/Assyria)",note:"Oldest fully attested Semitic language; cuneiform script"},
  {id:"phoenician",name:"Phoenician",f:"Afro-Asiatic",sf:"Semitic",spoken:"Ancient Lebanon (EXTINCT)",wiki:"Phoenician_language",role:"Extinct; ancestor of modern alphabets (Greek > Latin > most Western scripts)",note:"Phoenician traders spread alphabet across Mediterranean"},
  {id:"hebrew",name:"Hebrew",f:"Afro-Asiatic",sf:"Semitic",spoken:"Israel",wiki:"Hebrew_language",role:"Revived from near-extinction; central to Zionism and Israeli national identity",note:"Revitalized by Eliezer Ben-Yehuda; connected to Zionism discussed in class"},
  {id:"aramaic",name:"Aramaic",f:"Afro-Asiatic",sf:"Semitic",spoken:"Iraq, Syria, Turkey, Iran (small communities)",wiki:"Aramaic_language",role:"Ancient lingua franca of Middle East; language of Jesus; nearly extinct",note:"Was lingua franca before Arabic; today spoken by Assyrians/Mizrahi Jews"},
  {id:"arabic",name:"Arabic",f:"Afro-Asiatic",sf:"Semitic",spoken:"Middle East, North Africa",wiki:"Arabic_language",role:"Lingua franca; spread with Islam; UN official language; 6th most spoken",note:"Pre-modern Arabic (Aramaic) spread with Islam 6th century CE; mentioned in slides"},
  {id:"amharic",name:"Amharic",f:"Afro-Asiatic",sf:"Semitic",spoken:"Ethiopia",wiki:"Amharic_language",role:"Lingua franca of Ethiopia; official government language",note:"Only Semitic language that is a national language outside Middle East/N Africa"},
  {id:"tigrinya",name:"Tigrinya",f:"Afro-Asiatic",sf:"Semitic",spoken:"Eritrea, Tigray Region (N Ethiopia)",wiki:"Tigrinya_language",role:"Language of Tigrayans; central to Tigray war (2020-2022)",note:"Tigray conflict in Ethiopia involved Tigrinya-speaking ethnic group"},
  {id:"tigre",name:"Tigre",f:"Afro-Asiatic",sf:"Semitic",spoken:"Eritrea (W lowlands, N)",wiki:"Tigre_language",role:"Minority Semitic language in Eritrea; distinct from Tigrinya",note:"Related to Tigrinya but different language; Eritrea is multilingual"},
  {id:"maltese",name:"Maltese",f:"Afro-Asiatic",sf:"Semitic",spoken:"Malta",wiki:"Maltese_language",role:"Only Semitic language written in Latin script; EU official language — exception",note:"Malta exception: Semitic (Arabic base) but in Europe with Latin script"},
  // Austronesian
  {id:"bahasa-indo",name:"Bahasa Indonesian",f:"Austronesian",sf:"Malayo-Polynesian",spoken:"Indonesia",wiki:"Indonesian_language",role:"Lingua franca unifying 270M+ people across 17,000+ islands",note:"Chosen as national language over Javanese deliberately to avoid ethnic dominance"},
  {id:"bahasa-malay",name:"Bahasa Malaysian",f:"Austronesian",sf:"Malayo-Polynesian",spoken:"Malaysia, Indonesia, Brunei, Singapore, E Timor, Thailand",wiki:"Malay_language",role:"Lingua franca of Maritime SE Asia",note:"Standard Malay and Indonesian are mutually intelligible"},
  {id:"javanese",name:"Javanese",f:"Austronesian",sf:"Malayo-Polynesian",spoken:"Java, Indonesia (C and E)",wiki:"Javanese_language",role:"Most spoken native language in Indonesia despite Bahasa being official",note:"55% of Indonesia's population lives on Java alone"},
  {id:"sundanese",name:"Sundanese",f:"Austronesian",sf:"Malayo-Polynesian",spoken:"W Java, Indonesia",wiki:"Sundanese_language",role:"Second largest native language in Indonesia",note:"Sunda people are distinct from Javanese; cultural differences"},
  {id:"malagasy",name:"Malagasy",f:"Austronesian",sf:"Malayo-Polynesian",spoken:"Madagascar",wiki:"Malagasy_language",role:"Demonstrates long-distance migration; Austronesian in Africa",note:"Madagascar speaks Austronesian despite being off African coast; migrated from Borneo ~500CE"},
  {id:"tagalog",name:"Tagalog",f:"Austronesian",sf:"Philippine",spoken:"Philippines (Luzon)",wiki:"Tagalog_language",role:"Basis of Filipino national language; unifying language of Philippines",note:"Tagalog chosen as basis of Filipino; Cebuano speakers protested"},
  {id:"cebuano",name:"Cebuano/Bisaya",f:"Austronesian",sf:"Philippine",spoken:"Visayas, Mindanao (Philippines)",wiki:"Cebuano_language",role:"Second most spoken Philippine language; Visayan identity",note:"Visayas region cultural identity distinct from Tagalog-dominant Luzon"},
  {id:"ilocano",name:"Ilocano",f:"Austronesian",sf:"Philippine",spoken:"N Luzon, Philippines",wiki:"Ilocano_language",role:"Third Philippine language; Ilocos regional identity",note:"Large Ilocano diaspora in Hawaii and California"},
  {id:"chabacano",name:"Chabacano (creole)",f:"Austronesian",sf:"Philippine",spoken:"Zamboanga City, Mindanao; Cavite; Basilan Island",wiki:"Chavacano_language",role:"Spanish-based creole; linguistic legacy of Spanish colonialism in Philippines",note:"Spanish-Austronesian creole; unique among Philippine languages"},
  {id:"hawaiian",name:"Hawaiian",f:"Austronesian",sf:"Polynesian",spoken:"Hawaii, USA",wiki:"Hawaiian_language",role:"Near-extinct; revitalization model for indigenous languages globally",note:"Language revitalization via immersion schools; cultural appropriation debate (hula)"},
  {id:"tahitian",name:"Tahitian",f:"Austronesian",sf:"Polynesian",spoken:"French Polynesia (Society Islands/Tahiti)",wiki:"Tahitian_language",role:"Prestige language of French Polynesia; official status",note:"French colonialism; French Polynesia remains French overseas territory"},
  {id:"tongan",name:"Tongan",f:"Austronesian",sf:"Polynesian",spoken:"Kingdom of Tonga",wiki:"Tongan_language",role:"National language; only Polynesian monarchy",note:"Tonga was never fully colonized; unique political history"},
  {id:"samoan",name:"Samoan",f:"Austronesian",sf:"Polynesian",spoken:"Samoa, American Samoa",wiki:"Samoan_language",role:"National language split between independent state and US territory",note:"American Samoa vs Independent Samoa — same language, different political status"},
  {id:"maori",name:"Maori",f:"Austronesian",sf:"Polynesian",spoken:"New Zealand",wiki:"Māori_language",role:"Co-official in NZ; model language revival; Treaty of Waitangi connection",note:"Revitalization model; Kura Kaupapa Maori immersion schools"},
  {id:"cook-maori",name:"Cook Islands Maori",f:"Austronesian",sf:"Polynesian",spoken:"Cook Islands, New Zealand, Australia",wiki:"Cook_Islands_Māori",role:"Official language of Cook Islands; diaspora in NZ and Australia",note:"Cook Islands is self-governing in free association with New Zealand"},
  {id:"melanesian",name:"Melanesian Languages",f:"Austronesian",sf:"Melanesian",spoken:"Melanesia (Solomon Islands, Vanuatu, Fiji, Papua New Guinea coast)",wiki:"Melanesian_languages",role:"Diverse language group; post-colonial lingua franca development",note:"Vanuatu has highest language density per capita in the world"},
  {id:"micronesian",name:"Micronesian Languages",f:"Austronesian",sf:"Micronesian",spoken:"Pacific (Chuuk, Kosrae, Pohnpei, Yap, Marshall Islands, Nauru, Kiribati)",wiki:"Micronesian_languages",role:"Small island languages; US strategic interests (compacts of free association)",note:"Many Micronesian states have free association with USA"},
  {id:"formosan",name:"Formosan Languages",f:"Austronesian",sf:"Formosan",spoken:"Taiwan (indigenous peoples)",wiki:"Formosan_languages",role:"Oldest Austronesian languages; Taiwan as Austronesian homeland",note:"Taiwan may be the origin point of the entire Austronesian language family"},
  // Papuan
  {id:"tok-pisin",name:"Tok Pisin (New Guinea Pidgin)",f:"Papuan",sf:"Creole/Lingua Franca",spoken:"Papua New Guinea",wiki:"Tok_Pisin",role:"English-based creole; official language and lingua franca of PNG",note:"PNG has 800+ languages; Tok Pisin bridges them; example of pidgin → creole"},
  {id:"hiro-motu",name:"Hiro Motu",f:"Papuan",sf:"Papuan",spoken:"Port Moresby, Papua New Guinea",wiki:"Hiri_Motu",role:"Pidgin/creole of Motu; official language of PNG",note:"Used around Port Moresby; distinct from Tok Pisin"},
  {id:"pama-nyungan",name:"Pama-Nyungan Languages",f:"Pama-Nyungan",sf:"Pama-Nyungan",spoken:"Australia (indigenous)",wiki:"Pama–Nyungan_languages",role:"Most widespread Aboriginal Australian languages; endangered by assimilation",note:"Before 1788: 300+ languages; assimilation policy until 1960s drove most to extinction"},
  // Sino-Tibetan
  {id:"mandarin",name:"Mandarin",f:"Sino-Tibetan",sf:"Sinitic",spoken:"Mainland China, Taiwan, Singapore",wiki:"Mandarin_Chinese",role:"Most spoken language globally (1B+ native speakers); official PRC language",note:"Beijing/PRC standardized Mandarin (northern dialect) — language & power"},
  {id:"cantonese",name:"Cantonese (Yue)",f:"Sino-Tibetan",sf:"Sinitic",spoken:"Guangdong, Guangxi, Hong Kong, Macau",wiki:"Cantonese",role:"Not mutually intelligible with Mandarin; Hong Kong identity symbol",note:"Written Chinese is shared but spoken Mandarin/Cantonese are mutually unintelligible"},
  {id:"tibetan",name:"Tibetan (Sherpa)",f:"Sino-Tibetan",sf:"Tibetic",spoken:"Tibetan Plateau",wiki:"Tibetan_language",role:"Language of Tibetan Buddhism; suppressed by China; Dalai Lama in exile",note:"Tibet annexed by China; Tibetan language/culture under threat — language revival context"},
  {id:"burmese",name:"Burmese",f:"Sino-Tibetan",sf:"Tibetic",spoken:"Myanmar",wiki:"Burmese_language",role:"National language; military junta uses it as homogenizing tool",note:"Myanmar's many ethnic groups (Karen, Shan, Rohingya) resist Burmese dominance"},
  {id:"dzongkha",name:"Dzongkha",f:"Sino-Tibetan",sf:"Tibetic",spoken:"Bhutan",wiki:"Dzongkha",role:"National language of Bhutan; tied to Bhutanese Buddhist identity",note:"Bhutan expelled ~100,000 Nepali speakers (Lhotshampas) in the 1990s"},
  {id:"karenic",name:"Karenic Languages",f:"Sino-Tibetan",sf:"Karenic",spoken:"Thailand, Myanmar",wiki:"Karenic_languages",role:"Karen people resist Burmese state; language is identity marker",note:"Karen National Union fought one of world's longest civil wars against Myanmar"},
  // Austro-Asiatic
  {id:"vietnamese",name:"Vietnamese",f:"Austro-Asiatic",sf:"Vietic",spoken:"Vietnam",wiki:"Vietnamese_language",role:"National language; French influence on script (Latin alphabet adopted)",note:"Originally used Chinese characters; French colonialism → Romanized alphabet"},
  {id:"khmer",name:"Khmer",f:"Austro-Asiatic",sf:"Khmeric",spoken:"Cambodia",wiki:"Khmer_language",role:"National language; Khmer Rouge targeted educated speakers",note:"Khmer Rouge genocide targeted Khmer-speaking intellectuals and educated class"},
  {id:"mon",name:"Mon",f:"Austro-Asiatic",sf:"Monic",spoken:"SE Myanmar (Lower Burma)",wiki:"Mon_language",role:"Ancient language with its own script; influenced Burmese script",note:"Mon script is the ancestor of Burmese script; Mon people were once dominant"},
  // Kra-Dai
  {id:"thai",name:"Thai",f:"Kra-Dai",sf:"Tai",spoken:"Thailand",wiki:"Thai_language",role:"National language; Thailand never colonized — language preserved independently",note:"Thailand (Siam) maintained independence; language not influenced by colonialism"},
  {id:"lao",name:"Lao",f:"Kra-Dai",sf:"Tai",spoken:"Laos",wiki:"Lao_language",role:"National language; Laos under French colonial influence",note:"Laotian closely related to Thai; Mekong River separates the speech communities"},
  {id:"shan",name:"Shan",f:"Kra-Dai",sf:"Tai",spoken:"Shan State (Myanmar), N Thailand, Yunnan (China), Laos, Vietnam",wiki:"Shan_language",role:"Language of Shan people; Shan State has autonomy movement against Myanmar",note:"Shan State has significant opium production history (Golden Triangle)"},
  // Hmongic
  {id:"hmong",name:"Hmong",f:"Hmongic",sf:"Hmongic",spoken:"China (S), Vietnam, Laos, Thailand",wiki:"Hmong_language",role:"Language of diaspora; Hmong fought alongside US in Vietnam War",note:"Hmong refugees in USA after Vietnam War; large communities in Minnesota & California"},
  // Japonic
  {id:"japanese",name:"Japanese",f:"Japonic",sf:"Japanese",spoken:"Japan",wiki:"Japanese_language",role:"Monolingual state; language tied to Japanese exceptionalism and culture",note:"Japonic/language isolate; 2-3% of world speaks it; Japan = monolingual state example"},
  {id:"ryukyuan",name:"Ryukyuan",f:"Japonic",sf:"Ryukyuan",spoken:"Ryukyu Islands (Okinawa), SW Japan",wiki:"Ryukyuan_languages",role:"Endangered; Okinawan identity distinct from mainland Japanese",note:"Ryukyu Kingdom was independent before annexation by Japan in 1879"},
  {id:"ainu",name:"Ainu",f:"Japonic",sf:"Ainu",spoken:"Hokkaido, Japan",wiki:"Ainu_language",role:"Nearly extinct; Ainu people received official indigenous recognition in 2019",note:"Ainu people were the original inhabitants of Hokkaido and Sakhalin"},
  // Koreanic
  {id:"korean",name:"Korean",f:"Koreanic",sf:"Korean",spoken:"South Korea, North Korea",wiki:"Korean_language",role:"Language isolate; unique Hangul script; North/South divided but same language",note:"Hangul invented by King Sejong in 1443; single language across divided peninsula"},
  {id:"jeju",name:"Jeju",f:"Koreanic",sf:"Jeju",spoken:"Jeju Island, South Korea",wiki:"Jeju_language",role:"Critically endangered; UNESCO lists as most endangered; Jeju cultural identity",note:"Jeju dialect so different some consider it a separate language — language vs dialect debate"},
  // Creoles
  {id:"sranan-tongo",name:"Sranan Tongo Creole",f:"Creole",sf:"English-based Creole",spoken:"Suriname",wiki:"Sranan_Tongo",role:"National lingua franca of Suriname; English-based creole",note:"Suriname is unique: Dutch-colonized but English-creole lingua franca"},
  {id:"guyanese-creole",name:"Guyanese Creole",f:"Creole",sf:"English-based Creole",spoken:"Guyana",wiki:"Guyanese_Creole_English",role:"Spoken in only English-speaking country in S America",note:"Guyana = only English-speaking country in South America — exception"},
  {id:"papiamento",name:"Papiamento Creole",f:"Creole",sf:"Portuguese-based Creole",spoken:"Aruba, Bonaire, Curaçao (ABC Islands)",wiki:"Papiamentu",role:"Portuguese creole in Dutch Caribbean territory",note:"ABC islands are Dutch territory; Portuguese creole due to slave trade routes"},
  {id:"louisiana-haitian",name:"Louisiana & Haitian Creole",f:"Creole",sf:"French-based Creole",spoken:"Haiti, Louisiana (USA)",wiki:"Haitian_Creole",role:"Official language of Haiti; French + W African language convergence",note:"Haitian Creole is example of creolization via Atlantic slave trade; official in Haiti"},
  {id:"bahamian-jamaican-gullah",name:"Bahamian/Jamaican/Gullah Creole",f:"Creole",sf:"English-based Creole",spoken:"Bahamas, Jamaica, South Carolina/Georgia (USA)",wiki:"Jamaican_Creole_English",role:"English + African language creoles; African diaspora cultural identity",note:"Gullah: coastal SE USA; cultural survival of West African traditions"},
];

// Country ISO2 → Language Family (for map coloring)
const CF = {
  GB:"Indo-European",IE:"Indo-European",FR:"Indo-European",DE:"Indo-European",
  AT:"Indo-European",CH:"Indo-European",ES:"Indo-European",PT:"Indo-European",
  IT:"Indo-European",BE:"Indo-European",NL:"Indo-European",LU:"Indo-European",
  DK:"Indo-European",NO:"Indo-European",SE:"Indo-European",IS:"Indo-European",
  PL:"Indo-European",CZ:"Indo-European",SK:"Indo-European",HR:"Indo-European",
  BA:"Indo-European",RS:"Indo-European",SI:"Indo-European",ME:"Indo-European",
  MK:"Indo-European",BG:"Indo-European",RO:"Indo-European",GR:"Indo-European",
  AL:"Indo-European",CY:"Indo-European",RU:"Indo-European",UA:"Indo-European",
  BY:"Indo-European",LV:"Indo-European",LT:"Indo-European",AM:"Indo-European",
  IR:"Indo-European",AF:"Indo-European",PK:"Indo-European",IN:"Indo-European",
  BD:"Indo-European",NP:"Indo-European",LK:"Indo-European",US:"Indo-European",
  CA:"Indo-European",AU:"Indo-European",NZ:"Indo-European",MX:"Indo-European",
  BR:"Indo-European",AR:"Indo-European",CL:"Indo-European",CO:"Indo-European",
  PE:"Indo-European",VE:"Indo-European",EC:"Indo-European",BO:"Indo-European",
  PY:"Indo-European",UY:"Indo-European",GY:"Indo-European",SR:"Indo-European",
  EE:"Uralic",FI:"Uralic",HU:"Uralic",
  GE:"Caucasian",
  CN:"Sino-Tibetan",TW:"Sino-Tibetan",MM:"Sino-Tibetan",BT:"Sino-Tibetan",
  MA:"Afro-Asiatic",DZ:"Afro-Asiatic",TN:"Afro-Asiatic",LY:"Afro-Asiatic",
  EG:"Afro-Asiatic",SD:"Afro-Asiatic",SA:"Afro-Asiatic",AE:"Afro-Asiatic",
  YE:"Afro-Asiatic",OM:"Afro-Asiatic",KW:"Afro-Asiatic",QA:"Afro-Asiatic",
  BH:"Afro-Asiatic",JO:"Afro-Asiatic",LB:"Afro-Asiatic",SY:"Afro-Asiatic",
  IQ:"Afro-Asiatic",IL:"Afro-Asiatic",ET:"Afro-Asiatic",ER:"Afro-Asiatic",
  SO:"Afro-Asiatic",DJ:"Afro-Asiatic",MT:"Afro-Asiatic",
  NG:"Niger-Congo",GH:"Niger-Congo",CI:"Niger-Congo",SN:"Niger-Congo",
  ML:"Niger-Congo",GN:"Niger-Congo",BF:"Niger-Congo",BJ:"Niger-Congo",
  TG:"Niger-Congo",CM:"Niger-Congo",GA:"Niger-Congo",CG:"Niger-Congo",
  CD:"Niger-Congo",CF:"Niger-Congo",AO:"Niger-Congo",ZM:"Niger-Congo",
  ZW:"Niger-Congo",MW:"Niger-Congo",MZ:"Niger-Congo",TZ:"Niger-Congo",
  KE:"Niger-Congo",UG:"Niger-Congo",RW:"Niger-Congo",BI:"Niger-Congo",
  ZA:"Niger-Congo",
  SS:"Nilo-Saharan",NE:"Nilo-Saharan",TD:"Nilo-Saharan",
  BW:"Khoisan",NA:"Khoisan",
  ID:"Austronesian",MY:"Austronesian",PH:"Austronesian",MG:"Austronesian",
  TL:"Austronesian",BN:"Austronesian",PG:"Papuan",
  JP:"Japonic",KR:"Koreanic",KP:"Koreanic",
  TR:"Turkic",TM:"Turkic",AZ:"Turkic",KZ:"Turkic",KG:"Turkic",UZ:"Turkic",
  MN:"Mongolic",
  VN:"Austro-Asiatic",KH:"Austro-Asiatic",
  TH:"Kra-Dai",LA:"Kra-Dai",
  SG:"Austronesian",
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function getFamilies() {
  const f = {};
  LANGS.forEach(l => {
    if(!f[l.f]) f[l.f] = {};
    if(!f[l.f][l.sf]) f[l.f][l.sf] = [];
    f[l.f][l.sf].push(l);
  });
  return f;
}

function getRandItems(arr, n) {
  const s = [...arr]; for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}
  return s.slice(0,n);
}

// ─── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg:"#080c18", card:"#0f1628", card2:"#161f38",
  gold:"#d4a438", goldLight:"#f0c060", accent:"#4e91f7",
  text:"#e8eaf0", muted:"#7a84a0", border:"rgba(255,255,255,0.07)",
  ff:'"Playfair Display", Georgia, serif', fb:'"Outfit", system-ui, sans-serif',
  fm:'"JetBrains Mono", monospace',
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("menu");
  const [selLang, setSelLang] = useState(null);
  const [wikiCache, setWikiCache] = useState({});

  const fetchWiki = useCallback(async (lang) => {
    if(!lang.wiki || wikiCache[lang.id]) return;
    try {
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${lang.wiki}`);
      const d = await r.json();
      setWikiCache(c => ({...c, [lang.id]: d}));
    } catch(e) {}
  }, [wikiCache]);

  useEffect(()=>{ if(selLang) fetchWiki(selLang); },[selLang,fetchWiki]);

  const back = () => { setMode("menu"); setSelLang(null); };

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:T.fb,overflowX:"hidden"}}>
      {mode==="menu"   && <MainMenu onSelect={setMode}/>}
      {mode==="learn"  && <LearnMode back={back} selLang={selLang} setSelLang={setSelLang} wiki={wikiCache}/>}
      {mode==="quiz"   && <QuizMode back={back}/>}
      {mode==="cards"  && <FlashcardMode back={back}/>}
      {mode==="map"    && <MapMode back={back}/>}
      {mode==="tree"   && <TreeMode back={back}/>}
    </div>
  );
}

// ─── MAIN MENU ────────────────────────────────────────────────────────────────
function MainMenu({onSelect}) {
  const modes = [
    {id:"learn", icon:"📖", title:"Learn", sub:"Browse the full language tree with Wikipedia-powered detail cards"},
    {id:"cards", icon:"🃏", title:"Flashcards", sub:"Flip through languages — name to facts"},
    {id:"quiz",  icon:"🧠", title:"Quiz Mode", sub:"Adaptive multiple-choice drilling on family, location & role"},
    {id:"map",   icon:"🗺️", title:"World Map", sub:"See every language family plotted across the globe"},
    {id:"tree",  icon:"🌳", title:"Language Tree", sub:"Visual hierarchy — family → subfamily → language"},
  ];
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      {/* Hero */}
      <div style={{textAlign:"center",marginBottom:56}}>
        <div style={{fontSize:13,letterSpacing:6,color:T.gold,fontFamily:T.fb,fontWeight:600,textTransform:"uppercase",marginBottom:16}}>AP HUG · Unit 3</div>
        <h1 style={{fontFamily:T.ff,fontSize:"clamp(40px,8vw,80px)",fontWeight:900,lineHeight:1.05,color:T.text,marginBottom:16}}>
          Language<br/><span style={{color:T.gold,fontStyle:"italic"}}>Atlas</span>
        </h1>
        <p style={{color:T.muted,fontSize:16,maxWidth:440,margin:"0 auto",lineHeight:1.6}}>
          {LANGS.length} languages · {Object.keys(getFamilies()).length} families · Built from your Quizlet set + slides
        </p>
      </div>

      {/* Mode cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,width:"100%",maxWidth:900}}>
        {modes.map(m => (
          <button key={m.id} className="mode-card" onClick={()=>onSelect(m.id)} style={{
            background:T.card, border:`1px solid ${T.border}`, borderRadius:16,
            padding:"28px 24px", textAlign:"left", cursor:"pointer", color:T.text,
            boxShadow:"0 8px 24px rgba(0,0,0,0.3)"
          }}>
            <div style={{fontSize:32,marginBottom:12}}>{m.icon}</div>
            <div style={{fontFamily:T.ff,fontSize:20,fontWeight:700,marginBottom:6,color:T.goldLight}}>{m.title}</div>
            <div style={{fontSize:13,color:T.muted,lineHeight:1.5}}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* Family legend */}
      <div style={{marginTop:56,maxWidth:900,width:"100%"}}>
        <div style={{fontSize:11,letterSpacing:4,color:T.muted,textTransform:"uppercase",marginBottom:16,textAlign:"center"}}>Language Families</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {Object.entries(FC).map(([fam,col])=>(
            <span key={fam} style={{background:`${col}22`,border:`1px solid ${col}44`,color:col,borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600}}>{fam}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEARN MODE ───────────────────────────────────────────────────────────────
function LearnMode({back, selLang, setSelLang, wiki}) {
  const [openFam, setOpenFam] = useState(null);
  const [openSf, setOpenSf] = useState(null);
  const [search, setSearch] = useState("");
  const tree = useMemo(()=>getFamilies(),[]);

  const filtered = search.trim()
    ? LANGS.filter(l=>l.name.toLowerCase().includes(search.toLowerCase())||l.spoken.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:280,minWidth:280,background:T.card,borderRight:`1px solid ${T.border}`,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"20px 16px",borderBottom:`1px solid ${T.border}`}}>
          <button onClick={back} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>← Back</button>
          <div style={{fontFamily:T.ff,fontSize:20,fontWeight:700,color:T.goldLight,marginBottom:12}}>Learn</div>
          <input
            placeholder="Search languages..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:13,outline:"none",fontFamily:T.fb}}
          />
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {filtered
            ? filtered.map(l=>(
              <div key={l.id} className="tree-item" onClick={()=>setSelLang(l)} style={{
                padding:"8px 16px",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:8,
                background:selLang?.id===l.id?`${FC[l.f]}22`:"transparent"
              }}>
                <span style={{width:8,height:8,borderRadius:"50%",background:FC[l.f]||"#666",flexShrink:0}}/>
                <span style={{color:T.text}}>{l.name}</span>
                <span style={{color:T.muted,fontSize:11,marginLeft:"auto"}}>{l.f}</span>
              </div>
            ))
            : Object.entries(tree).map(([fam,sfs])=>(
              <div key={fam}>
                <div className="tree-item" onClick={()=>setOpenFam(openFam===fam?null:fam)} style={{
                  padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,
                  background:openFam===fam?`${FC[fam]}15`:"transparent"
                }}>
                  <span style={{color:FC[fam]||"#888",fontSize:10}}>◆</span>
                  <span style={{fontSize:13,fontWeight:600,color:FC[fam]||T.text}}>{fam}</span>
                  <span style={{color:T.muted,fontSize:11,marginLeft:"auto"}}>{Object.values(sfs).flat().length}</span>
                  <span style={{color:T.muted,fontSize:10}}>{openFam===fam?"▲":"▼"}</span>
                </div>
                {openFam===fam && Object.entries(sfs).map(([sf,langs])=>(
                  <div key={sf}>
                    <div className="tree-item" onClick={()=>setOpenSf(openSf===sf?null:sf)} style={{
                      padding:"7px 16px 7px 32px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                      background:openSf===sf?`${FC[fam]}10`:"transparent"
                    }}>
                      <span style={{fontSize:11,color:T.muted}}>▸</span>
                      <span style={{fontSize:12,color:T.muted}}>{sf}</span>
                      <span style={{color:T.muted,fontSize:11,marginLeft:"auto"}}>{langs.length}</span>
                    </div>
                    {openSf===sf && langs.map(l=>(
                      <div key={l.id} className="tree-item" onClick={()=>setSelLang(l)} style={{
                        padding:"6px 16px 6px 48px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                        background:selLang?.id===l.id?`${FC[fam]}22`:"transparent"
                      }}>
                        <span style={{fontSize:12,color:selLang?.id===l.id?FC[fam]:T.text}}>{l.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))
          }
        </div>
      </div>

      {/* Detail panel */}
      <div style={{flex:1,overflowY:"auto",padding:"40px"}}>
        {!selLang
          ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",textAlign:"center",opacity:0.5}}>
              <div style={{fontSize:48,marginBottom:16}}>👈</div>
              <div style={{fontFamily:T.ff,fontSize:24,color:T.muted}}>Select a language</div>
              <div style={{color:T.muted,fontSize:14,marginTop:8}}>Browse the tree or search above</div>
            </div>
          : <LangCard lang={selLang} wiki={wiki[selLang.id]}/>
        }
      </div>
    </div>
  );
}

function LangCard({lang, wiki}) {
  const col = FC[lang.f] || "#888";
  return (
    <div className="fade-in" style={{maxWidth:700,margin:"0 auto"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${col}22,${col}08)`,border:`1px solid ${col}44`,borderRadius:16,padding:"32px",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:11,letterSpacing:4,color:col,fontWeight:600,textTransform:"uppercase",marginBottom:8}}>{lang.f}</div>
            <h2 style={{fontFamily:T.ff,fontSize:"clamp(28px,5vw,44px)",fontWeight:900,color:T.text,marginBottom:4}}>{lang.name}</h2>
            <div style={{color:T.muted,fontSize:14}}>{lang.sf}</div>
          </div>
          {wiki?.thumbnail && <img src={wiki.thumbnail.source} alt="" style={{width:80,height:80,objectFit:"cover",borderRadius:12,opacity:0.9}} onError={e=>e.target.style.display="none"}/>}
        </div>
      </div>

      {/* Info grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        {[
          {label:"📍 Spoken in", val:lang.spoken},
          {label:"🏛️ Subfamily", val:lang.sf},
          {label:"🌐 Family", val:lang.f},
          {label:"⚡ Role", val:lang.role},
        ].map(({label,val})=>(
          <div key={label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px"}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:6,fontWeight:600}}>{label}</div>
            <div style={{fontSize:14,color:T.text,lineHeight:1.5}}>{val}</div>
          </div>
        ))}
      </div>

      {/* Teacher note */}
      {lang.note && (
        <div style={{background:`${T.gold}12`,border:`1px solid ${T.gold}33`,borderRadius:12,padding:"16px 20px",marginBottom:24}}>
          <div style={{fontSize:11,color:T.gold,fontWeight:600,marginBottom:6}}>📚 AP HUG CONTEXT</div>
          <div style={{fontSize:14,color:T.text,lineHeight:1.6}}>{lang.note}</div>
        </div>
      )}

      {/* Wikipedia extract */}
      {wiki
        ? <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 24px"}}>
            <div style={{fontSize:11,color:T.muted,fontWeight:600,marginBottom:10}}>📖 WIKIPEDIA</div>
            <p style={{fontSize:14,color:T.text,lineHeight:1.7,marginBottom:12}}>{wiki.extract?.slice(0,600)}{wiki.extract?.length>600?"…":""}</p>
            {wiki.content_urls?.desktop?.page && (
              <a href={wiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer"
                style={{color:T.accent,fontSize:13,textDecoration:"none"}}>Read full article →</a>
            )}
          </div>
        : <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px",textAlign:"center",color:T.muted,fontSize:14}} className="pulse">Loading Wikipedia…</div>
      }
    </div>
  );
}

// ─── FLASHCARD MODE ────────────────────────────────────────────────────────────
function FlashcardMode({back}) {
  const [filter, setFilter] = useState("All");
  const [pool, setPool] = useState(()=>[...LANGS]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [missed, setMissed] = useState(new Set());
  const families = ["All",...Object.keys(getFamilies())];

  useEffect(()=>{
    const p = filter==="All" ? [...LANGS] : LANGS.filter(l=>l.f===filter);
    setPool(getRandItems(p,p.length));
    setIdx(0); setFlipped(false); setKnown(new Set()); setMissed(new Set());
  },[filter]);

  const card = pool[idx];
  if(!card) return null;
  const col = FC[card.f] || "#888";
  const total = pool.length;

  const next = (mark) => {
    setFlipped(false);
    if(mark==="known") setKnown(k=>new Set([...k,card.id]));
    if(mark==="missed") setMissed(m=>new Set([...m,card.id]));
    setTimeout(()=>{ if(idx<total-1) setIdx(i=>i+1); else setIdx(0); },150);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 24px"}}>
      <div style={{width:"100%",maxWidth:640}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
          <button onClick={back} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13}}>← Back</button>
          <div style={{fontFamily:T.ff,fontSize:22,color:T.goldLight}}>Flashcards</div>
          <div style={{fontSize:13,color:T.muted}}>{idx+1} / {total}</div>
        </div>

        {/* Filter */}
        <div style={{display:"flex",gap:8,marginBottom:28,flexWrap:"wrap",justifyContent:"center"}}>
          {families.slice(0,8).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              background:filter===f?(FC[f]||T.gold)+"33":"transparent",
              border:`1px solid ${filter===f?(FC[f]||T.gold):"rgba(255,255,255,0.1)"}`,
              color:filter===f?(FC[f]||T.goldLight):T.muted,
              borderRadius:20,padding:"5px 14px",fontSize:12,cursor:"pointer",fontFamily:T.fb,fontWeight:500
            }}>{f==="All"?"All Families":f}</button>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:4,marginBottom:28,overflow:"hidden"}}>
          <div style={{height:"100%",background:`linear-gradient(90deg,${T.gold},${col})`,width:`${((idx)/total)*100}%`,transition:"width 0.3s"}}/>
        </div>

        {/* Score chips */}
        <div style={{display:"flex",gap:12,marginBottom:24,justifyContent:"center"}}>
          <span style={{background:"#10b98133",color:"#34d399",borderRadius:20,padding:"4px 16px",fontSize:13,fontWeight:600}}>✓ {known.size} known</span>
          <span style={{background:"#ef444433",color:"#f87171",borderRadius:20,padding:"4px 16px",fontSize:13,fontWeight:600}}>✗ {missed.size} missed</span>
        </div>

        {/* Card */}
        <div className="flip-card" style={{height:320,marginBottom:24}} onClick={()=>setFlipped(f=>!f)}>
          <div className={`flip-inner ${flipped?"flipped":""}`} style={{height:"100%"}}>
            {/* Front */}
            <div className="flip-front" style={{
              background:`linear-gradient(135deg,${col}33,${col}15)`,
              border:`2px solid ${col}55`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"
            }}>
              <div style={{fontSize:11,letterSpacing:4,color:col,textTransform:"uppercase",marginBottom:16,fontWeight:600}}>{card.f}</div>
              <div style={{fontFamily:T.ff,fontSize:"clamp(28px,7vw,52px)",fontWeight:900,color:T.text,marginBottom:8}}>{card.name}</div>
              <div style={{color:T.muted,fontSize:14}}>{card.sf}</div>
              <div style={{marginTop:24,fontSize:12,color:T.muted,opacity:0.6}}>tap to reveal</div>
            </div>
            {/* Back */}
            <div className="flip-back" style={{
              background:T.card2,border:`2px solid ${col}33`,
              display:"flex",flexDirection:"column",justifyContent:"space-around",padding:28,
            }}>
              <div>
                <div style={{fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>SPOKEN IN</div>
                <div style={{fontSize:15,color:T.text,lineHeight:1.5}}>{card.spoken}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>ROLE & SIGNIFICANCE</div>
                <div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{card.role}</div>
              </div>
              {card.note && <div style={{background:`${T.gold}15`,borderRadius:8,padding:"10px 14px"}}>
                <div style={{fontSize:11,color:T.gold,fontWeight:600,marginBottom:3}}>AP NOTE</div>
                <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>{card.note}</div>
              </div>}
            </div>
          </div>
        </div>

        {/* Actions */}
        {flipped && (
          <div className="fade-in" style={{display:"flex",gap:12,justifyContent:"center"}}>
            <button onClick={()=>next("missed")} style={{flex:1,padding:"14px",background:"#ef444422",border:"1px solid #ef4444",color:"#f87171",borderRadius:12,fontSize:15,cursor:"pointer",fontFamily:T.fb,fontWeight:600}}>✗ Review Again</button>
            <button onClick={()=>next("known")} style={{flex:1,padding:"14px",background:"#10b98122",border:"1px solid #10b981",color:"#34d399",borderRadius:12,fontSize:15,cursor:"pointer",fontFamily:T.fb,fontWeight:600}}>✓ Got It</button>
          </div>
        )}
        {!flipped && (
          <button onClick={()=>next()} style={{width:"100%",padding:"14px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:12,fontSize:14,cursor:"pointer",fontFamily:T.fb}}>Skip →</button>
        )}
      </div>
    </div>
  );
}

// ─── QUIZ MODE ────────────────────────────────────────────────────────────────
// ─── WEAK SPOT TRACKER (session) ─────────────────────────────────────────────
const weakSpots = {}; // { langId: {wrong:N, right:N}, family: {wrong:N} }
function recordAnswer(lang, correct) {
  if(!weakSpots[lang.id]) weakSpots[lang.id]={wrong:0,right:0,name:lang.name,family:lang.f};
  if(correct) weakSpots[lang.id].right++;
  else weakSpots[lang.id].wrong++;
  if(!weakSpots[`fam_${lang.f}`]) weakSpots[`fam_${lang.f}`]={wrong:0,right:0};
  if(correct) weakSpots[`fam_${lang.f}`].right++;
  else weakSpots[`fam_${lang.f}`].wrong++;
}
function getWeakList() {
  return Object.entries(weakSpots)
    .filter(([k,v])=>!k.startsWith("fam_")&&v.wrong>0)
    .sort((a,b)=>b[1].wrong-a[1].wrong)
    .slice(0,8)
    .map(([,v])=>v);
}
function getWeakFamilies() {
  return Object.entries(weakSpots)
    .filter(([k,v])=>k.startsWith("fam_")&&v.wrong>0)
    .sort((a,b)=>b[1].wrong-a[1].wrong)
    .map(([k,v])=>({family:k.replace("fam_",""),wrong:v.wrong}));
}
function getWeakBiasedLang() {
  const weak = getWeakList();
  if(weak.length>0 && Math.random()<0.45) {
    const pick = weak[Math.floor(Math.random()*Math.min(3,weak.length))];
    return LANGS.find(l=>l.name===pick.name)||null;
  }
  return null;
}

// ─── CLAUDE API CALL ──────────────────────────────────────────────────────────
async function callClaude(messages, system="", maxTokens=600) {
  const body = { model:"claude-sonnet-4-20250514", max_tokens:maxTokens, messages };
  if(system) body.system = system;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  const d = await r.json();
  return d.content?.find(b=>b.type==="text")?.text || "";
}

// ─── AI QUESTION GENERATOR ────────────────────────────────────────────────────
async function generateAIQuestion(quizType, weakFams) {
  const weakFamStr = weakFams.length>0
    ? `The student struggles most with: ${weakFams.slice(0,3).map(f=>f.family).join(", ")}. Bias questions toward these.`
    : "";
  const sampleLangs = getRandItems(LANGS,12).map(l=>
    `${l.name} (${l.f}/${l.sf}, spoken in ${l.spoken}, role: ${l.role})`
  ).join("\n");

  const typeInstruction = quizType==="mixed"
    ? "Pick one question type randomly from: family, subfamily, location, cultural/political role, historical origin, or relationship to other languages."
    : `Question type: ${quizType}.`;

  const prompt = `You are generating AP Human Geography quiz questions about world languages.
${weakFamStr}
${typeInstruction}

Here are some languages to choose from (you may also use others from your knowledge):
${sampleLangs}

Generate ONE multiple choice question. It must be AP HUG relevant — about language families, subfamilies, where languages are spoken, their cultural/political role, relationships between languages, or historical diffusion.

Respond with ONLY valid JSON in this exact format, nothing else:
{
  "langName": "the language being asked about",
  "langFamily": "its family",
  "question": "the question text",
  "answer": "the correct answer",
  "opts": ["correct answer", "wrong1", "wrong2", "wrong3"],
  "explanation": "2-3 sentence explanation of why the answer is correct and what's important about this for AP HUG",
  "type": "family|subfamily|location|role|relationship"
}

The opts array must be shuffled (correct answer not always first). All 4 options must be plausible.`;

  const raw = await callClaude([{role:"user",content:prompt}], "", 500);
  try {
    const clean = raw.replace(/```json|```/g,"").trim();
    const parsed = JSON.parse(clean);
    const lang = LANGS.find(l=>l.name===parsed.langName) || {
      id:"ai_"+Date.now(), name:parsed.langName, f:parsed.langFamily,
      sf:"", spoken:"", role:"", note:""
    };
    return { ...parsed, lang, isAI:true };
  } catch(e) { return null; }
}

// ─── AI EXPLANATION ───────────────────────────────────────────────────────────
async function getExplanation(lang, question, userAnswer, correctAnswer, wasCorrect) {
  const langCtx = `Language: ${lang.name}
Family: ${lang.f} / ${lang.sf}
Spoken in: ${lang.spoken}
Cultural/Political role: ${lang.role}
AP HUG context: ${lang.note||""}`;

  const prompt = wasCorrect
    ? `The student correctly answered an AP HUG question about ${lang.name}.
Question: "${question}"
Correct answer: "${correctAnswer}"
${langCtx}

Give a rich 3-4 sentence explanation that reinforces WHY this is correct, adds an interesting AP HUG connection (diffusion, political role, identity, colonialism, etc.), and mentions one related language or concept worth knowing. Be engaging, not dry.`
    : `The student got an AP HUG question about ${lang.name} WRONG.
Question: "${question}"
They answered: "${userAnswer}"
Correct answer: "${correctAnswer}"
${langCtx}

Give a 3-4 sentence explanation that: (1) clearly explains why their answer was wrong, (2) explains the correct answer in depth with AP HUG context, (3) gives a memory hook or connection to help them remember. Be direct but encouraging.`;

  return callClaude([{role:"user",content:prompt}], "You are an AP Human Geography tutor. Be concise, insightful, and always connect to geographic concepts.", 400);
}

// ─── QUIZ MODE ────────────────────────────────────────────────────────────────
function QuizMode({back}) {
  const [q, setQ] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState({c:0,t:0});
  const [quizType, setQuizType] = useState("mixed");
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [explLoading, setExplLoading] = useState(false);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [weakList, setWeakList] = useState([]);
  const chatEndRef = useRef(null);

  const genStaticQ = useCallback(() => {
    const types = quizType==="mixed"
      ? ["family","subfamily","spoken","role","locate"]
      : [quizType];
    const t = types[Math.floor(Math.random()*types.length)];
    const lang = getWeakBiasedLang() || LANGS[Math.floor(Math.random()*LANGS.length)];
    let question, answer, opts=[];
    if(t==="family") {
      question=`What language family does "${lang.name}" belong to?`;
      answer=lang.f;
      opts=getRandItems([answer,...getRandItems(Object.keys(FC).filter(f=>f!==lang.f),3)],4);
    } else if(t==="subfamily") {
      question=`What is the subfamily of "${lang.name}"?`;
      answer=lang.sf;
      opts=getRandItems([answer,...getRandItems([...new Set(LANGS.filter(l=>l.sf!==lang.sf).map(l=>l.sf))],3)],4);
    } else if(t==="spoken") {
      question=`Where is "${lang.name}" primarily spoken?`;
      answer=lang.spoken.split(",")[0];
      opts=getRandItems([answer,...getRandItems(LANGS.filter(l=>l.id!==lang.id).map(l=>l.spoken.split(",")[0]),3)],4);
    } else if(t==="role") {
      question=`"${lang.name}" is best described as:`;
      answer=lang.role;
      opts=getRandItems([answer,...getRandItems(LANGS.filter(l=>l.id!==lang.id).map(l=>l.role),3)],4);
    } else {
      const loc=lang.spoken.split(",")[0].trim();
      question=`Which language is primarily spoken in ${loc}?`;
      answer=lang.name;
      const same=LANGS.filter(l=>l.f===lang.f&&l.id!==lang.id);
      opts=getRandItems([answer,...getRandItems(same.length>=3?same:LANGS.filter(l=>l.id!==lang.id),3).map(l=>l.name)],4);
    }
    setQ({lang,question,answer,opts,type:t,isAI:false});
    setChosen(null); setPanelOpen(false); setExplanation(""); setChat([]);
  },[quizType]);

  const genAIQ = useCallback(async()=>{
    setAiLoading(true); setChosen(null); setPanelOpen(false); setExplanation(""); setChat([]);
    try {
      const weakFams = getWeakFamilies();
      const result = await generateAIQuestion(quizType, weakFams);
      if(result) setQ(result);
      else genStaticQ();
    } catch(e){ genStaticQ(); }
    setAiLoading(false);
  },[quizType,genStaticQ]);

  const nextQ = useCallback(()=>{
    setWeakList(getWeakList());
    if(aiMode) genAIQ(); else genStaticQ();
  },[aiMode,genAIQ,genStaticQ]);

  useEffect(()=>{ if(aiMode) genAIQ(); else genStaticQ(); },[aiMode]);

  const pick = async(o) => {
    if(chosen||aiLoading) return;
    setChosen(o);
    const correct = o===q.answer;
    setScore(s=>({c:s.c+(correct?1:0),t:s.t+1}));
    recordAnswer(q.lang, correct);
    setWeakList(getWeakList());
    // Open panel and fetch explanation
    setPanelOpen(true);
    setExplLoading(true);
    try {
      const expl = await getExplanation(q.lang, q.question, o, q.answer, correct);
      setExplanation(expl);
      // If AI already gave explanation in question, use that too
      if(q.explanation && !correct) setExplanation(q.explanation + "\n\n" + expl);
    } catch(e){ setExplanation(q.lang.note||q.lang.role||""); }
    setExplLoading(false);
  };

  const sendChat = async() => {
    if(!chatInput.trim()||chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newChat = [...chat, {role:"user",content:userMsg}];
    setChat(newChat);
    setChatLoading(true);
    try {
      const langCtx = `We just discussed ${q.lang.name} (${q.lang.f}/${q.lang.sf}), spoken in ${q.lang.spoken}. Role: ${q.lang.role}. ${q.lang.note||""}`;
      const system = `You are an AP Human Geography tutor. The student just answered a quiz question about ${q.lang.name}. Context: ${langCtx}. Answer their follow-up questions concisely (2-4 sentences). Always connect to AP HUG concepts: diffusion, cultural landscape, political geography, language family relationships, etc.`;
      const messages = newChat.map(m=>({role:m.role,content:m.content}));
      const reply = await callClaude(messages, system, 350);
      setChat(c=>[...c,{role:"assistant",content:reply}]);
    } catch(e){ setChat(c=>[...c,{role:"assistant",content:"Sorry, couldn't reach Claude right now."}]); }
    setChatLoading(false);
    setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  if(aiLoading && !q) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,color:T.muted}}>
      <div className="pulse" style={{fontSize:40}}>🤖</div>
      <div style={{fontFamily:T.ff,fontSize:20,color:T.goldLight}}>Generating question…</div>
    </div>
  );
  if(!q) return null;

  const pct = score.t>0?Math.round(score.c/score.t*100):0;
  const col = FC[q.lang.f]||"#888";
  const isCorrect = chosen===q.answer;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 24px",paddingBottom:panelOpen?"360px":"32px",transition:"padding-bottom 0.4s ease"}}>
      <div style={{width:"100%",maxWidth:640}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <button onClick={back} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13}}>← Back</button>
          <div style={{fontFamily:T.ff,fontSize:22,color:T.goldLight}}>Quiz</div>
          <div style={{fontSize:13,color:T.muted,textAlign:"right"}}>
            <span style={{color:"#34d399"}}>{score.c}</span><span style={{color:T.muted}}>/{score.t}</span>
            {score.t>0&&<span style={{color:T.gold,marginLeft:8}}>{pct}%</span>}
          </div>
        </div>

        {/* AI / Static toggle */}
        <div style={{display:"flex",gap:8,marginBottom:20,justifyContent:"center",alignItems:"center"}}>
          <div style={{display:"flex",background:T.card,borderRadius:20,padding:4,border:`1px solid ${T.border}`}}>
            <button onClick={()=>setAiMode(false)} style={{
              background:!aiMode?T.card2:"transparent",border:"none",
              color:!aiMode?T.text:T.muted,borderRadius:16,padding:"5px 16px",
              fontSize:12,cursor:"pointer",fontFamily:T.fb,fontWeight:600,transition:"all 0.2s"
            }}>📚 Classic</button>
            <button onClick={()=>setAiMode(true)} style={{
              background:aiMode?"linear-gradient(135deg,#4e91f733,#a78bfa33)":"transparent",
              border:"none",color:aiMode?T.goldLight:T.muted,borderRadius:16,padding:"5px 16px",
              fontSize:12,cursor:"pointer",fontFamily:T.fb,fontWeight:600,transition:"all 0.2s"
            }}>✨ AI Mode</button>
          </div>
        </div>

        {/* Type selector */}
        <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap",justifyContent:"center"}}>
          {["mixed","family","subfamily","spoken","locate","role"].map(t=>(
            <button key={t} onClick={()=>setQuizType(t)} style={{
              background:quizType===t?T.gold+"33":"transparent",
              border:`1px solid ${quizType===t?T.gold:T.border}`,
              color:quizType===t?T.goldLight:T.muted,
              borderRadius:20,padding:"4px 12px",fontSize:11,cursor:"pointer",
              fontFamily:T.fb,fontWeight:500,textTransform:"capitalize"
            }}>{t}</button>
          ))}
        </div>

        {/* Weak spots bar */}
        {weakList.length>0&&(
          <div style={{background:`${T.gold}10`,border:`1px solid ${T.gold}22`,borderRadius:12,padding:"10px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:T.gold,fontWeight:700,flexShrink:0}}>🎯 WEAK SPOTS</span>
            {weakList.map(w=>(
              <span key={w.name} style={{background:`${FC[w.family]||"#888"}22`,color:FC[w.family]||"#888",borderRadius:20,padding:"2px 10px",fontSize:11}}>
                {w.name} <span style={{opacity:0.6}}>×{w.wrong}</span>
              </span>
            ))}
          </div>
        )}

        {/* AI generating indicator */}
        {aiLoading&&(
          <div className="pulse" style={{textAlign:"center",color:T.muted,fontSize:13,marginBottom:12}}>✨ Claude is generating your question…</div>
        )}

        {/* Question card */}
        <div className="fade-in" key={score.t} style={{
          background:T.card,border:`1px solid ${col}44`,borderRadius:16,
          padding:"24px 28px",marginBottom:16,position:"relative"
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:10,letterSpacing:3,color:col,textTransform:"uppercase",fontWeight:600}}>{(q.type||"").toUpperCase()} · {q.lang.f}</div>
            {q.isAI&&<span style={{background:"linear-gradient(135deg,#4e91f733,#a78bfa33)",border:"1px solid #4e91f755",color:"#a78bfa",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700}}>✨ AI</span>}
          </div>
          <p style={{fontFamily:T.ff,fontSize:19,color:T.text,lineHeight:1.55,margin:0}}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {q.opts.map((o,i)=>{
            const isC=o===q.answer, isCh=o===chosen;
            let bg=T.card,border=T.border,color=T.text;
            if(chosen){
              if(isC){bg="#10b98120";border="#10b981";color="#34d399";}
              else if(isCh){bg="#ef444420";border="#ef4444";color="#f87171";}
            }
            return (
              <button key={i} className="quiz-opt" onClick={()=>pick(o)} style={{
                background:bg,border:`1px solid ${border}`,color,
                borderRadius:12,padding:"13px 18px",textAlign:"left",
                cursor:chosen?"default":"pointer",fontSize:14,lineHeight:1.5,fontFamily:T.fb
              }}>{o}</button>
            );
          })}
        </div>

        {/* Next button (visible after answer, when panel is open) */}
        {chosen&&(
          <button onClick={nextQ} disabled={aiLoading} style={{
            width:"100%",padding:"14px",background:T.gold,border:"none",color:"#0a0e1a",
            borderRadius:12,fontSize:15,cursor:aiLoading?"not-allowed":"pointer",
            fontFamily:T.fb,fontWeight:700,opacity:aiLoading?0.5:1
          }}>{aiLoading?"Generating next…":"Next Question →"}</button>
        )}
      </div>

      {/* ── SLIDE-UP AI PANEL ── */}
      <div style={{
        position:"fixed",bottom:0,left:0,right:0,
        transform:panelOpen?"translateY(0)":"translateY(100%)",
        transition:"transform 0.4s cubic-bezier(0.4,0,0.2,1)",
        background:"#0d1628",borderTop:`2px solid ${isCorrect?"#10b981":"#ef4444"}`,
        borderRadius:"20px 20px 0 0",
        maxHeight:"340px",display:"flex",flexDirection:"column",
        boxShadow:"0 -20px 60px rgba(0,0,0,0.6)",zIndex:100
      }}>
        {/* Panel header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px 10px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>{isCorrect?"✅":"❌"}</span>
            <span style={{fontFamily:T.ff,fontSize:15,color:isCorrect?"#34d399":"#f87171",fontWeight:700}}>
              {isCorrect?"Correct!":"Incorrect"}
            </span>
            <span style={{fontSize:13,color:T.muted}}>— {q.lang.name}</span>
          </div>
          <button onClick={()=>setPanelOpen(false)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
        </div>

        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {/* Explanation */}
          <div style={{padding:"12px 20px",flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
            {explLoading
              ? <div className="pulse" style={{color:T.muted,fontSize:13}}>✨ Claude is explaining…</div>
              : <p style={{fontSize:13,color:T.text,lineHeight:1.65,margin:0}}>{explanation}</p>
            }
          </div>

          {/* Chat history */}
          {chat.length>0&&(
            <div style={{flex:1,overflowY:"auto",padding:"10px 20px",display:"flex",flexDirection:"column",gap:8}}>
              {chat.map((m,i)=>(
                <div key={i} style={{
                  alignSelf:m.role==="user"?"flex-end":"flex-start",
                  background:m.role==="user"?`${T.gold}22`:T.card2,
                  border:`1px solid ${m.role==="user"?T.gold+"44":T.border}`,
                  borderRadius:10,padding:"8px 14px",maxWidth:"85%",
                  fontSize:13,color:T.text,lineHeight:1.55
                }}>{m.content}</div>
              ))}
              {chatLoading&&<div className="pulse" style={{color:T.muted,fontSize:12,alignSelf:"flex-start"}}>Claude is typing…</div>}
              <div ref={chatEndRef}/>
            </div>
          )}

          {/* Chat input */}
          <div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8,flexShrink:0}}>
            <input
              value={chatInput}
              onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&sendChat()}
              placeholder={`Ask anything about ${q.lang.name}…`}
              style={{
                flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,
                padding:"9px 14px",color:T.text,fontSize:13,outline:"none",fontFamily:T.fb
              }}
            />
            <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{
              background:T.gold,border:"none",color:"#0a0e1a",borderRadius:10,
              padding:"9px 16px",fontSize:13,cursor:"pointer",fontFamily:T.fb,fontWeight:700,
              opacity:chatLoading||!chatInput.trim()?0.4:1,flexShrink:0
            }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── MAP MODE ─────────────────────────────────────────────────────────────────
// ─── LANGUAGE → PRIMARY COUNTRY NUMERIC IDs (world-atlas) ────────────────────
const LANG_NUMS = {
  // Indo-European / Celtic
  "gaelic":     ["826","372"],       // UK, Ireland
  "welsh":      ["826"],
  "cornish":    ["826"],
  "manx":       ["826"],
  "breton":     ["250"],             // France
  // Germanic
  "german":     ["276"],
  "high-german":["276","040","756"],
  "bavarian":   ["276","040"],
  "swiss-german":["756"],
  "central-german":["276"],
  "low-german": ["276","528"],
  "dutch":      ["528"],
  "flemish":    ["056"],             // Belgium
  "english":    ["840","826","036","124","554"],
  "danish":     ["208"],
  "norwegian":  ["578"],
  "swedish":    ["752"],
  "finland-swedish":["246"],
  "icelandic":  ["352"],
  "faroese":    ["234"],
  "yiddish":    ["376","840"],       // Israel, USA
  "afrikaans":  ["710","516"],       // S Africa, Namibia
  // Romance
  "italian":    ["380"],
  "spanish":    ["724","484","170","604","858","032","152","218","068","862","600","320","222","332","591","630"],
  "aragonese":  ["724"],
  "occitan":    ["250"],
  "catalan":    ["724"],
  "galician":   ["724"],
  "portuguese": ["620","076","508","024"],
  "french":     ["250","056","756","124"],
  "walloon":    ["056"],
  "swiss-french":["756"],
  "corsican":   ["250"],
  "romanian":   ["642"],
  "romansh":    ["756"],
  // Slavic
  "russian":    ["643"],
  "ukrainian":  ["804"],
  "belarusian": ["112"],
  "rusyn":      ["616","703","804"],
  "polish":     ["616"],
  "czech":      ["203"],
  "slovak":     ["703"],
  "kashubian":  ["616"],
  "serbian":    ["688"],
  "croatian":   ["191"],
  "slovenian":  ["705"],
  "bosnian":    ["070"],
  "montenegrin":["499"],
  "bulgarian":  ["100"],
  "macedonian": ["807"],
  // Hellenic
  "greek":      ["300","196"],
  // Armenian / Albanian / Baltic
  "armenian":   ["051"],
  "albanian":   ["008","383"],
  "latvian":    ["428"],
  "lithuanian": ["440"],
  // Indo-Iranian
  "persian":    ["364"],
  "pashto":     ["004","586"],
  "dari":       ["004"],
  "tajiki":     ["762"],
  "balochi":    ["586","364","004"],
  "kurdish":    ["792","368","364","760"],
  // Indo-Aryan
  "sanskrit":   ["356"],
  "hindustani": ["356","586"],
  "bengali":    ["050","356"],
  "rohingya":   ["104","050"],
  "sinhala":    ["144"],
  "nepali":     ["524"],
  "punjabi":    ["356","586"],
  "gujarati":   ["356"],
  "marathi":    ["356"],
  "dhivehi":    ["462"],
  // Caucasian
  "abkhaz":     ["268"],
  "chechen":    ["643"],
  "georgian":   ["268"],
  // Uralic
  "sami":       ["578","752","246","643"],
  "finnish":    ["246"],
  "estonian":   ["233"],
  "hungarian":  ["348"],
  // Dravidian
  "tamil":      ["356","144","702"],
  "telugu":     ["356"],
  // Turkic
  "turkish":    ["792"],
  "turkmen":    ["795"],
  "azeri":      ["031"],
  "kyrgyz":     ["417"],
  "uzbek":      ["860"],
  "kazakh":     ["398"],
  "uyghur":     ["156"],
  "bashkir":    ["643"],
  "volga-tatar":["643"],
  "crimean-tatar":["804"],
  "siberian-tatar":["643"],
  "afghan-tatar":["004"],
  // Mongolic
  "mongolian":  ["496","156"],
  // Tungusic
  "manchu":     ["156"],
  // Nilo-Saharan
  "songhai":    ["562","466"],       // Niger, Mali
  "saharan-langs":["148","562"],     // Chad, Niger
  "central-sudanic":["140","148","728","800","180","120"],
  "eastern-sudanic":["818","148","232","231","834"],
  // Niger-Congo A
  "yoruba":     ["566","204","768"],
  "igbo":       ["566"],
  "fula":       ["324","686","566","466","120"],
  // Niger-Congo B (Bantu)
  "zulu":       ["710"],
  "xhosa":      ["710"],
  "swahili":    ["834","404","180","800","646"],
  // Khoisan
  "khoisan":    ["072","516","024","894","716"],
  // Afro-Asiatic / Chadic
  "hausa":      ["566","562"],
  // Cushitic
  "oromo":      ["231","404"],
  "somali":     ["706","262","231","404"],
  "afar":       ["262","232","231"],
  // Egyptian
  "ancient-egyptian":["818"],
  // Semitic
  "akkadian":   ["368"],
  "phoenician": ["422"],
  "hebrew":     ["376"],
  "aramaic":    ["368","760","792","364"],
  "arabic":     ["682","818","504","012","788","434","760","368","400","422","887","784","512","414","634","048","275"],
  "amharic":    ["231"],
  "tigrinya":   ["232","231"],
  "tigre":      ["232"],
  "maltese":    ["470"],
  // Austronesian
  "bahasa-indo":["360"],
  "bahasa-malay":["458","360","096","702"],
  "javanese":   ["360"],
  "sundanese":  ["360"],
  "malagasy":   ["450"],
  "tagalog":    ["608"],
  "cebuano":    ["608"],
  "ilocano":    ["608"],
  "chabacano":  ["608"],
  "hawaiian":   ["840"],
  "tahitian":   ["258"],
  "tongan":     ["776"],
  "samoan":     ["882","016"],
  "maori":      ["554"],
  "cook-maori": ["184"],
  "melanesian": ["090","548","242","598"],
  "micronesian":["583","584","585","520","316"],
  "formosan":   ["158"],
  // Papuan
  "tok-pisin":  ["598"],
  "hiro-motu":  ["598"],
  "pama-nyungan":["036"],
  // Sino-Tibetan
  "mandarin":   ["156","158","702"],
  "cantonese":  ["156","344","446"],
  "tibetan":    ["156","356"],
  "burmese":    ["104"],
  "dzongkha":   ["064"],
  "karenic":    ["764","104"],
  // Austro-Asiatic
  "vietnamese": ["704"],
  "khmer":      ["116"],
  "mon":        ["104"],
  // Kra-Dai
  "thai":       ["764"],
  "lao":        ["418"],
  "shan":       ["104","764"],
  // Hmongic
  "hmong":      ["156","704","418","764"],
  // Japonic
  "japanese":   ["392"],
  "ryukyuan":   ["392"],
  "ainu":       ["392"],
  // Koreanic
  "korean":     ["410","408"],
  "jeju":       ["410"],
  // Creoles
  "sranan-tongo":["740"],
  "guyanese-creole":["328"],
  "papiamento": ["533","535","531"],
  "louisiana-haitian":["332","840"],
  "bahamian-jamaican-gullah":["044","388","840"],
};

// Regions grouping (ISO2 → region name)
const REGIONS = {
  "Western Europe":["GB","IE","FR","DE","AT","CH","BE","NL","LU","DK","NO","SE","FI","IS","PT","ES","IT","MT"],
  "Eastern Europe":["PL","CZ","SK","HU","RO","BG","UA","BY","RU","RS","HR","BA","SI","ME","MK","AL","EE","LV","LT","MD","GE","AM","AZ"],
  "Middle East & N Africa":["SA","AE","IQ","IR","SY","LB","JO","IL","TR","EG","MA","DZ","TN","LY","YE","OM","KW","QA","BH"],
  "Sub-Saharan Africa":["NG","GH","KE","TZ","ET","SN","CM","CD","ZA","ZW","ZM","MW","UG","RW","MZ","AO","GA","CG","CF","TD","SS","SD","ML","NE","BF","BJ","TG","GN","CI","SO","ER","DJ"],
  "South Asia":["IN","PK","BD","NP","LK","AF","BT","MV"],
  "East Asia":["CN","JP","KR","KP","TW","MN"],
  "SE Asia":["VN","KH","TH","LA","MM","ID","MY","PH","SG","BN","TL"],
  "Central Asia":["KZ","UZ","TM","KG","TJ"],
  "Americas":["US","CA","MX","BR","AR","CL","CO","PE","VE","EC","BO","PY","UY","SR","GY","HT","JM","BS"],
  "Oceania":["AU","NZ","PG","FJ","SB","VU","WS","TO","KI","MH","FM","PW"],
};

// ISO2 → region
const ISO_TO_REGION = {};
Object.entries(REGIONS).forEach(([reg,isos])=>isos.forEach(iso=>{ ISO_TO_REGION[iso]=reg; }));

// num → ISO2 (subset for quiz matching)
const NUM_TO_ISO2 = {
  "004":"AF","008":"AL","012":"DZ","016":"AS","024":"AO","031":"AZ","032":"AR",
  "036":"AU","040":"AT","044":"BS","048":"BH","050":"BD","056":"BE","064":"BT",
  "068":"BO","070":"BA","072":"BW","076":"BR","096":"BN","100":"BG","104":"MM",
  "108":"BI","112":"BY","116":"KH","120":"CM","124":"CA","140":"CF","144":"LK",
  "148":"TD","152":"CL","156":"CN","158":"TW","170":"CO","180":"CD","184":"CK",
  "188":"CR","191":"HR","196":"CY","203":"CZ","204":"BJ","208":"DK","218":"EC",
  "222":"SV","231":"ET","232":"ER","233":"EE","234":"FO","242":"FJ","246":"FI",
  "250":"FR","258":"PF","262":"DJ","266":"GA","268":"GE","276":"DE","288":"GH",
  "300":"GR","316":"GU","320":"GT","324":"GN","328":"GY","332":"HT","340":"HN",
  "344":"HK","348":"HU","352":"IS","356":"IN","360":"ID","364":"IR","368":"IQ",
  "372":"IE","376":"IL","380":"IT","383":"XK","388":"JM","392":"JP","398":"KZ",
  "400":"JO","404":"KE","408":"KP","410":"KR","414":"KW","417":"KG","418":"LA",
  "422":"LB","426":"LS","428":"LV","434":"LY","440":"LT","446":"MO","450":"MG",
  "454":"MW","458":"MY","462":"MV","466":"ML","470":"MT","478":"MR","484":"MX",
  "496":"MN","498":"MD","499":"ME","504":"MA","508":"MZ","512":"OM","516":"NA",
  "520":"NR","524":"NP","528":"NL","531":"CW","533":"AW","535":"BQ","540":"NC",
  "548":"VU","554":"NZ","558":"NI","562":"NE","566":"NG","578":"NO","583":"FM",
  "584":"MH","585":"PW","586":"PK","591":"PA","598":"PG","600":"PY","604":"PE",
  "608":"PH","616":"PL","620":"PT","630":"PR","634":"QA","642":"RO","643":"RU",
  "646":"RW","682":"SA","686":"SN","688":"RS","694":"SL","702":"SG","703":"SK",
  "704":"VN","705":"SI","706":"SO","710":"ZA","716":"ZW","724":"ES","728":"SS",
  "740":"SR","748":"SZ","752":"SE","756":"CH","760":"SY","762":"TJ","764":"TH",
  "768":"TG","776":"TO","780":"TT","784":"AE","788":"TN","792":"TR","795":"TM",
  "800":"UG","804":"UA","807":"MK","818":"EG","826":"GB","834":"TZ","840":"US",
  "854":"BF","858":"UY","860":"UZ","862":"VE","882":"WS","887":"YE","894":"ZM",
};

const ISO2_NAMES = {
  AF:"Afghanistan",AL:"Albania",DZ:"Algeria",AO:"Angola",AR:"Argentina",AM:"Armenia",
  AU:"Australia",AT:"Austria",AZ:"Azerbaijan",BD:"Bangladesh",BY:"Belarus",BE:"Belgium",
  BT:"Bhutan",BO:"Bolivia",BA:"Bosnia",BW:"Botswana",BR:"Brazil",BG:"Bulgaria",
  KH:"Cambodia",CM:"Cameroon",CA:"Canada",CL:"Chile",CN:"China",CO:"Colombia",
  HR:"Croatia",CY:"Cyprus",CZ:"Czech Republic",CD:"DR Congo",DK:"Denmark",DJ:"Djibouti",
  EG:"Egypt",ER:"Eritrea",ET:"Ethiopia",FI:"Finland",FR:"France",GA:"Gabon",GE:"Georgia",
  DE:"Germany",GH:"Ghana",GR:"Greece",GN:"Guinea",GY:"Guyana",HT:"Haiti",IN:"India",
  ID:"Indonesia",IR:"Iran",IQ:"Iraq",IE:"Ireland",IL:"Israel",IT:"Italy",JP:"Japan",
  JO:"Jordan",KZ:"Kazakhstan",KE:"Kenya",KP:"N. Korea",KR:"S. Korea",KW:"Kuwait",
  KG:"Kyrgyzstan",LA:"Laos",LB:"Lebanon",LT:"Lithuania",LV:"Latvia",MG:"Madagascar",
  MY:"Malaysia",ML:"Mali",MT:"Malta",MX:"Mexico",MN:"Mongolia",MA:"Morocco",
  MZ:"Mozambique",MM:"Myanmar",NA:"Namibia",NP:"Nepal",NL:"Netherlands",NZ:"New Zealand",
  NG:"Nigeria",MK:"N. Macedonia",NO:"Norway",OM:"Oman",PK:"Pakistan",PG:"Papua New Guinea",
  PE:"Peru",PH:"Philippines",PL:"Poland",PT:"Portugal",QA:"Qatar",RO:"Romania",RU:"Russia",
  RW:"Rwanda",SA:"Saudi Arabia",SN:"Senegal",RS:"Serbia",SI:"Slovenia",SO:"Somalia",
  ZA:"South Africa",SS:"S. Sudan",ES:"Spain",LK:"Sri Lanka",SR:"Suriname",SE:"Sweden",
  CH:"Switzerland",SY:"Syria",TJ:"Tajikistan",TZ:"Tanzania",TH:"Thailand",TG:"Togo",
  TN:"Tunisia",TR:"Turkey",TM:"Turkmenistan",UG:"Uganda",UA:"Ukraine",AE:"UAE",
  GB:"United Kingdom",US:"United States",UY:"Uruguay",UZ:"Uzbekistan",VE:"Venezuela",
  VN:"Vietnam",YE:"Yemen",ZM:"Zambia",ZW:"Zimbabwe",TW:"Taiwan",XK:"Kosovo",
  ME:"Montenegro",MD:"Moldova",SK:"Slovakia",
};

// ─── MAP MODE ─────────────────────────────────────────────────────────────────
function MapMode({back}) {
  const [subMode, setSubMode] = useState("explore"); // explore | quiz
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      {/* Sub-mode toggle */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"20px 24px 0"}}>
        <button onClick={back} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13,flexShrink:0}}>← Back</button>
        <div style={{flex:1,display:"flex",justifyContent:"center",gap:8}}>
          {[["explore","🌍 Explore"],["quiz","🎯 Map Quiz"]].map(([id,label])=>(
            <button key={id} onClick={()=>setSubMode(id)} style={{
              background:subMode===id?T.gold+"33":"transparent",
              border:`1px solid ${subMode===id?T.gold:T.border}`,
              color:subMode===id?T.goldLight:T.muted,
              borderRadius:20,padding:"6px 20px",fontSize:13,cursor:"pointer",fontFamily:T.fb,fontWeight:600
            }}>{label}</button>
          ))}
        </div>
        <div style={{width:60}}/>
      </div>
      {subMode==="explore" ? <ExploreMap/> : <QuizMap/>}
    </div>
  );
}

// ─── EXPLORE MAP ──────────────────────────────────────────────────────────────
function ExploreMap() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [selFam, setSelFam] = useState(null);
  const [w, setW] = useState(900);
  const h = Math.max(360, w*0.5);

  useEffect(()=>{
    if(!containerRef.current) return;
    const ro=new ResizeObserver(es=>{ const cw=es[0].contentRect.width; if(cw>0) setW(cw); });
    ro.observe(containerRef.current);
    setW(containerRef.current.clientWidth||900);
    return ()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    let dead=false;
    loadTopo().then(geo=>{ if(!dead){setGeoData(geo);setLoading(false);} }).catch(()=>{ if(!dead){setLoading(false);setLoadErr(true);} });
    return ()=>{dead=true;};
  },[]);

  useEffect(()=>{
    if(!geoData||!svgRef.current||w===0) return;
    drawExplore(svgRef.current,geoData,w,h,selFam,setHovered);
  },[geoData,selFam,w,h]);

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"16px 24px 24px"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16,justifyContent:"center"}}>
        {Object.entries(FC).map(([fam,col])=>(
          <button key={fam} onClick={()=>setSelFam(selFam===fam?null:fam)} style={{
            background:selFam===fam?`${col}44`:`${col}18`,border:`1px solid ${selFam===fam?col:`${col}44`}`,
            color:selFam===fam?col:`${col}cc`,borderRadius:20,padding:"3px 11px",fontSize:11,
            cursor:"pointer",fontFamily:T.fb,fontWeight:600,transition:"all 0.15s"
          }}>{fam}</button>
        ))}
        {selFam&&<button onClick={()=>setSelFam(null)} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:20,padding:"3px 11px",fontSize:11,cursor:"pointer",fontFamily:T.fb}}>✕</button>}
      </div>
      <div ref={containerRef} style={{background:"#09111f",borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden",flex:1,position:"relative",minHeight:360}}>
        {loading&&!loadErr&&<MapLoader/>}
        {loadErr&&<MapError/>}
        {!loading&&!loadErr&&<svg ref={svgRef} style={{display:"block",width:"100%"}}/>}
        {hovered&&(
          <div style={{position:"absolute",top:12,right:12,background:T.card2,border:`1px solid ${hovered.fam?FC[hovered.fam]+"66":T.border}`,borderRadius:10,padding:"12px 16px",minWidth:160,pointerEvents:"none"}}>
            <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:3}}>{hovered.name}</div>
            {hovered.fam
              ?<div style={{fontSize:12,color:FC[hovered.fam],fontWeight:600}}>{hovered.fam}</div>
              :<div style={{fontSize:12,color:T.muted}}>No data</div>
            }
          </div>
        )}
      </div>
      <div style={{fontSize:11,color:T.muted,textAlign:"center",marginTop:8}}>Hover countries · Click chip to isolate family</div>
    </div>
  );
}

// ─── QUIZ MAP ─────────────────────────────────────────────────────────────────
function QuizMap() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);
  const [w, setW] = useState(900);
  const h = Math.max(340, w*0.48);

  // Quiz state
  const [quizMode, setQuizMode] = useState(null); // null=pick mode, "family"|"region"|"world"
  const [modeVal, setModeVal] = useState(null);   // which family or region
  const [pool, setPool] = useState([]);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | {correct,clickedIso,correctIsos,name}
  const [score, setScore] = useState({c:0,t:0});
  const [streak, setStreak] = useState(0);

  useEffect(()=>{
    if(!containerRef.current) return;
    const ro=new ResizeObserver(es=>{ const cw=es[0].contentRect.width; if(cw>0) setW(cw); });
    ro.observe(containerRef.current);
    setW(containerRef.current.clientWidth||900);
    return ()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    let dead=false;
    loadTopo().then(geo=>{ if(!dead){setGeoData(geo);setLoading(false);} }).catch(()=>{ if(!dead){setLoading(false);setLoadErr(true);} });
    return ()=>{dead=true;};
  },[]);

  // Current question lang
  const curLang = pool[idx] || null;

  // Build pool when mode selected
  const startQuiz = (mode, val) => {
    setQuizMode(mode); setModeVal(val);
    let langs = LANGS.filter(l=>LANG_NUMS[l.id]&&LANG_NUMS[l.id].length>0);
    if(mode==="family") langs = langs.filter(l=>l.f===val);
    if(mode==="region"){
      const regionISOs = REGIONS[val]||[];
      langs = langs.filter(l=>{
        const nums = LANG_NUMS[l.id]||[];
        return nums.some(n=>regionISOs.includes(NUM_TO_ISO2[n]));
      });
    }
    const shuffled = getRandItems(langs, langs.length);
    setPool(shuffled); setIdx(0); setFeedback(null); setScore({c:0,t:0}); setStreak(0);
  };

  // Draw map for quiz
  useEffect(()=>{
    if(!geoData||!svgRef.current||w===0||!quizMode) return;
    const correctNums = curLang ? (LANG_NUMS[curLang.id]||[]) : [];
    const clickedIso = feedback?.clickedIso||null;
    const isCorrect = feedback?.correct||false;

    const svg=d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox",`0 0 ${w} ${h}`).attr("width",w).attr("height",h);
    svg.append("rect").attr("width",w).attr("height",h).attr("fill","#09111f");
    const proj=d3.geoNaturalEarth1().scale(w/6.3).translate([w/2,h/2+6]);
    const pathFn=d3.geoPath().projection(proj);
    svg.append("path").datum(d3.geoGraticule()()).attr("d",pathFn)
      .attr("fill","none").attr("stroke","#1a2540").attr("stroke-width",0.4);

    const fam = curLang ? (FC[curLang.f]||"#888") : "#888";

    svg.selectAll("path.country")
      .data(geoData.features).enter().append("path").attr("class","country")
      .attr("d",pathFn)
      .attr("fill",d=>{
        const num=String(d.id||"").padStart(3,"0");
        const iso=NUM_TO_ISO2[num]||"";
        if(feedback){
          if(correctNums.includes(num)) return "#10b981cc"; // correct = green
          if(iso===clickedIso&&!isCorrect) return "#ef4444cc"; // wrong click = red
        }
        return "#151e2e";
      })
      .attr("stroke","#09111f").attr("stroke-width",0.5)
      .style("cursor", feedback?"default":"crosshair")
      .on("mouseover", function(ev,d){
        if(feedback) return;
        const num=String(d.id||"").padStart(3,"0");
        const iso=NUM_TO_ISO2[num]||"";
        if(iso) d3.select(this).attr("fill","#2a3a5a");
      })
      .on("mouseout", function(ev,d){
        if(feedback) return;
        d3.select(this).attr("fill","#151e2e");
      })
      .on("click", function(ev,d){
        if(feedback) return;
        const num=String(d.id||"").padStart(3,"0");
        const iso=NUM_TO_ISO2[num]||"";
        if(!iso) return;
        const correct=correctNums.includes(num);
        const newScore={c:score.c+(correct?1:0),t:score.t+1};
        setScore(newScore);
        setStreak(correct?streak+1:0);
        setFeedback({correct,clickedIso:iso,correctNums,correctName:ISO2_NAMES[NUM_TO_ISO2[correctNums[0]]]||""});
      });
  },[geoData,w,h,curLang,feedback,quizMode]);

  const next = () => {
    setFeedback(null);
    if(idx+1<pool.length) setIdx(i=>i+1);
    else { setIdx(0); setPool(p=>getRandItems(p,p.length)); }
  };

  // Mode picker screen
  if(!quizMode) return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",gap:32}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:T.ff,fontSize:28,color:T.goldLight,marginBottom:8}}>Choose a Mode</div>
        <div style={{color:T.muted,fontSize:14}}>A language will appear — click where it's spoken on the map</div>
      </div>
      {/* World */}
      <button onClick={()=>startQuiz("world",null)} style={{
        background:`${T.gold}22`,border:`2px solid ${T.gold}`,borderRadius:16,
        padding:"20px 40px",cursor:"pointer",textAlign:"center",width:"100%",maxWidth:400
      }}>
        <div style={{fontSize:28,marginBottom:6}}>🌍</div>
        <div style={{fontFamily:T.ff,fontSize:20,color:T.goldLight,marginBottom:4}}>Whole World</div>
        <div style={{color:T.muted,fontSize:13}}>{LANGS.filter(l=>LANG_NUMS[l.id]).length} languages across all families</div>
      </button>
      {/* By Family */}
      <div style={{width:"100%",maxWidth:700}}>
        <div style={{fontSize:11,letterSpacing:3,color:T.muted,textTransform:"uppercase",marginBottom:12,textAlign:"center"}}>By Language Family</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {Object.entries(FC).map(([fam,col])=>{
            const count=LANGS.filter(l=>l.f===fam&&LANG_NUMS[l.id]).length;
            if(count===0) return null;
            return (
              <button key={fam} onClick={()=>startQuiz("family",fam)} style={{
                background:`${col}22`,border:`1px solid ${col}66`,color:col,
                borderRadius:12,padding:"8px 16px",cursor:"pointer",fontFamily:T.fb,fontWeight:600,fontSize:12
              }}>{fam} <span style={{opacity:0.6,fontWeight:400}}>({count})</span></button>
            );
          })}
        </div>
      </div>
      {/* By Region */}
      <div style={{width:"100%",maxWidth:700}}>
        <div style={{fontSize:11,letterSpacing:3,color:T.muted,textTransform:"uppercase",marginBottom:12,textAlign:"center"}}>By Region</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {Object.keys(REGIONS).map(reg=>{
            const regionISOs=REGIONS[reg];
            const count=LANGS.filter(l=>{ const nums=LANG_NUMS[l.id]||[]; return nums.some(n=>regionISOs.includes(NUM_TO_ISO2[n])); }).length;
            return (
              <button key={reg} onClick={()=>startQuiz("region",reg)} style={{
                background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,color:T.text,
                borderRadius:12,padding:"8px 16px",cursor:"pointer",fontFamily:T.fb,fontSize:12
              }}>{reg} <span style={{color:T.muted,fontWeight:400}}>({count})</span></button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const pct = score.t>0?Math.round(score.c/score.t*100):0;
  const col = curLang ? (FC[curLang.f]||"#888") : "#888";

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"12px 20px 20px",gap:10}}>
      {/* HUD */}
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <button onClick={()=>setQuizMode(null)} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:20,padding:"4px 12px",fontSize:12,cursor:"pointer",fontFamily:T.fb}}>
          ← Modes
        </button>
        <div style={{flex:1,fontFamily:T.ff,fontSize:15,color:T.muted}}>
          {quizMode==="world"?"🌍 World":quizMode==="family"?`◆ ${modeVal}`:`📍 ${modeVal}`}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {streak>=3&&<span style={{background:"#f59e0b33",color:"#fbbf24",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700}}>🔥 {streak}</span>}
          <span style={{color:"#34d399",fontWeight:700,fontSize:14}}>{score.c}</span>
          <span style={{color:T.muted,fontSize:14}}>/{score.t}</span>
          {score.t>0&&<span style={{color:T.gold,fontSize:13}}>{pct}%</span>}
          <span style={{color:T.muted,fontSize:12}}>{idx+1}/{pool.length}</span>
        </div>
      </div>

      {/* Language prompt */}
      {curLang&&(
        <div style={{
          background:`linear-gradient(135deg,${col}22,${col}0a)`,
          border:`1px solid ${col}44`,borderRadius:14,
          padding:"14px 20px",textAlign:"center",position:"relative"
        }}>
          <div style={{fontSize:10,letterSpacing:4,color:col,textTransform:"uppercase",fontWeight:600,marginBottom:4}}>{curLang.f} · {curLang.sf}</div>
          <div style={{fontFamily:T.ff,fontSize:"clamp(22px,4vw,36px)",fontWeight:900,color:T.text}}>{curLang.name}</div>
          {!feedback&&<div style={{fontSize:12,color:T.muted,marginTop:4}}>Click where this language is spoken</div>}
        </div>
      )}

      {/* Map */}
      <div ref={containerRef} style={{background:"#09111f",borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden",flex:1,position:"relative",minHeight:280}}>
        {loading&&!loadErr&&<MapLoader/>}
        {loadErr&&<MapError/>}
        {!loading&&!loadErr&&<svg ref={svgRef} style={{display:"block",width:"100%"}}/>}
      </div>

      {/* Feedback bar */}
      {feedback&&(
        <div className="fade-in" style={{
          background:feedback.correct?"#10b98120":"#ef444420",
          border:`1px solid ${feedback.correct?"#10b981":"#ef4444"}`,
          borderRadius:12,padding:"12px 20px",
          display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12
        }}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:feedback.correct?"#34d399":"#f87171",marginBottom:2}}>
              {feedback.correct?"✓ Correct!":"✗ Not quite"}
            </div>
            <div style={{fontSize:13,color:T.muted}}>
              {feedback.correct
                ? `${curLang?.name} is spoken in the highlighted region`
                : `${curLang?.name} is spoken in the green area`
              }
              {curLang&&<span style={{color:T.text}}> · {curLang.spoken.split(",")[0]}</span>}
            </div>
          </div>
          <button onClick={next} style={{
            background:T.gold,border:"none",color:"#0a0e1a",borderRadius:10,
            padding:"10px 24px",fontSize:14,cursor:"pointer",fontFamily:T.fb,fontWeight:700,flexShrink:0
          }}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── SHARED MAP HELPERS ───────────────────────────────────────────────────────
async function loadTopo() {
  const urls=[
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
    "https://unpkg.com/world-atlas@2/countries-110m.json",
  ];
  for(const url of urls){
    try{
      const res=await fetch(url); if(!res.ok) continue;
      const topo=await res.json();
      if(!window._topojson){
        const s=document.createElement("script");
        s.src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
        document.head.appendChild(s);
        await new Promise((r,j)=>{s.onload=r;s.onerror=j;});
        window._topojson=window.topojson;
      }
      return window._topojson.feature(topo,topo.objects.countries);
    } catch(e){ continue; }
  }
  throw new Error("Could not load map");
}

function drawExplore(el, geoData, w, h, selFam, setHovered){
  const svg=d3.select(el);
  svg.selectAll("*").remove();
  svg.attr("viewBox",`0 0 ${w} ${h}`).attr("width",w).attr("height",h);
  svg.append("rect").attr("width",w).attr("height",h).attr("fill","#09111f");
  const proj=d3.geoNaturalEarth1().scale(w/6.3).translate([w/2,h/2+8]);
  const pathFn=d3.geoPath().projection(proj);
  svg.append("path").datum(d3.geoGraticule()()).attr("d",pathFn)
    .attr("fill","none").attr("stroke","#1a2540").attr("stroke-width",0.4);
  svg.selectAll("path.country").data(geoData.features).enter().append("path").attr("class","country")
    .attr("d",pathFn)
    .attr("fill",d=>{
      const iso=NUM_TO_ISO2[String(d.id||"").padStart(3,"0")]||"";
      const fam=CF[iso];
      if(!fam) return "#151e2e";
      if(selFam&&fam!==selFam) return "#151e2e";
      return (FC[fam]||"#888")+"99";
    })
    .attr("stroke","#09111f").attr("stroke-width",0.6)
    .style("cursor","pointer")
    .on("mouseover",function(ev,d){
      const iso=NUM_TO_ISO2[String(d.id||"").padStart(3,"0")]||"";
      const fam=CF[iso]; const name=ISO2_NAMES[iso]||iso||"?";
      if(fam) d3.select(this).attr("fill",(FC[fam]||"#888")+"ee");
      setHovered({name,fam,iso});
    })
    .on("mouseout",function(ev,d){
      const iso=NUM_TO_ISO2[String(d.id||"").padStart(3,"0")]||"";
      const fam=CF[iso];
      d3.select(this).attr("fill",()=>{
        if(!fam) return "#151e2e";
        if(selFam&&fam!==selFam) return "#151e2e";
        return (FC[fam]||"#888")+"99";
      });
      setHovered(null);
    });
}

function MapLoader(){ return <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,color:T.muted}}><div className="pulse" style={{fontSize:32}}>🌍</div><div style={{fontSize:13}}>Loading map…</div></div>; }
function MapError(){ return <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:32,textAlign:"center"}}><div style={{fontSize:36}}>🗺️</div><div style={{fontFamily:T.ff,fontSize:18,color:T.goldLight}}>Map unavailable</div><div style={{color:T.muted,fontSize:13,maxWidth:320,lineHeight:1.6}}>Network access restricted. Use Language Tree or Learn mode for location data.</div></div>; }

function TreeMode({back}) {
  const [open, setOpen] = useState({});
  const tree = useMemo(()=>getFamilies(),[]);
  const toggle = k => setOpen(o=>({...o,[k]:!o[k]}));

  return (
    <div style={{minHeight:"100vh",padding:"32px 24px"}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
          <button onClick={back} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:13}}>← Back</button>
          <div style={{fontFamily:T.ff,fontSize:22,color:T.goldLight}}>Language Tree</div>
          <div style={{fontSize:13,color:T.muted}}>{LANGS.length} languages</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:16}}>
          {Object.entries(tree).map(([fam,sfs])=>{
            const col=FC[fam]||"#888";
            const total=Object.values(sfs).flat().length;
            return (
              <div key={fam} style={{background:T.card,border:`1px solid ${col}33`,borderRadius:14,overflow:"hidden"}}>
                {/* Family header */}
                <div onClick={()=>toggle(fam)} style={{
                  background:`${col}18`,padding:"14px 20px",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"space-between",gap:12
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{width:10,height:10,borderRadius:"50%",background:col,display:"inline-block"}}/>
                    <span style={{fontFamily:T.ff,fontSize:16,fontWeight:700,color:col}}>{fam}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,color:T.muted}}>{total} langs</span>
                    <span style={{color:T.muted,fontSize:11}}>{open[fam]?"▲":"▼"}</span>
                  </div>
                </div>

                {/* Subfamilies */}
                {open[fam] && Object.entries(sfs).map(([sf,langs])=>(
                  <div key={sf} style={{borderTop:`1px solid ${T.border}`}}>
                    <div onClick={()=>toggle(`${fam}:${sf}`)} style={{
                      padding:"10px 20px 10px 30px",cursor:"pointer",display:"flex",
                      alignItems:"center",justifyContent:"space-between",
                      background:open[`${fam}:${sf}`]?`${col}08`:"transparent"
                    }}>
                      <span style={{fontSize:13,color:T.muted,fontStyle:"italic"}}>{sf}</span>
                      <span style={{fontSize:11,color:T.muted}}>{langs.length} · {open[`${fam}:${sf}`]?"▲":"▼"}</span>
                    </div>
                    {open[`${fam}:${sf}`] && (
                      <div style={{padding:"4px 20px 12px 44px",display:"flex",flexWrap:"wrap",gap:6}}>
                        {langs.map(l=>(
                          <span key={l.id} style={{
                            background:`${col}18`,color:col,
                            border:`1px solid ${col}33`,borderRadius:20,
                            padding:"3px 10px",fontSize:12,fontWeight:500
                          }}>{l.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
