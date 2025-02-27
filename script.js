const GITHUB_USERNAME = "100adim";
const REPO_NAME = "GIS-PROJECT";
const FILE_PATH = "users.json";
const GITHUB_TOKEN = "SDcttYsnerH1hzHYXoJsapjpC77Y1537c65G;

async function fetchUsers() {
    const apiUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${FILE_PATH}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Error fetching users");
        return await response.json();
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function registerUser() {
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    if (!username || !password) {
        alert("Please fill all fields!");
        return;
    }

    let users = await fetchUsers();
    if (users.some(user => user.username === username)) {
        alert("Username already exists!");
        return;
    }

    const hashedPassword = await hashPassword(password);
    users.push({ username, password: hashedPassword });

    await updateUsersFile(users);
    alert("Registration successful!");
    closeModal('signup-modal');
}

async function updateUsersFile(users) {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;

    try {
        const response = await fetch(apiUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
        if (!response.ok) throw new Error("Error retrieving GitHub file data");

        const fileData = await response.json();
        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(users, null, 2))));

        const commitResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: { Authorization: `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Added user ${users[users.length - 1].username}`,
                content: updatedContent,
                sha: fileData.sha
            })
        });

        if (!commitResponse.ok) throw new Error("Error updating users in GitHub");
        console.log(`User ${users[users.length - 1].username} added successfully!`);
    } catch (error) {
        console.error("Error updating users:", error);
    }
}

async function loginUser() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    let users = await fetchUsers();
    const hashedPassword = await hashPassword(password);
    
    const user = users.find(user => user.username === username && user.password === hashedPassword);
    
    if (user) {
        alert("Login successful!");
        window.location.href = "showLocations.html";
    } else {
        alert("Incorrect username or password!");
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.addEventListener("DOMContentLoaded", fetchUsers);
