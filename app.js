const SUPABASE_URL = "https://phlfqvfvqzfocsvzmsiw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGZxdmZ2cXpmb2Nzdnptc2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDcwNzksImV4cCI6MjA5ODk4MzA3OX0.VmpxumqUS5ZAGVdRInSfx6ykeLh_fXEabDt-azMbmSM";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const googleBtn = document.getElementById("googleBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const messageDiv = document.getElementById("message");
const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userAvatar = document.getElementById("userAvatar");
const menuAvatar = document.getElementById("menuAvatar");
const menuUserName = document.getElementById("menuUserName");
const menuUserEmail = document.getElementById("menuUserEmail");
const chatBox = document.getElementById("chatBox");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const editUsername = document.getElementById("editUsername");

function showMessage(text, type) {
    if (!messageDiv) { alert(text); return; }
    messageDiv.textContent = text;
    messageDiv.className = "show " + (type || "info");
    if (type === "success") {
        setTimeout(function () { messageDiv.className = ""; }, 5000);
    }
}

function showDashboard(user) {
    if (!authSection || !dashboard) return;
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    const name = (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];
    
    userName.textContent = name;
    userEmail.value = user.email;
    userAvatar.textContent = (name[0] || "S").toUpperCase();
    
    if (menuAvatar) menuAvatar.textContent = (name[0] || "S").toUpperCase();
    if (menuUserName) menuUserName.textContent = name;
    if (menuUserEmail) menuUserEmail.textContent = user.email;
    
    if (editUsername) editUsername.value = name;
}

function showAuth() {
    if (!authSection || !dashboard) return;
    authSection.classList.add("hidden");
    dashboard.classList.add("hidden");
    emailInput.value = "";
    passwordInput.value = "";
    if (messageDiv) messageDiv.className = "";
    if (chatBox) chatBox.innerHTML = "";
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        showAuth();
        // Close the burger menu
        const sideMenu = document.getElementById("sideMenu");
        const menuOverlay = document.getElementById("menuOverlay");
        const burgerBtn = document.getElementById("burgerBtn");
        if (sideMenu) sideMenu.classList.remove("open");
        if (menuOverlay) menuOverlay.classList.remove("open");
        if (burgerBtn) burgerBtn.classList.remove("open");
    } catch (err) {
        console.error("Logout error:", err);
    }
}

if (signupBtn) {
    signupBtn.addEventListener("click", async function () {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) {
            showMessage("Please enter email and password", "error");
            return;
        }
        if (password.length < 6) {
            showMessage("Password must be 6+ characters", "error");
            return;
        }
        signupBtn.disabled = true;
        const originalText = signupBtn.textContent;
        signupBtn.textContent = "Creating...";
        const result = await supabaseClient.auth.signUp({ email: email, password: password });
        signupBtn.disabled = false;
        signupBtn.textContent = originalText;
        if (result.error) {
            showMessage(result.error.message, "error");
        } else {
            showMessage("Account created! Check your email to confirm.", "success");
        }
    });
}

if (loginBtn) {
    loginBtn.addEventListener("click", async function () {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) {
            showMessage("Please enter email and password", "error");
            return;
        }
        loginBtn.disabled = true;
        const originalText = loginBtn.textContent;
        loginBtn.textContent = "Signing in...";
        const result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
        if (result.error) {
            showMessage(result.error.message, "error");
        } else if (result.data && result.data.user) {
            showDashboard(result.data.user);
        }
    });
}

if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async function () {
        const email = emailInput.value.trim();
        if (!email) {
            showMessage("Enter your email first, then click forgot password", "error");
            return;
        }
        const result = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (result.error) {
            showMessage(result.error.message, "error");
        } else {
            showMessage("Password reset email sent! Check your inbox.", "success");
        }
    });
}

if (googleBtn) {
    googleBtn.addEventListener("click", async function () {
        const result = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: "https://skillsharejsorg.netlify.app" }
        });
        if (result.error) {
            showMessage(result.error.message, "error");
        }
    });
}

if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async function () {
        const newName = editUsername.value.trim();
        if (!newName) {
            showMessage("Please enter a display name", "error");
            return;
        }
        const result = await supabaseClient.auth.updateUser({
            data: { full_name: newName }
        });
        if (result.error) {
            showMessage(result.error.message, "error");
        } else {
            userName.textContent = newName;
            userAvatar.textContent = newName[0].toUpperCase();
            if (menuAvatar) menuAvatar.textContent = newName[0].toUpperCase();
            if (menuUserName) menuUserName.textContent = newName;
            
            showMessage("Profile updated!", "success");
            
            const settingsModal = document.getElementById("settingsModal");
            if (settingsModal) settingsModal.classList.remove("open");
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener("click", async function () {
        const query = searchInput.value.trim();
        if (!query) {
            searchResults.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 20px;">Type a skill to search</div>';
            return;
        }
        searchResults.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 20px;">Searching...</div>';
        const result = await supabaseClient.from("profiles").select("*").ilike("skills_offered", "%" + query + "%");
        if (result.error) {
            searchResults.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 20px;">' + result.error.message + '</div>';
            return;
        }
        if (!result.data || result.data.length === 0) {
            searchResults.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 20px;">No results for "' + query + '"</div>';
            return;
        }
        searchResults.innerHTML = result.data.map(function (p) {
            return '<div class="roblox-game-card"><div class="card-display-icon">👤</div><div class="card-details"><div class="game-title">' + (p.full_name || "Anonymous") + '</div><div class="game-stats">🎯 ' + (p.skills_offered || "N/A") + '</div></div></div>';
        }).join("");
    });
}

if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") searchBtn.click();
    });
}

if (messageForm) {
    messageForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;
        const userResult = await supabaseClient.auth.getUser();
        if (!userResult.data || !userResult.data.user) return;
        const insertResult = await supabaseClient.from("messages").insert([{ message_text: text, sender_id: userResult.data.user.id }]);
        if (!insertResult.error) {
            messageInput.value = "";
        }
    });
}

if (supabaseClient) {
    supabaseClient.channel("messages").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, function (payload) {
        if (!chatBox) return;
        const msg = document.createElement("div");
        msg.className = "chat-bubble";
        const sender = (payload.new.sender_id || "s").slice(0, 6);
        msg.innerHTML = '<div class="sender-tag">Student ' + sender + '</div>' + payload.new.message_text;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }).subscribe();
}

(async function () {
    const result = await supabaseClient.auth.getSession();
    if (result.data && result.data.session && result.data.session.user) {
        showDashboard(result.data.session.user);
    }
})();

supabaseClient.auth.onAuthStateChange(function (event, session) {
    if (event === "SIGNED_IN" && session && session.user) {
        showDashboard(session.user);
    } else if (event === "SIGNED_OUT") {
        showAuth();
    }
});

// Burger menu logout - use the direct handler
document.addEventListener("DOMContentLoaded", function() {
    const menuLogoutBtn = document.getElementById("menuLogoutBtn");
    if (menuLogoutBtn) {
        menuLogoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
});
