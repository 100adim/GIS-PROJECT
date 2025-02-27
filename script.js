const GITHUB_USERNAME = "100adim"; 
const REPO_NAME = "GIS-PROJECT";
const FILE_PATH = "users.json";

// שימוש בטוקן בצורה בטוחה (אם יש `config.js`, אחרת משתמשים ב-Secrets של גיטאב)
const GITHUB_TOKEN = typeof CONFIG !== "undefined" ? CONFIG.GITHUB_TOKEN : process.env.GITHUB_ACCESS_TOKEN;

// 🚀 פונקציה שמביאה את רשימת המשתמשים מתוך `users.json`
async function fetchUsers() {
    const apiUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}`;

    try {
        const response = await fetch(apiUrl);
        const users = await response.json();

        const userList = document.getElementById("userList");
        if (userList) {
            userList.innerHTML = ""; // ניקוי הרשימה הקיימת
            users.forEach(user => {
                let li = document.createElement("li");
                li.textContent = user.username;
                userList.appendChild(li);
            });
        }

        console.log("✅ רשימת המשתמשים נטענה:", users);
        return users;
    } catch (error) {
        console.error("❌ שגיאה בטעינת המשתמשים:", error);
        return [];
    }
}

// 🚀 פונקציה להצפנת סיסמאות ב-SHA256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}

// 🚀 פונקציה לרישום משתמש חדש
async function registerUser() {
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    if (!username || !password) {
        alert("⚠ יש למלא את כל השדות!");
        return;
    }

    let users = await fetchUsers();

    // בדיקה אם המשתמש כבר קיים
    if (users.some(user => user.username === username)) {
        alert("⚠ שם משתמש כבר קיים במערכת!");
        return;
    }

    const hashedPassword = await hashPassword(password);
    users.push({ username, password: hashedPassword });

    await updateUsersFile(users);
    alert("✅ ההרשמה בוצעה בהצלחה! ניתן להתחבר עכשיו.");
    closeModal('signup-modal');
    openModal('login-modal');
}

// 🚀 פונקציה לעדכון `users.json` בגיטאב
async function updateUsersFile(users) {
    console.log("🚀 מנסה לעדכן את users.json בגיט...");

    const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;

    try {
        const response = await fetch(apiUrl, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        if (!response.ok) throw new Error("❌ שגיאה בשליפת הנתונים מ-GitHub");

        const fileData = await response.json();
        console.log("📄 קובץ נמצא בגיט! ממשיך לעדכן...");

        const updatedContent = btoa(JSON.stringify(users, null, 2));

        const commitResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Added user ${users[users.length - 1].username}`,
                content: updatedContent,
                sha: fileData.sha
            })
        });

        if (!commitResponse.ok) throw new Error("❌ שגיאה בעדכון המשתמשים בגיט");

        console.log(`✅ המשתמש ${users[users.length - 1].username} נוסף בהצלחה!`);
    } catch (error) {
        console.error("❌ שגיאה בעדכון המשתמשים:", error);
    }
}

// 🚀 פונקציה להתחברות משתמשים
async function loginUser() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    let users = await fetchUsers();
    const hashedPassword = await hashPassword(password);
    
    const user = users.find(user => user.username === username && user.password === hashedPassword);
    
    if (user) {
        alert("✅ התחברת בהצלחה!");
        window.location.href = "showLocations.html";
    } else {
        alert("❌ שם משתמש או סיסמה שגויים!");
    }
}

// 🚀 פונקציות להצגת חלונות ההרשמה/התחברות
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 🚀 טוען את רשימת המשתמשים בעת טעינת הדף
document.addEventListener("DOMContentLoaded", fetchUsers);
