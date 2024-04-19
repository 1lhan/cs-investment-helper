import { createSlice } from "@reduxjs/toolkit";

const events = [
    {
        name: 'Copenhagen-2024', eventType: 'tournament', eventItem: 'Sticker | PGL (Holo) | Copenhagen 2024', eventItems: ['stickers', 'autographs', 'capsules', 'souvenir-packages'],
        stickerTypes: ['Paper', 'Glitter', 'Holo', 'Gold'],
        stickers: ['Natus Vincere', 'Virtus.pro', 'G2 Esports', 'FaZe Clan', 'Team Spirit', 'Vitality', 'MOUZ', 'Complexity Gaming', 'Cloud9', 'ENCE', 'FURIA', 'Heroic', 'Eternal Fire', 'Apeks', 'GamerLegion', 'SAW',
            'paiN Gaming', 'Imperial Esports', 'The MongolZ', 'AMKAL ESPORTS', 'ECSTATIC', 'KOI', 'Legacy', 'Lynn Vision', 'PGL'],
        autographs: ["jL", "Aleksib", "b1t", "iM", "w0nderful", "fame", "FL1T", "Jame", "mir", "n0rb3r7", "HooXi", "huNter-", "m0NESY", "nexa", "NiKo", "broky", "frozen", "karrigan", "rain", "ropz", "chopper", "donk", "magixx",
            "sh1ro", "zont1x", "apEX", "FlameZ", "mezii", "Spinx", "ZywOo", "Brollan", "Jimpphat", "siuhy", "torzsi", "xertioN", "hallzerk", "EliGE", "floppy", "Grim", "JT", "Ax1Le", "Boombl4", "electronic", "Hobbit", "Perfecto",
            "Goofy", "Kylar", "Dycha", "gla1ve", "hades", "arT", "chelo", "FalleN", "KSCERATO", "yuurih", "kyxsan", "NertZ", "nicoodoz", "sjuush", "TeSeS", "Calyx", "MAJ3R", "Wicadia", "woxic", "XANTARES", "nawwk", "CacaNito",
            "jkaem", "sense", "STYKO", "acoR", "isak", "Keoz", "Snax", "volt", "arrozdoce", "ewjerkz", "MUTiRiS", "roman", "story", "biguzera", "kauez", "lux", "n1ssim", "NQZ", "decenty", "felps", "HEN1", "noway", "VINI", "910",
            "bLitz", "mzinho", "Senzu", "Techno4K", "Forester", "ICY", "Krad", "NickelBack", "TRAVIS", "kraghen", "Nodios", "Patti", "Queenix", "salazar", "adamS", "dav1g", "JUST", "mopoz", "stadodo", "b4rtiN", "coldzera", "dumau",
            "latto", "NEKiZ", "EmiliaQAQ", "Jee", "Starry", "westmelon", "z4KR"],
        capsules: ['Copenhagen 2024 Legends Sticker Capsule', 'Copenhagen 2024 Challengers Sticker Capsule', 'Copenhagen 2024 Contenders Sticker Capsule', 'Copenhagen 2024 Legends Autograph Capsule',
            'Copenhagen 2024 Challengers Autograph Capsule', 'Copenhagen 2024 Contenders Autograph Capsule', 'Copenhagen 2024 Champions Autograph Capsule'],
        'souvenir-packages': ['Copenhagen 2024 Mirage Souvenir Package', 'Copenhagen 2024 Inferno Souvenir Package', 'Copenhagen 2024 Nuke Souvenir Package', 'Copenhagen 2024 Overpass Souvenir Package',
            'Copenhagen 2024 Vertigo Souvenir Package', 'Copenhagen 2024 Ancient Souvenir Package', 'Copenhagen 2024 Anubis Souvenir Package'],
        dates: {
            release: 'Mar 21 2024',
            'tournament-start': 'Mar 17 2024',
            'tournament-end': 'Mar 31 2024',
            'sale-start': null,
            'sale-end': null,
            'min-price-after-sale': false,
            'highest-price': null
        }
    },
    {
        name: 'Paris-2023', eventType: 'tournament', eventItem: 'Sticker | BLAST.tv (Holo) | Paris 2023', eventItems: ['stickers', 'autographs', 'capsules', 'souvenir-packages'], stickerTypes: ['Paper', 'Glitter', 'Holo', 'Gold'],
        stickers: ['MOUZ', 'Apeks', 'Monte', '9INE', 'G2 Esports', 'Natus Vincere', 'Fnatic', 'forZe eSports', 'OG', 'paiN Gaming', 'GamerLegion', 'Team Liquid', 'FaZe Clan', 'ENCE', 'Grayhound Gaming', 'Complexity Gaming',
            'Fluxo', 'The MongolZ', 'FURIA', 'Vitality', 'Heroic', 'Bad News Eagles', 'Into The Breach', 'Ninjas in Pyjamas', 'BLAST.tv'],
        autographs: ['EliGE', 'NAF', 'nitr0', 'oSee', 'YEKINDAR', 'broky', 'karrigan', 'rain', 'ropz', 'Twistzz', 'Dycha', 'maden', 'NertZ', 'Snappi', 'SunPayus', 'aliStair', 'INS', 'Liazz', 'Sico', 'vexite', 'dexter', 'frozen',
            'JDC', 'torzsi', 'xertioN', 'FaNg', 'floppy', 'Grim', 'hallzerk', 'JT', 'felps', 'History', 'Lucaozy', 'v$m', 'WOOD7', 'ANNIHILATION', 'Bart4k', 'bLitz', 'sk0R', 'Techno4K', 'FASHR', 'KRIMZ', 'mezii', 'nicoodoz',
            'roeJ', 'b1t', 'electronic', 'npl', 'Perfecto', 's1mple', 'arT', 'drop', 'KSCERATO', 'saffee', 'yuurih', 'apEX', 'dupreeh', 'Magisk', 'Spinx', 'ZywOo', 'cadiaN', 'jabbi', 'sjuush', 'stavn', 'TeSeS', 'gxx-',
            'juanflatroo', 'rigoN', 'SENER1', 'sinnopsyy', 'CRUC1AL', 'Cypher', 'rallen', 'Thomas', 'volt', 'Goofy', 'hades', 'KEi', 'Kylar', 'mynio', 'Aleksib', 'Brollan', 'headtr1ck', 'k0nfig', 'REZ', 'HooXi', 'huNter-',
            'jks', 'm0NESY', 'NiKo', 'Jerry', 'Krad', 'r3salt', 'shalfey', 'zorte', 'degster', 'F1KU', 'FlameZ', 'NEOFRAG', 'biguzera', 'hardzao', 'NEKiZ', 'skullz', 'zevy', 'acoR', 'iM', 'isak', 'Keoz', 'siuhy', 'jkaem',
            'jL', 'kyxsan', 'nawwk', 'STYKO', 'BOROS', 'DemQQ', 'kRaSnaL', 'sdy', 'Woro2k'],
        capsules: ['Paris 2023 Contenders Sticker Capsule', 'Paris 2023 Legends Sticker Capsule', 'Paris 2023 Challengers Sticker Capsule', 'Paris 2023 Contenders Autograph Capsule',
            'Paris 2023 Legends Autograph Capsule', 'Paris 2023 Challengers Autograph Capsule', 'Paris 2023 Champions Autograph Capsule'],
        'souvenir-packages': ['Paris 2023 Mirage Souvenir Package', 'Paris 2023 Inferno Souvenir Package', 'Paris 2023 Nuke Souvenir Package', 'Paris 2023 Overpass Souvenir Package', 'Paris 2023 Vertigo Souvenir Package',
            'Paris 2023 Ancient Souvenir Package', 'Paris 2023 Anubis Souvenir Package'],
        dates: {
            release: 'May 04 2023',
            'tournament-start': 'May 08 2023',
            'tournament-end': 'May 21 2023',
            'sale-start': 'Jun 23 2023',
            'sale-end': 'Oct 06 2023',
            'min-price-after-sale': null,
            'highest-price': null
        },
        specificItems: { autographs: ['Sticker | niko  | Paris 2023', 'Sticker | niko (Glitter)  | Paris 2023', 'Sticker | niko (Holo)  | Paris 2023', 'Sticker | niko (Gold)  | Paris 2023'] }
    },
    {
        name: 'Rio-2022', eventType: 'tournament', eventItem: 'Sticker | IEM (Gold) | Rio 2022', eventItems: ['stickers', 'autographs', 'capsules', 'souvenir-packages'], stickerTypes: ['Paper', 'Glitter', 'Holo', 'Gold'],
        stickers: ['00 Nation', 'Cloud9', 'MOUZ', '9z Team', 'FaZe Clan', 'FURIA', 'Imperial Esports', 'Outsiders', 'Sprout Esports', 'Team Liquid', 'Team Spirit', 'Heroic', 'Fnatic', 'Natus Vincere', 'Bad News Eagles',
            'IHC Esports', 'Vitality', 'OG', 'Ninjas in Pyjamas', 'GamerLegion', 'Evil Geniuses', 'BIG', 'ENCE', 'Grayhound Gaming', 'IEM'],
        autographs: ['Snappi', 'Dycha', 'maden', 'v4lde', 'SunPayus', 'karrigan', 'rain', 'Twistzz', 'ropz', 'broky', 'cadiaN', 'TeSeS', 'sjuush', 'jabbi', 'stavn', 'b1t', 'electronic', 'sdy', 'Perfecto', 's1mple', 'es3tag',
            'Aleksib', 'REZ', 'hampus', 'Brollan', 'slaxz-', 'lauNX', 'refrezh', 'Staehr', 'Zyphon', 'YEKINDAR', 'oSee', 'nitr0', 'NAF', 'EliGE', 'chopper', 'magixx', 'Patsi', 'S1ren', 'w0nderful', 'NQZ', 'dav1deuS', 'max',
            'dgt', 'BUDA', 'gxx-', 'SENER1', 'juanflatroo', 'rigoN', 'sinnopsyy', 'faveN', 'Krimbo', 'k1to', 'tabseN', 'syrsoN', 'sh1ro', 'nafany', 'Ax1Le', 'interz', 'Hobbit', 'autimatic', 'neaLaN', 'Brehze', 'HexT', 'CeRq',
            'frozen', 'dexter', 'JDC', 'torzsi', 'xertioN', 'nexa', 'NEOFRAG', 'FlameZ', 'degster', 'F1KU', 'dupreeh', 'Magisk', 'apEX', 'Spinx', 'ZywOo', 'TACO', 'coldzera', 'TRY', 'latto', 'dumau', 'KRIMZ', 'mezii', 'FASHR',
            'roeJ', 'nicoodoz', 'KSCERATO', 'yuurih', 'drop', 'saffee', 'arT', 'acoR', 'iM', 'siuhy', 'Keoz', 'isak', 'INS', 'vexite', 'Sico', 'Liazz', 'aliStair', 'sk0R', 'Techno4K', 'kabal', 'bLitz', 'ANNIHILATION', 'FalleN',
            'fer', 'boltz', 'VINI', 'chelo', 'FL1T', 'n0rb3r7', 'Jame', 'qikert', 'fame'],
        capsules: ['Rio 2022 Legends Sticker Capsule', 'Rio 2022 Challengers Sticker Capsule', 'Rio 2022 Contenders Sticker Capsule', 'Rio 2022 Legends Autograph Capsule', 'Rio 2022 Challengers Autograph Capsule',
            'Rio 2022 Contenders Autograph Capsule', 'Rio 2022 Champions Autograph Capsule'],
        'souvenir-packages': ['Rio 2022 Dust II Souvenir Package', 'Rio 2022 Mirage Souvenir Package', 'Rio 2022 Inferno Souvenir Package', 'Rio 2022 Nuke Souvenir Package', 'Rio 2022 Overpass Souvenir Package',
            'Rio 2022 Vertigo Souvenir Package', 'Rio 2022 Ancient Souvenir Package'],
        dates: {
            release: 'Oct 21 2022',
            'tournament-start': 'Oct 31 2022',
            'tournament-end': 'Nov 13 2022',
            'sale-start': 'Dec 14 2022',
            'sale-end': 'Feb 22 2023',
            'min-price-after-sale': false,
            'highest-price': 'Aug 01 2023'
        }
    },
    {
        name: 'Antwerp-2022', eventType: 'tournament', eventItem: 'Sticker | PGL (Holo) | Antwerp 2022', eventItems: ['stickers', 'autographs', 'capsules', 'souvenir-packages'], stickerTypes: ['Paper', 'Glitter', 'Holo', 'Gold'],
        stickers: ['Cloud9', 'Imperial Esports', 'FURIA', '9z Team', 'Eternal Fire', 'Outsiders', 'Team Liquid', 'Complexity Gaming', 'G2 Esports', 'Team Spirit', 'Copenhagen Flames', 'Astralis', 'FaZe Clan', 'Natus Vincere',
            'Vitality', 'MIBR', 'Heroic', 'Bad News Eagles', 'Renegades', 'Ninjas in Pyjamas', 'IHC Esports', 'ENCE', 'forZe eSports', 'BIG', 'PGL'],
        autographs: ['stavn', 'cadiaN', 'TeSeS', 'refrezh', 'sjuush', 'roeJ', 'Zyphon', 'HooXi', 'jabbi', 'nicoodoz', 'tabseN', 'tiziaN', 'faveN', 'Krimbo', 'syrsoN', 'interz', 'sh1ro', 'nafany', 'Ax1Le', 'Hobbit', 'yuurih',
            'arT', 'KSCERATO', 'drop', 'saffee', 'rain', 'karrigan', 'Twistzz', 'broky', 'ropz', 'REZ', 'hampus', 'Plopski', 'es3tag', 'Brollan', 's1mple', 'Boombl4', 'Perfecto', 'electronic', 'b1t', 'Snappi', 'dycha', 'Spinx',
            'hades', 'maden', 'Aleksib', 'huNter', 'JaCkz', 'm0NESY', 'NiKo', 'Jerry', 'zorte', 'KENSi', 'Norwi', 'shalfey', 'gla1ve', 'blameF', 'k0nfig', 'Xyp9x', 'Farlig', 'apEX', 'misutaaa', 'dupreeh', 'Magisk', 'ZywOo',
            'WOOD7', 'chelo', 'Tuurtle', 'exit', 'JOTA', 'FalleN', 'fer', 'fnx', 'boltz', 'VINI', 'rigoN', 'juanflatroo', 'SENER1', 'sinnopsyy', 'gxx-', 'XANTARES', 'woxic', 'imoRR', 'Calyx', 'xfl0ud', 'chopper', 'magixx',
            'degster', 'Patsi', 'S1ren', 'Jame', 'qikert', 'buster', 'YEKINDAR', 'FL1T', 'FaNg', 'floppy', 'Grim', 'JT', 'junior', 'bLitz', 'kabal', 'nin9', 'sk0R', 'Techno4K', 'ins', 'sico', 'Liazz', 'hatz', 'aliStair',
            'shox', 'EliGE', 'oSee', 'nitr0', 'NAF', 'rox', 'luken', 'max', 'dgt', 'dav1d'],
        capsules: [
            'Antwerp 2022 Legends Sticker Capsule', 'Antwerp 2022 Challengers Sticker Capsule', 'Antwerp 2022 Contenders Sticker Capsule', 'Antwerp 2022 Legends Autograph Capsule', 'Antwerp 2022 Challengers Autograph Capsule',
            'Antwerp 2022 Contenders Autograph Capsule', 'Antwerp 2022 Champions Autograph Capsule'
        ],
        'souvenir-packages': [
            'Antwerp 2022 Dust II Souvenir Package', 'Antwerp 2022 Mirage Souvenir Package', 'Antwerp 2022 Inferno Souvenir Package', 'Antwerp 2022 Nuke Souvenir Package', 'Antwerp 2022 Overpass Souvenir Package',
            'Antwerp 2022 Vertigo Souvenir Package', 'Antwerp 2022 Ancient Souvenir Package'
        ],
        dates: {
            release: 'May 04 2022',
            'tournament-start': 'May 09 2022',
            'tournament-end': 'May 22 2022',
            'sale-start': 'Jun 03 2022',
            'sale-end': 'Aug 09 2022',
            'min-price-after-sale': 'Dec 09 2022',
            'highest-price': 'Aug 01 2023'
        }
    },
    {
        name: 'Operation-Riptide', eventType: 'operation', eventItem: 'Operation Riptide Premium Pass', eventItems: ['stickers', 'agents', 'patches', 'case'],
        stickers: [
            'Sticker | Doppler Poison Frog (Foil)', 'Sticker | Ultraviolet Poison Frog (Foil)', 'Sticker | Crimson Web Poison Frog (Foil)', 'Sticker | Lore Poison Frog (Foil)', 'Sticker | Dragon Lore Surf Ava (Foil)',
            'Sticker | Blaze Surf K (Foil)', 'Sticker | Hypnotic Surf K (Foil)', 'Sticker | Fire Serpent Surf K (Foil)', 'Sticker | Akihabara Accept Surf Ava (Foil)', 'Sticker | Sticker Bomb Surf K (Foil)',
            'Sticker | Sticker Bomb Surf Ava (Foil)', 'Sticker | Dark Water Surf Ava (Foil)', 'Sticker | Cotton Candy Flow (Holo)', 'Sticker | Miami Tier6 (Holo)', 'Sticker | Flame Tier6 (Holo)', 'Sticker | Miami Flow (Holo)',
            'Sticker | Opal Flick (Holo)', 'Sticker | Neon Opal Strafe (Holo)', 'Sticker | Forge Tier6 (Holo)', 'Sticker | Miami Buttery (Holo)', 'Sticker | Toxic Flow (Holo)', 'Sticker | Watermelon Tier6 (Holo)',
            'Sticker | Miami Skill Surf (Holo)', 'Sticker | Miami Flick (Holo)', 'Sticker | Watermelon Flow (Holo)', 'Sticker | Watermelon Strafe (Holo)', 'Sticker | Bubble Gum Skill Surf (Holo)',
            'Sticker | Abalone Strafe (Holo)', 'Sticker | Mercury Flick (Holo)', 'Sticker | Flame Buttery (Holo)', 'Sticker | Ocean Sunset Skill Surf (Holo)', 'Sticker | Candy Buttery (Holo)', 'Sticker | Mood Ring Strafe (Holo)',
            'Sticker | Ocean Sunset Flick (Holo)', 'Sticker | Watermelon Buttery (Holo)', 'Sticker | Coral Skill Surf (Holo)', 'Sticker | Watermelon Tentaskull', 'Sticker | Black Jaggyfish', 'Sticker | Blood Moon Tentaskull',
            'Sticker | Fade Lethal', 'Sticker | Purple Jaggyfish', 'Sticker | Miami Stabbyfish', 'Sticker | Pink Jaggyfish', 'Sticker | Toxic Tentaskull', 'Sticker | Green Gnar', 'Sticker | Yellow Jaggyfish',
            'Sticker | Sunset Ocean Tentaskull', 'Sticker | Fools Gold Wave Rider', 'Sticker | Blood Moon Wave Rider', 'Sticker | Yellow Lethal', 'Sticker | Green Lethal', 'Sticker | Miami Wave Rider', 'Sticker | Blue Lethal',
            'Sticker | After Hours Stabbyfish', 'Sticker | Purple Gnar', 'Sticker | Red Shark Shooter', 'Sticker | Yellow Cyclawps', 'Sticker | Ocean Sunset Stabbyfish', 'Sticker | Watermelon Stabbyfish', 'Sticker | Purple Cyclawps',
            'Sticker | Toxic Wave Rider', 'Sticker | Blue Gnar', 'Sticker | Blue Shark Shooter', 'Sticker | Green Shark Shooter', 'Sticker | Orange Gnar', 'Sticker | Red Cyclawps', 'Sticker | Green Bombster',
            'Sticker | Black Shark Shooter', 'Sticker | Purple Bombster', 'Sticker | White Bombster', 'Sticker | Green Cyclawps', 'Sticker | Yellow Bombster', 'Sticker | Great Wave (Foil)', 'Sticker | Seeing Red (Foil)',
            'Sticker | Liquid Fire (Holo)', 'Sticker | Great Wave (Holo)', 'Sticker | Kill Count (Holo)', 'Sticker | Dead Eye (Holo)', 'Sticker | Liquid Fire', 'Sticker | Great Wave', 'Sticker | Kill Count',
            'Sticker | Seeing Red', 'Sticker | Chicken of the Sky', 'Sticker | Dead Eye', 'Sticker | Gutted', 'Sticker | Operation Riptide'
        ],
        agents: [
            "Cmdr. Davida 'Goggles' Fernandez | SEAL Frogman", "Cmdr. Frank 'Wet Sox' Baroud | SEAL Frogman", "Chef d'Escadron Rouchard | Gendarmerie Nationale", "Crasswater The Forgotten | Guerrilla Warfare",
            "'Medium Rare' Crasswater | Guerrilla Warfare", "Vypa Sista of the Revolution | Guerrilla Warfare", "Lieutenant Rex Krikey | SEAL Frogman", "Chem-Haz Capitaine | Gendarmerie Nationale",
            "Bloody Darryl The Strapped | The Professionals", "Elite Trapper Solman | Guerrilla Warfare", "Arno The Overgrown | Guerrilla Warfare", "Sous-Lieutenant Medic | Gendarmerie Nationale",
            "Officer Jacques Beltram | Gendarmerie Nationale", "Lieutenant 'Tree Hugger' Farlow | SWAT", "Col. Mangos Dabisi | Guerrilla Warfare", "Trapper | Guerrilla Warfare", "Primeiro Tenente | Brazilian 1st Battalion",
            "Aspirant | Gendarmerie Nationale", "D Squadron Officer | NZSAS", "Jungle Rebel | Elite Crew", "Trapper Aggressor | Guerrilla Warfare"
        ],
        patches: [
            'Patch | Bayonet Frog', 'Patch | Elder God', 'Patch | Aquatic Offensive', 'Patch | Dead Men', 'Patch | Death From Below', 'Patch | Sunset Wave', 'Patch | Meal Time', 'Patch | Abandon Hope',
            'Patch | Cruising Ray', 'Patch | Anchors Aweigh', 'Patch | Mad Sushi', 'Patch | El Pirata', 'Patch | Giant Squid'
        ],
        case: ['Operation Riptide Case'],
        dates: {
            release: 'Sep 22 2021',
            end: 'Feb 22 2022',
            highestPrice: 'Jan 01 2024'
        }
    },
    {
        name: 'Stockholm-2021', eventType: 'tournament', eventItem: 'Sticker | PGL (Holo) | Stockholm 2021', eventItems: ['stickers', 'autographs', 'capsules', 'souvenir-packages', 'patches', 'patch-packs'],
        stickerTypes: ['Paper', 'Holo', 'Foil', 'Gold'],
        stickers: ['Tyloo', 'MOUZ', 'Entropiq', 'Virtus.Pro', 'Movistar Riders', 'Astralis', 'FaZe Clan', 'Team Spirit', 'Copenhagen Flames', 'paiN Gaming', 'Heroic', 'Natus Vincere', 'Sharks Esports', 'BIG', 'Gambit Gaming',
            'GODSENT', 'G2 Esports', 'ENCE', 'Team Liquid', 'FURIA', 'Ninjas in Pyjamas', 'Renegades', 'Evil Geniuses', 'Vitality', 'PGL'],
        autographs: ['NiKo', 'nexa', 'huNter-', 'JACKZ', 'AMANEK', 'TeSeS', 'stavn', 'sjuush', 'refrezh', 'cadiaN', 'nafany', 'Ax1Le', 'interz', 'sh1ro', 'HObbit', 'drop', 'KSCERATO', 'VINI', 'arT', 'yuurih', 'Qikert', 'buster',
            'YEKINDAR', 'Jame', 'FL1T', 'hampus', 'LNZ', 'REZ', 'Plopski', 'device', 'ZywOo', 'misutaaa', 'Kyojin', 'shox', 'apEX'],
        capsules: ['Stockholm 2021 Legends Sticker Capsule', 'Stockholm 2021 Challengers Sticker Capsule', 'Stockholm 2021 Contenders Sticker Capsule', 'Stockholm 2021 Finalists Autograph Capsule',
            'Stockholm 2021 Champions Autograph Capsule'],
        'souvenir-packages': ['Stockholm 2021 Dust II Souvenir Package', 'Stockholm 2021 Mirage Souvenir Package', 'Stockholm 2021 Inferno Souvenir Package', 'Stockholm 2021 Nuke Souvenir Package',
            'Stockholm 2021 Overpass Souvenir Package', 'Stockholm 2021 Vertigo Souvenir Package', 'Stockholm 2021 Ancient Souvenir Package'],
        patches: ['Tyloo', 'MOUZ', 'Entropiq', 'Virtus.Pro', 'Movistar Riders', 'Astralis', 'FaZe Clan', 'Team Spirit', 'Copenhagen Flames', 'paiN Gaming', 'Heroic', 'Natus Vincere', 'Sharks Esports', 'BIG', 'Gambit Gaming',
            'GODSENT', 'G2 Esports', 'ENCE', 'Team Liquid', 'FURIA', 'Ninjas in Pyjamas', 'Renegades', 'Evil Geniuses', 'Vitality', 'PGL'],
        'patch-packs': ['Stockholm 2021 Legends Patch Pack', 'Stockholm 2021 Challengers Patch Pack', 'Stockholm 2021 Contenders Patch Pack'],
        dates: {
            release: 'Oct 21 2021',
            'tournament-start': 'Oct 26 2021',
            'tournament-end': 'Nov 07 2021',
            'sale-start': 'Nov 30 2021',
            'sale-end': 'Jan 18 2022',
            'min-price-after-sale': false,
            'highest-price': 'Aug 01 2023'
        }
    },
    {
        name: '2020-RMR', eventType: 'tournament', eventItem: '2020 RMR Contenders', eventItems: ['stickers', 'capsules'],
        stickerTypes: ['Paper', 'Holo', 'Foil', 'Gold'],
        stickers: ["Vitality", "Heroic", "Ninjas in Pyjamas", "Spirit", "Natus Vincere", "Evil Geniuses", "100 Thieves", "FURIA", "Astralis", "BIG", "Fnatic", "G2", "OG", "GODSENT", "Nemiga", "Liquid", "FaZe", "North",
            "Virtus.pro", "ESPADA", "Gen.G", "Boom", "Renegades", "TYLOO"],
        capsules: ['2020 RMR Legends', '2020 RMR Challengers', '2020 RMR Contenders'],
        dates: {
            release: 'Jan 28 2021',
            'tournament-start': null,
            'tournament-end': null,
            'sale-start': 'Apr 07 2021',
            'sale-end': 'May 20 2021',
            'min-price-after-sale': 'Aug 01 2023',
            'highest-price': 'Aug 01 2023'
        }
    },
    {
        name: 'Operation-Broken-Fang', eventType: 'operation', eventItem: 'Operation Broken Fang Premium Pass', eventItems: ['stickers', 'agents', 'patches', 'case', 'graffitis'],
        stickers: [
            'Sticker | Stone Scales (Foil)', 'Sticker | Ancient Beast (Foil)', 'Sticker | Battle Scarred (Holo)', 'Sticker | Coiled Strike (Holo)', 'Sticker | Broken Fang (Holo)', 'Sticker | Enemy Spotted (Holo)',
            'Sticker | Battle Scarred', 'Sticker | Ancient Marauder', 'Sticker | Broken Fang', 'Sticker | Stalking Prey', 'Sticker | Coiled Strike', 'Sticker | Enemy Spotted', 'Sticker | Ancient Protector',
            'Sticker | Stone Scales', 'Sticker | Badge of Service', 'Sticker | Ancient Beast', 'Sticker | Hello XM1014 (Gold)', 'Sticker | Hello UMP-45 (Gold)', 'Sticker | Hello SG 553 (Gold)', 'Sticker | Hello P90 (Gold)',
            'Sticker | Hello MP9 (Gold)', 'Sticker | Hello MP7 (Gold)', 'Sticker | Hello MAC-10 (Gold)', 'Sticker | Hello M4A4 (Gold)', 'Sticker | Hello M4A1-S (Gold)', 'Sticker | Hello Galil AR (Gold)',
            'Sticker | Hello FAMAS (Gold)', 'Sticker | Hello CZ75-Auto (Gold)', 'Sticker | Hello PP-Bizon (Gold)', 'Sticker | Hello AWP (Gold)', 'Sticker | Hello AUG (Gold)', 'Sticker | Hello AK-47 (Gold)',
            'Sticker | Hello XM1014', 'Sticker | Hello UMP-45', 'Sticker | Hello SG 553', 'Sticker | Hello P90', 'Sticker | Hello MP9', 'Sticker | Hello MP7', 'Sticker | Hello MAC-10', 'Sticker | Hello M4A4',
            'Sticker | Hello M4A1-S', 'Sticker | Hello Galil AR', 'Sticker | Hello FAMAS', 'Sticker | Hello CZ75-Auto', 'Sticker | Hello PP-Bizon', 'Sticker | Hello AWP', 'Sticker | Hello AUG', 'Sticker | Hello AK-47'
        ],
        agents: [
            "Cmdr. Mae 'Dead Cold' Jamison | SWAT", "Sir Bloody Skullhead Darryl | The Professionals", "Sir Bloody Darryl Royale | The Professionals", "Sir Bloody Miami Darryl | The Professionals", "Sir Bloody Silent Darryl | The Professionals",
            "Sir Bloody Loudmouth Darryl | The Professionals", "1st Lieutenant Farlow | SWAT", "'Two Times' McCoy | TACP Cavalry", "Rezan the Redshirt | Sabre", "Safecracker Voltzmann | The Professionals", "Number K | The Professionals",
            "'Blueberries' Buckshot | NSWC SEAL", "John 'Van Healen' Kask | SWAT", "Sergeant Bombson | SWAT", "Getaway Sally | The Professionals", "Little Kev | The Professionals", "Chem-Haz Specialist | SWAT", "Bio-Haz Specialist | SWAT",
            "Dragomir | Sabre", "Street Soldier | Phoenix"
        ],
        patches: [
            'Patch | Metal Silver Demon', 'Patch | Metal The Global Elite ★', 'Patch | Metal Legendary Eagle Master ★', 'Patch | Metal Supreme Master First Class', 'Patch | Metal Master Guardian',
            'Patch | Metal Distinguished Master Guardian ★', 'Patch | Metal Gold Nova', 'Patch | Metal Silver', 'Patch | Metal The Global Elite', 'Patch | Metal Legendary Eagle Master', 'Patch | Metal Supreme Master',
            'Patch | Metal Legendary Eagle', 'Patch | Metal Master Guardian I', 'Patch | Metal Master Guardian Elite', 'Patch | Metal Distinguished Master Guardian', 'Patch | Metal Gold Nova Master', 'Patch | Metal Gold Nova I'
        ],
        graffitis: [
            'Sealed Graffiti | Recoil AK-47', 'Sealed Graffiti | Recoil AUG', 'Sealed Graffiti | Recoil AWP', 'Sealed Graffiti | Recoil CZ-75', 'Sealed Graffiti | Recoil FAMAS', 'Sealed Graffiti | Recoil Galil AR',
            'Sealed Graffiti | Recoil M4A1-S', 'Sealed Graffiti | Recoil M4A4', 'Sealed Graffiti | Recoil MAC-10', 'Sealed Graffiti | Recoil MP7', 'Sealed Graffiti | Recoil MP9', 'Sealed Graffiti | Recoil P90',
            'Sealed Graffiti | Recoil PP-Bizon', 'Sealed Graffiti | Recoil SG 553', 'Sealed Graffiti | Recoil UMP-45', 'Sealed Graffiti | Recoil XM1014'
        ],
        graffitisColors: [
            'Wire Blue', 'Desert Amber', 'SWAT Blue', 'Battle Green', 'Violent Violet', 'Tiger Orange', 'Princess Pink', 'Jungle Green', 'Frog Green', 'Dust Brown',
            'Monster Purple', 'Bazooka Pink', 'Monarch Blue', 'Blood Red', 'Cash Green', 'Brick Red', 'Tracer Yellow', 'Shark White', 'War Pig Pink'
        ],
        case: ['Operation Broken Fang Case'],
        dates: {
            release: 'Dec 03 2020',
            end: 'Mar 29 2021',
            highestPrice: 'Jan 01 2024'
        }
    }
]

export const slice = createSlice({
    name: 'slice',
    initialState: {
        events,
        blue: '#066edd',
        green: '#34d399',
        red: '#ff6c6c'
    },
    reducers: {

    }
})

export const { } = slice.actions
export default slice.reducer
