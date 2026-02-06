const GAME_EMOJIS = {
    DICE: "🎲",
    DART: "🎯",
    BASKETBALL: "🏀",
    FOOTBALL: "⚽",
    SLOT_MACHINE: "🎰",
    BOWLING: "🎳"
};

const GAME_NAMES = {
    "🎲": "Dice (Kub)",
    "🎯": "Dart (Nishon)",
    "🏀": "Basketball (Basketbol)",
    "⚽": "Football (Futbol)",
    "🎰": "Casino (Kazino)",
    "🎳": "Bowling (Bouling)"
};

export const playRandomGame = async (ctx) => {
    const games = Object.values(GAME_EMOJIS);
    const randomGame = games[Math.floor(Math.random() * games.length)];
    const gameName = GAME_NAMES[randomGame];
    
    try {
        await ctx.reply(`🎮 ${gameName} o'yinini boshlash...`);
        await ctx.replyWithDice(randomGame);
        return true;
    } catch (error) {
        console.error("Error playing game:", error.message);
        ctx.reply("❌ O'yinni yuklashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
        return false;
    }
};

export const getGameOptionsKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [
                { text: "🎲 Dice", callback_data: "game:dice" },
                { text: "🎯 Dart", callback_data: "game:dart" }
            ],
            [
                { text: "🏀 Basketball", callback_data: "game:basketball" },
                { text: "⚽ Football", callback_data: "game:football" }
            ],
            [
                { text: "🎰 Casino", callback_data: "game:casino" },
                { text: "🎳 Bowling", callback_data: "game:bowling" }
            ],
            [
                { text: "🎲 Random", callback_data: "game:random" }
            ],
            [
                { text: "❌ Bekor qilish", callback_data: "cancel_action" }
            ]
        ]
    }
});

export const playSpecificGame = async (ctx, gameType) => {
    let emoji;
    
    switch(gameType) {
        case "dice":
            emoji = "🎲";
            break;
        case "dart":
            emoji = "🎯";
            break;
        case "basketball":
            emoji = "🏀";
            break;
        case "football":
            emoji = "⚽";
            break;
        case "casino":
            emoji = "🎰";
            break;
        case "bowling":
            emoji = "🎳";
            break;
        case "random":
            return await playRandomGame(ctx);
        default:
            emoji = "🎲";
    }
    
    const gameName = GAME_NAMES[emoji];
    
    try {
        await ctx.answerCbQuery();
        await ctx.reply(`🎮 ${gameName} o'yinini boshlash...`);
        await ctx.replyWithDice(emoji);
        return true;
    } catch (error) {
        console.error("Error playing game:", error.message);
        ctx.reply("❌ O'yinni yuklashda xatolik yuz berdi.");
        return false;
    }
};
