# Messaging & Games Features

## Overview
The bot now includes a comprehensive messaging system and interactive games functionality.

## 🎮 Games Feature

### Available Games
- **🎲 Dice (Kub)** - Roll a 6-sided dice
- **🎯 Dart (Nishon)** - Throw a dart at a target
- **🏀 Basketball** - Shoot a basketball
- **⚽ Football** - Kick a football
- **🎰 Casino (Kazino)** - Spin the slot machine
- **🎳 Bowling** - Roll a bowling ball

### How to Play
1. Click the **🎮 O'yin** button from the main menu
2. Choose a specific game or select **🎲 Random** for a surprise
3. Watch the animated result!

### Random Mode
The bot randomly selects one of the six available games and plays it for you.

---

## ✉️ Messaging System

### User → Admins
**How it works:**
1. Regular users click **✉️ Adminga xabar** button
2. Write their message
3. Message is sent to **ALL** admins simultaneously
4. Each admin receives the message with user info:
   - Username
   - Telegram ID
   - Region
   - Message content
5. Admins can reply using the **💬 Javob berish** button

### Admin → User (Reply)
**When an admin replies:**
1. Click **💬 Javob berish** on user's message
2. Write the reply
3. User receives the message with admin's username
4. User can continue the conversation by replying back

### Admin → Superadmin
**Admins can message the superadmin:**
1. Go to **🛠 Admin panel**
2. Click **✉️ Superadminga xabar**
3. Write the message
4. Superadmin receives it with admin details
5. Superadmin can reply using **💬 Javob berish**

### Superadmin → Admin (Reply)
**When superadmin replies:**
1. Click **💬 Javob berish** on admin's message
2. Write the reply
3. Admin receives the response
4. Admin can continue the conversation

---

## 🔐 Chat ID System

### How It Works
Each conversation is tracked using Chat IDs to prevent message mixing:
- **User ↔ Admin**: Each conversation is isolated by user's Telegram ID
- **Admin ↔ Superadmin**: Each conversation is isolated by admin's Telegram ID
- **State Management**: `ChatState` class manages active conversations
- **Data Persistence**: Messages include sender information for context

### Technical Implementation
```javascript
ChatState.setChat(senderId, recipientId, role)
// role: 'user', 'admin', or 'superadmin'
```

---

## 📊 Message Flow Diagram

```
User
  |
  ├─[Message]─→ All Admins
  |              |
  |              ├─[Reply]─→ User
  |              |
  |              └─[Message]─→ Superadmin
  |                            |
  |                            └─[Reply]─→ Admin
  |
  └─[Continues conversation with specific admin]
```

---

## 🎯 Features Summary

### For Users
- ✉️ Message all admins at once
- 🎮 Play 6 different games
- 💬 Receive and reply to admin responses
- 📱 Simple, intuitive buttons

### For Admins
- 📨 Receive user messages
- 💬 Reply to individual users
- ✉️ Message superadmin for assistance
- 📁 Send files to base channel
- 🎮 Play games (same as users)

### For Superadmin
- 📨 Receive messages from admins
- 💬 Reply to admins
- 📢 Broadcast to all users
- 👥 Full user management
- 🎮 Play games (same as users)

---

## 🚀 Usage Examples

### User Messages Admin
```
User: "Mening muammom bor"
↓
All admins receive:
┌─────────────────────────────┐
│ 📨 FOYDALANUVCHIDAN XABAR   │
│ ━━━━━━━━━━━━━━━━━━          │
│ 👤 Foydalanuvchi: #john123  │
│ 🆔 ID: 123456789            │
│ 📍 Hudud: Toshkent          │
│                              │
│ 💬 Xabar:                   │
│ Mening muammom bor          │
│                              │
│ [💬 Javob berish]            │
└─────────────────────────────┘
```

### Admin Replies
```
Admin clicks "Javob berish"
Admin: "Salom! Sizga qanday yordam bera olaman?"
↓
User receives:
┌─────────────────────────────┐
│ 📨 ADMINDAN JAVOB            │
│ ━━━━━━━━━━━━━━━━━━          │
│ 🛠 Admin: #admin_user       │
│                              │
│ 💬 Xabar:                   │
│ Salom! Sizga qanday         │
│ yordam bera olaman?         │
│                              │
│ [💬 Javob berish]            │
└─────────────────────────────┘
```

### Playing Games
```
User clicks: 🎮 O'yin
↓
Bot shows game options:
┌─────────────────────────────┐
│ 🎲 Dice    🎯 Dart          │
│ 🏀 Basketball  ⚽ Football   │
│ 🎰 Casino  🎳 Bowling        │
│ 🎲 Random                    │
│ ❌ Bekor qilish              │
└─────────────────────────────┘

User selects "🎰 Casino"
↓
Bot: "🎮 Casino (Kazino) o'yinini boshlash..."
[Animated slot machine appears]
```

---

## 🔧 Technical Details

### New Files
- `src/features/messaging.js` - Messaging system handlers
- `src/features/games.js` - Games functionality

### Updated Files
- `src/features/constants.js` - Added messaging states
- `src/features/keyboards.js` - Added messaging and game buttons
- `src/features/index.js` - Integrated messaging and games
- `src/database/users.db.js` - Added ChatState and admin methods

### Database Methods
- `UserDatabase.getAllAdmins()` - Get all admin users
- `UserDatabase.getSuperAdmin()` - Get superadmin user
- `ChatState.setChat()` - Track active conversation
- `ChatState.getChat()` - Get active conversation
- `ChatState.clearChat()` - End conversation

### States
- `USER_MESSAGING_ADMIN` - User writing to admins
- `ADMIN_MESSAGING_USER` - Admin replying to user
- `ADMIN_MESSAGING_SUPERADMIN` - Admin writing to superadmin
- `SUPERADMIN_MESSAGING_ADMIN` - Superadmin replying to admin

---

## 🎨 User Interface

### Main Menu (Users)
```
┌─────────────────────────────┐
│ 🧾 My info  ✏️ Update info  │
│ 📁 Fayl yuborish             │
│ ✉️ Adminga xabar             │
│ 🎮 O'yin                     │
└─────────────────────────────┘
```

### Admin Panel
```
┌─────────────────────────────┐
│ 👥 Get all users             │
│ 🔍 Get user                  │
│ 📁 Fayl yuborish             │
│ ✉️ Superadminga xabar        │
│ 🏠 Bosh menyu                │
└─────────────────────────────┘
```

---

## 📝 Notes

- All messages include sender information for context
- Games use Telegram's built-in dice API
- Messages persist until cleared
- Chat states prevent message mixing
- Admins can only see non-superadmin users (unless they're superadmin)
- Superadmin has full visibility and control
