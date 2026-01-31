export interface Channel {
    id: string;
    title: string;
    author: string;
}

export interface StationCategory {
    id: string;
    name: string;
    description: string;
    channels: Channel[];
}

export const STATION_CATEGORIES: StationCategory[] = [
    {
        id: 'lofi',
        name: 'Lofi',
        description: 'Soft beats for late night thoughts and focused minds',
        channels: [
            { id: 'FWjZ0x2M8og', title: 'lofi hip hop radio 😴 sad & sleepy beats', author: 'the bootleg boy' },
            { id: 'jfKfPfyJRdk', title: 'lofi hip hop radio 📚 beats to relax/study to', author: 'Lofi Girl' },
            { id: 'rPjez8z61rI', title: 'lofi hip hop radio – beats to sleep/study/relax to ☕', author: 'STEEZYASFUCK' },
            { id: '5yx6BWlEVcY', title: 'Chillhop Radio - jazzy & lofi hip hop beats 🐾', author: 'Chillhop Music' },
            { id: '7NOSDKb0HlU', title: 'lofi hip hop radio - beats to study/relax to 🐾', author: 'Chillhop Music' },
            { id: 'i6WzngxTnBA', title: 'late night vibes radio - calm lofi / dreamy beats 😴', author: 'Chillhop Music' },
            { id: 'HuFYqnbVbzY', title: 'jazz lofi radio 🎷 beats to chill/study to', author: 'Lofi Girl' },
            { id: 'Lcdi9O2XB4E', title: 'tokyo night drive - lofi hiphop + chill + beats to sleep/relax/study to ✨', author: 'TOKYO TONES' },
            { id: 'OGzGSfegUkU', title: '🍣 lost in japan 🎧 24 /7 calm lofi hiphop + chill visuals + relax + e x p l o r e', author: 'TOKYO TONES' },
            { id: 'twRzDVzKUIY', title: '24/7 Lofi Radio with Tokyo Rain Walks 🌧️☕ | soft hiphop + city rain ambience + chill, vibe & sleep', author: 'TOKYO TONES' },
            { id: 'erUTqlcsDJI', title: 'LO:FI', author: 'InYourChill' },
            { id: 'P6Segk8cr-c', title: 'sad lofi radio ☔ beats for rainy days', author: 'Lofi Girl' },
        ]
    },
    {
        id: 'jazz',
        name: 'Jazz',
        description: 'Smooth keys and smoky vibes for timeless elegance',
        channels: [
            { id: 'A8jDx9TLMQc', title: 'relaxing jazz music 🌹 cozy radio to study/chill to', author: 'Lofi Girl' },
            { id: 'Dx5qFachd3A', title: 'Relaxing Jazz Piano Radio - Slow Jazz Music - 24/7 Live Stream - Music For Work & Study', author: 'Cafe Music BGM channel' },
            { id: 'HhqWd3Axq9Y', title: 'Crackling Fireplace & Smooth Jazz Instrumental 🍂 Warm Jazz Music at Cozy Fall Coffee Shop Ambience', author: 'Cafe Music BGM channel' },
            { id: 'j-tYR6tvtb0', title: 'December Jazz: Sweet Jazz & Elegant Bossa Nova to relax, study and work effectively', author: 'Cozy Jazz Music' },
            { id: 'uuh15wxIMg0', title: 'March Jazz Mix For A Relaxing Day - Sweet Jazz Background Music & Fireplace Sound In A Cozy Bedroom', author: 'Serene Chords' },
        ]
    },
    {
        id: 'hip-hop',
        name: 'Hip Hop',
        description: 'Dusty loops and raw rhythms for the daily grind',
        channels: [
            { id: 'Oblb4xGO6k4', title: 'Boom Bap Hip Hop Instrumental Radio 24/7 | Beats to Work & Chill 🎧', author: 'Vibin\' 🎼' },
            { id: 'eDNRW1KiEjo', title: '🔴 24/7 Hip Hop Instrumentals Radio / Boom Bap / Underground / 90\'s / Soul / Lo-Fi / Oldschool Beats🎵', author: 'Vei Beats' },
            { id: 'mgoMxZCWMWo', title: '90\'s Hip-Hop (1994) [Lost Demos] B.I.G. Inspired Tribute – Backseat Loyalty', author: 'Block Legends 90s' },
            { id: '7ge2r9XkYCY', title: '90\'s Hip-Hop (1997) [Lost Demos] B.I.G. Inspired Tribute – Backseat Loyalty', author: 'Block Legends 90s' },
            { id: '6Jsnem7i848', title: '24/7 Beats Instrumental Hip-Hop - Jazzhop, Lo-Fi, Chillhop, Boom Bap // Beats Only', author: 'Sphere of Hip-Hop' },
            { id: 'BxY4TtQgV58', title: 'It\'s ILLEGAL to Own This 90\'s Hip Hop Mixtape | 90s Boom Bap / Old School Hip Hop Mix', author: 'Lunaro' },
        ]
    },
    {
        id: 'rnb',
        name: 'R&B',
        description: 'Smooth R&B beats for a relaxed vibe',
        channels: [
            { id: 'OB67pohCtAQ', title: 'r&b / hip hop radio – 24/7 live stream', author: 'Matthew Chávez' },
            { id: 'SBnxFo7CjGU', title: '🔴 Live R&B Radio 24/7 📻 Smooth & Chill Vibes | Relax, Work, Drive', author: 'Smooth Mood' },
            { id: 'Ttg7YX-8icQ', title: '🔴 LIVE 24/7 R&B Soul | Romantic R&B Soul Cafe Music for Focus, Relax & Fall Vibes 💖🍁☕', author: 'Smooth Mood' },
            { id: 'zkgOc3J2fjU', title: '24/7 Trapsoul R&B Lofi - Beats For Work, Relax, Study & Vibing', author: 'A Lofi Soul' },
        ]
    },
    {
        id: 'synthwave',
        name: 'Synthwave',
        description: 'Neon lights, digital horizons, and retro dreams',
        channels: [
            { id: 'jB4rKRzS9to', title: 'Back to My Room 1987 🎶 Synthwave Vaporwave Chillwave Retro Mix', author: 'retro tape' },
            { id: '4xDzrJKXOOY', title: 'synthwave radio 🌌 beats to chill/game to', author: 'Lofi Girl' },
            { id: 'UedTcufyrHc', title: 'ChillSynth FM - lofi synthwave radio for retro dreaming', author: 'Nightride FM' },
            { id: 'jB4rKRzS9to', title: 'TW Sign in Back to My Room 1987 🎶 Synthwave Vaporwave Chillwave Retro Mix', author: 'retro tape' },
            { id: 'gopYmb38DgM', title: 'Terminal 1987 Never Closed — 24/7 Synthwave Dev Stream', author: 'Devs FM' },
            { id: 'nvZg5qbNmJc', title: 'Poolsoft’92 Leisure Terminal | 24/7 Chillwave Dev Stream', author: 'Devs FM' },
        ]
    },
    {
        id: 'house',
        name: 'House',
        description: 'Deep grooves and four-on-the-floor rhythms for focus',
        channels: [
            { id: 'g9cxLj8Ayqc', title: 'Luxury Lounge Music | Elegant Deep House Chill Mix - Sunset Tropical Vibes', author: 'Lush House Chill' },
            { id: 'mQgvkkQNKe0', title: 'Luxury Lounge Music Deep House Mix ~ Tropical Sunset Chill & Relaxing Vibes', author: 'Lush House Chill' },
            { id: 'QtvN3slWvP4', title: 'Luxury Lounge Music | Deep House Mix for Tropical Sunset Chillout Vibes', author: 'Lush House Chill' },
            { id: '36YnV9STBqc', title: 'The Good Life Radio • 24/7 Live Radio | Best Relax House, Chillout, Study, Running, Gym, Happy Music', author: 'The Good Life Radio x Sensual Musique' },
            { id: 'uRAHIMCrFNM', title: 'Tropical House Radio 🌴 24/7 Live Music 🌴 Chill Summer Music', author: 'Ballistic Live' },
        ]
    },
    {
        id: 'j-pop',
        name: 'J-Pop',
        description: 'Japanese pop music for city nights',
        channels: [
            { id: '9U-fUUuOnbM', title: 'Citypop Radio - 80s Japanese Disco / 24/7 Livestream', author: 'City Pop 永遠' },
            { id: 'RgMmmgkbh90', title: '集中したいとき、ただ流しておく音｜24/7 J-POP・シティポップ・メロウ・チル | メロウ電波', author: 'Vibe Match Radio' },
            { id: 'dQ9WrIzFJy4', title: 'Kyoto Winter Lights 1980❄️🌙 | 東京ウィンターライト City Pop & Lo-Fi Chill Radio – 夜の東京BGM・昭和シティポップ24/7', author: 'Hazy Streets' },
            { id: 'oY-hl_6sRAY', title: 'New J Channel 🎌 Japanese Soul Funk Disco City Pop Kayo Reggae Music Radio 70s 80s🗼24/7 ニューミュージック 和モノ', author: 'Luiger' },
        ]
    },
    {
        id: 'ambient',
        name: 'Ambient',
        description: 'Ambient music for focus and relaxation',
        channels: [
            { id: 'xORCbIptqcc', title: 'sleep ambient music 💤 relaxing radio to fall asleep to', author: 'Lofi Girl' },
            { id: 'S_MOd40zlYU', title: 'dark ambient radio 🌃 music to escape/dream to', author: 'Lofi Girl' },
            { id: 'RrkrdYm3HPQ', title: 'Blade Runner Radio', author: 'Lush House Chill' },
            { id: 'QtvN3slWvP4', title: 'Luxury Lounge Music | Deep House Mix for Tropical Sunset Chillout Vibes', author: '( LUX )  - Ambient Music' },
        ]
    }
];
