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
            { id: 'jfKfPfyJRdk', title: 'lofi hip hop radio 📚 beats to relax/study to', author: 'Lofi Girl' },
            { id: 'h_a3tqywv3I', title: 'christmas lofi music🎄cozy radio to get festive to', author: 'Lofi Girl' },
            { id: 'rPjez8z61rI', title: 'lofi hip hop radio – beats to sleep/study/relax to ☕', author: 'STEEZYASFUCK' },
            { id: '5yx6BWlEVcY', title: 'Chillhop Radio - jazzy & lofi hip hop beats 🐾', author: 'Chillhop Music' },
            { id: '7NOSDKb0HlU', title: 'lofi hip hop radio - beats to study/relax to 🐾', author: 'Chillhop Music' },
            { id: 'i6WzngxTnBA', title: 'late night vibes radio - calm lofi / dreamy beats 😴', author: 'Chillhop Music' },
            { id: 'HuFYqnbVbzY', title: 'jazz lofi radio 🎷 beats to chill/study to', author: 'Lofi Girl' },
            { id: 'Lcdi9O2XB4E', title: 'tokyo night drive - lofi hiphop + chill + beats to sleep/relax/study to ✨', author: 'TOKYO TONES' },
            { id: 'zGZvDnoWQmw', title: '🍣✨🌃『 ＴＯＫＹＯ ＦＭ 106.9 』🌇✨ lofi japan aesthetic to sleep / study / relax to', author: 'TOKYO TONES' },
            { id: 'IaHTGpjdp34', title: 'japan night drive | 深夜のドライブ', author: 'TOKYO TONES' },
            { id: 'IWJlZ4ZMlsE', title: '🌃 lost in japan 🎧 24 /7 chill lofi hiphop + japan visuals + e x p l o r e', author: 'TOKYO TONES' },
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
        ]
    },
    {
        id: 'hip-hop',
        name: 'Hip Hop',
        description: 'Dusty loops and raw rhythms for the daily grind',
        channels: [
            { id: 'Oblb4xGO6k4', title: 'Boom Bap Hip Hop Instrumental Radio 24/7 | Beats to Work & Chill 🎧', author: 'Vibin\' 🎼' },
            { id: '6Jsnem7i848', title: '24/7 Beats Instrumental Hip-Hop - Jazzhop, Lo-Fi, Chillhop, Boom Bap // Beats Only', author: 'Sphere of Hip-Hop' },
            { id: 'BxY4TtQgV58', title: 'It\'s ILLEGAL to Own This 90\'s Hip Hop Mixtape | 90s Boom Bap / Old School Hip Hop Mix', author: 'Lunaro' },
        ]
    },
    {
        id: 'synthwave',
        name: 'Synthwave',
        description: 'Neon lights, digital horizons, and retro dreams',
        channels: [
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
            { id: 'AYMBwENobVo', title: 'Sunset Radio Livestream 24/7☀️', author: 'Sound Sphere - EDM' },
            { id: '3AitxRL5S_I', title: 'Chill House Livestream 24/7🌴☀️🎧', author: 'Sound Sphere - EDM' },
            { id: 'xEQ-JPwapHw', title: 'Chill House Livestream 24/7🌴🎧🎶', author: 'Sound Sphere - EDM' },
            { id: 'Ma5DjZwp_Lg', title: 'Deep House Livestream 24/7🌴🎧', author: 'Sound Sphere - EDM' },
        ]
    }
];
