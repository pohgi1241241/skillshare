const SUPABASE_URL = "https://phlfqvfvqzfocsvzmsiw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGZxdmZ2cXpmb2Nzdnptc2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDcwNzksImV4cCI6MjA5ODk4MzA3OX0.VmpxumqUS5ZAGVdRInSfx6ykeLh_fXEabDt-azMbmSM";

// FIXED: Renamed to supabaseClient to prevent clashing with the library's global variable
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logoutBtn");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const messageDiv = document.getElementById("message");
const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userAvatar = document.getElementById("userAvatar");
const chatBox = document.getElementById("chatBox");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

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
    if (userName) userName.textContent = name;
    if (userEmail) userEmail.textContent = user.email;
    if (userAvatar) userAvatar.textContent = (name[0] || "S").toUpperCase();
}

function showAuth() {
    if (!authSection || !dashboard) return;
    authSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (messageDiv) messageDiv.className = "";
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
            showMessage("Account created! Check email to confirm.", "success");
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
        loginBtn.textContent = "Logging in...";
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

if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        await supabaseClient.auth.signOut();
        showAuth();
    });
}

if (searchBtn) {
    searchBtn.addEventListener("click", async function () {
        const query = searchInput.value.trim();
        if (!query) {
            searchResults.innerHTML = '<div class="empty"><div class="icon">🔎</div>Type a skill to search</div>';
            return;
        }
        searchResults.innerHTML = '<div class="empty">Searching...</div>';
        const result = await supabaseClient.from("profiles").select("*").ilike("skills_offered", "%" + query + "%");
        if (result.error) {
            searchResults.innerHTML = '<div class="empty">' + result.error.message + '</div>';
            return;
        }
        if (!result.data || result.data.length === 0) {
            searchResults.innerHTML = '<div class="empty"><div class="icon">🤷</div>No results for "' + query + '"</div>';
            return;
        }
        searchResults.innerHTML = result.data.map(function (p) {
            return '<div class="result-card"><h4>👤 ' + (p.full_name || "Anonymous") + '</h4><div class="meta"><strong>Offers:</strong> ' + (p.skills_offered || "N/A") + '<br><strong>Needs:</strong> ' + (p.skills_needed || "N/A") + '</div></div>';
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
        msg.className = "msg";
        const sender = (payload.new.sender_id || "s").slice(0, 6);
        msg.innerHTML = '<div class="sender">Student ' + sender + '</div>' + payload.new.message_text;
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