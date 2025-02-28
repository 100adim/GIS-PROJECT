const GITHUB_USERNAME = "100adim";
const REPO_NAME = "GIS-PROJECT";
const FILE_PATH = "users.json";
const GITHUB_TOKEN = typeof CONFIG !== "undefined" ? CONFIG.GITHUB_TOKEN : "";

async function fetchUsers() {
    const apiUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}`;
    try {
        const response = await fetch(apiUrl);
        return response.ok ? await response.json() : [];
    } catch (error) {
        console.error("שגיאה בשליפת משתמשים:", error);
        return [];
    }
}

async function updateUsersFile(users) {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
    try {
        const fileResponse = await fetch(apiUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
        const fileData = await fileResponse.json();
        const content = btoa(JSON.stringify(users, null, 2));
        const response = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Update users.json",
                content,
                sha: fileData.sha
            })
        });
        if (!response.ok) throw new Error("עדכון נכשל");
    } catch (error) {
        console.error("שגיאה בעדכון משתמשים:", error);
    }
}

async function registerUser() {
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    if (!username || !password) {
        alert("❌ נא למלא את כל השדות!");
        return;
    }

    let users = await fetchUsers();
    if (users.some(user => user.username === username)) {
        alert("⚠ שם המשתמש כבר קיים!");
        return;
    }

    users.push({ username, password });
    await updateUsersFile(users);
    alert("✅ ההרשמה הצליחה!");
    closeModal('signup-modal');
}

async function loginUser() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    let users = await fetchUsers();
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        alert("✅ התחברות מוצלחת!");
        window.location.href = "showLocations.html";
    } else {
        alert("❌ שם משתמש או סיסמה שגויים!");
    }
}
