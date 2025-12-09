# הסבר על מנגנון ה-Session באפליקציה

## סוגי Sessions

האפליקציה משתמשת ב-3 סוגי cookies/sessions:

### 1. `admin_session`

- **תפקיד**: מזהה שהמשתמש הוא מנהל (admin)
- **ערך**: תמיד `"true"` (boolean string)
- **מתי נוצר**: כשמנהל מתחבר למועדון או יוצר מועדון חדש
- **שימוש**:
  - ב-`middleware.ts` - בודק גישה לדפי `/admin/*`
  - אם אין `admin_session` או שהוא לא `"true"` - מפנה ל-`/admin/login`
- **תוקף**: 10 שנים

### 2. `club_session`

- **תפקיד**: מזהה לאיזה מועדון המשתמש מחובר
- **ערך**: ה-ID של המועדון (string של ObjectId)
- **מתי נוצר**:
  - כשמנהל מתחבר למועדון
  - כשמנהל יוצר מועדון חדש
  - כשמשתמש נכנס למועדון (דרך `login-to-club-by-name`)
- **שימוש**:
  - ב-`getClubSession()` - מחזיר את ה-ID של המועדון הפעיל
  - משמש לסנן נתונים (שחקנים, משחקים) לפי המועדון
  - בדפים כמו `/`, `/history`, `/profile` - בודקים אם יש `club_session`
- **תוקף**: 10 שנים

### 3. `manager_session`

- **תפקיד**: מזהה מי המנהל המחובר
- **ערך**: ה-ID של המשתמש המנהל (string של ObjectId)
- **מתי נוצר**: כשמנהל מתחבר למועדון או יוצר מועדון חדש
- **שימוש**:
  - לזיהוי מי המנהל הנוכחי
  - יכול לשמש לבדיקות הרשאה נוספות
- **תוקף**: 10 שנים

## תהליך התחברות מנהל

### יצירת מועדון חדש (`/api/create-club-with-manager`):

1. יוצר משתמש מנהל חדש (`isAdmin: true`)
2. יוצר מועדון חדש
3. קושר את המנהל למועדון (`managerId`)
4. **יוצר 3 cookies**:
   - `admin_session = "true"`
   - `club_session = club._id`
   - `manager_session = managerUser._id`

### התחברות למועדון קיים (`/api/login-to-club`):

1. מוצא מועדון לפי שם
2. מוצא את המנהל של המועדון
3. בודק סיסמה
4. **יוצר 3 cookies**:
   - `admin_session = "true"`
   - `club_session = club._id`
   - `manager_session = manager._id`

## תהליך התחברות שחקן

### התחברות שחקן (`playerLogin`):

1. מוצא משתמש לפי שם
2. בודק סיסמה
3. **יוצר cookie אחד**:
   - `player_session = user._id`
4. **לא יוצר** `club_session` - השחקן צריך להיכנס למועדון בנפרד

### כניסה למועדון (`/api/login-to-club-by-name`):

1. מוצא מועדון לפי שם
2. **יוצר cookie אחד**:
   - `club_session = club._id`
3. **לא בודק** סיסמה - כל אחד יכול להיכנס למועדון

## בדיקות Session בדפים

### דפי Admin (`/admin/*`):

- **Middleware** בודק `admin_session === "true"`
- אם אין - מפנה ל-`/admin/login`
- **דף Admin** בודק `club_session`:
  - אם אין - מפנה ל-`/admin/login`

### דפי משתמש רגיל (`/`, `/history`, `/profile`, `/game/[id]`):

- בודקים `club_session`:
  - אם אין - מציגים `ClubLoginScreen`
- בודקים `player_session`:
  - אם אין - מציגים טופס התחברות

## ניקוי Sessions

### התנתקות מנהל (`logoutAdmin`):

- מוחק: `admin_session`, `club_session`, `manager_session`

### התנתקות ממועדון (`/api/logout-club`):

- מוחק: `club_session`, `manager_session`
- **לא מוחק** `admin_session` (אם יש)

### התנתקות שחקן (`logoutPlayer`):

- מוחק: `player_session`

## דוגמאות שימוש

### בדיקת מועדון פעיל:

```typescript
const clubId = await getClubSession();
if (!clubId) {
  // אין מועדון מחובר
}
```

### בדיקת מנהל:

```typescript
const adminCookie = (await cookies()).get("admin_session");
if (adminCookie?.value === "true") {
  // זה מנהל
}
```

### סנן נתונים לפי מועדון:

```typescript
const users = await getUsers(clubId); // רק שחקנים של המועדון הזה
const games = await getGameHistory(clubId); // רק משחקים של המועדון הזה
```

## הערות חשובות

1. **`admin_session`** הוא boolean string (`"true"`) ולא ID
2. **`club_session`** הוא ID של המועדון, לא של המשתמש
3. **`manager_session`** הוא ID של המשתמש המנהל
4. כל ה-cookies הם `httpOnly: true` - לא נגישים מ-JavaScript בצד הלקוח
5. תוקף של 10 שנים = כמעט permanent session
6. שחקן יכול להיות מחובר (`player_session`) אבל לא להיות במועדון (`club_session`)
7. מנהל תמיד מחובר גם כמנהל (`admin_session`) וגם למועדון (`club_session`)
