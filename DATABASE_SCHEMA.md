# מבנה מסד הנתונים (Database Schema) - Poker App

להלן רשימת כל "הטבלאות" (Collections) במערכת, השדות שלהן והקשרים ביניהן.

---

## 1. משתמשים (User)
מייצג משתמש במערכת (שחקן או מנהל).

### שדות:
- **name**: שם המשתמש.
- **isAdmin**: האם המשתמש הוא מנהל מערכת (Boolean).
- **globalBalance**: מאזן כללי של השחקן.
- **avatarUrl**: קישור לתמונת פרופיל (אופציונלי).
- **password**: סיסמה (אופציונלי).
- **clubId**: שיוך למועדון (Reference ל-`Club`).
- **bankroll**: יתרת זיטונים בקופה (במוד קופה משותפת).
- **totalDeposited**: סך הכל הפקדות בשקלים.
- **totalWithdrawn**: סך הכל משיכות בשקלים.
- **bankrollHistory**: היסטוריית תנועות בקופה (מערך של אובייקטי טרנזקציה).

### קשרים:
- **clubId** -> מקושר לטבלאות **Club**.
- **bankrollHistory.gameId** -> מקושר לטבלאות **GameSession**.

---

## 2. מועדון (Club)
מייצג קבוצה או מועדון פוקר.

### שדות:
- **name**: שם המועדון.
- **managerId**: מזהה המנהל של המועדון (Reference ל-`User`).
- **clubPassword**: סיסמה לכניסה למועדון.
- **chipsPerShekel**: יחס המרה בין צ'יפים לשקלים (ברירת מחדל: 100).
- **gameMode**: מצב משחק (`free` או `shared_bankroll`).
- **createdAt**: תאריך יצירה.

### קשרים:
- **managerId** -> מקושר לטבלאות **User** (המשתמש שהוא המנהל).

---

## 3. סשן משחק (GameSession)
מייצג משחק פעיל או משחק שהסתיים.

### שדות:
- **date**: תאריך המשחק.
- **isActive**: האם המשחק פעיל כרגע.
- **isSettled**: האם בוצע "סגירת חשבונות" (Settlement) למשחק.
- **clubId**: המועדון אליו שייך המשחק (Reference ל-`Club`).
- **players**: מערך של שחקנים המשתתפים בסשן.
  - **userId**: מזהה המשתמש (Reference ל-`User`).
  - **totalApprovedBuyIn**: סך הכל כניסות שאושרו.
  - **buyInRequests**: בקשות כניסה (מערך).
  - **cashOut**: סכום יציאה.
  - **netProfit**: רווח/הפסד נקי.
  - **isCashedOut**: האם השחקן יצא מהמשחק.
- **settlementTransfers**: מערך העברות לביצוע בסגירת המשחק.
  - **payerId**: המשלם (Reference ל-`User`).
  - **receiverId**: המקבל (Reference ל-`User`).
  - **amount**: סכום ההעברה.

### קשרים:
- **clubId** -> מקושר לטבלאות **Club**.
- **players.userId** -> מקושר לטבלאות **User**.
- **settlementTransfers.payerId** -> מקושר לטבלאות **User**.
- **settlementTransfers.receiverId** -> מקושר לטבלאות **User**.

---

## דיאגרמת קשרים (Relationships Summary)
1. **משתמש <-> מועדון**:
   - משתמש יכול להיות שייך למועדון אחד (`clubId`).
   - מועדון מנוהל על ידי משתמש אחד (`managerId`).
2. **משחק <-> מועדון**:
   - כל משחק משוייך למועדון (`clubId`).
3. **משחק <-> משתמשים**:
   - משחק מכיל רשימה של משתמשים (`players.userId`).
   - משחק מכיל רשימה של העברות בין משתמשים (`settlementTransfers`).
   - תנועות בקופה של משתמש יכולות להיות מקושרות למשחק ספציפי (`bankrollHistory.gameId`).
