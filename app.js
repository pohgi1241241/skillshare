// ============================================
// SUPABASE CONFIG
// ============================================
const SUPABASE_URL = "https://phlfqvfvqzfocsvzmsiw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGZxdmZ2cXpmb2Nzdnptc2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDcwNzksImV4cCI6MjA5ODk4MzA3OX0.VmpxumqUS5ZAGVdRInSfx6ykeLh_fXEabDt-azMbmSM";

// ============================================
// INITIALIZE
// ============================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// DOM
// ============================================
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

// ============================================
// HELPERS
// ============================================
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = "show " + (type || "info");
    if (type === "success") {
        setTimeout(() => { messageDiv.className = ""; }, 5000);
    }
}

function showDashboard(user) {
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    const name = (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];
    const displayName = user.user_metadata?.full_name || name;
    userName.textContent = displayName;
    userEmail.textContent = user.email;
    userAvatar.textContent = (displayName[0] || "S").toUpperCase();
}

function showAuth() {
    authSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
    emailInput.value = "";
    passwordInput.value = "";
    messageDiv.className = "";
}

// ============================================
// SIGN UP
// ============================================
signupBtn.addEventListener("click", async () => {
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

    const { data, error } = await supabase.auth.signUp({ email, password });

    signupBtn.disabled = false;
    signupBtn.textContent = originalText;

    if (error) {
        showMessage(error.message, "error");
    } else {
        showMessage("Account created! Check your email to confirm.", "success");
    }
});

// ============================================
// LOGIN
// ============================================
loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showMessage("Please enter email and password", "error");
        return;
    }

    loginBtn.disabled = true;
    const originalText = loginBtn.textContent;
    loginBtn.textContent = "Logging in...";

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    loginBtn.disabled = false;
    loginBtn.textContent = originalText;

    if (error) {
        showMessage(error.message, "error");
    } else if (data.user) {
        showDashboard(data.user);
    }
});

// ============================================
// GOOGLE LOGIN
// ============================================
googleBtn.addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
    });
    if (error) showMessage(error.message, "error");
});

// ============================================
// LOGOUT
// ============================================
logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    showAuth();
});

// ============================================
// SEARCH
// ============================================
searchBtn.addEventListener("click", async () => {
    const query = searchInput.value.trim();
    if (!query) {
        searchResults.innerHTML = '<div class="empty"><div class="icon">🔎</div>Type a skill to search</div>';
        return;
    }

    searchResults.innerHTML = '<div class="empty">Searching...</div>';

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("skills_offered", "%" + query + "%");

    if (error) {
        searchResults.innerHTML = '<div class="empty">' + error.message + '</div>';
        return;
    }

    if (!data || data.length === 0) {
        searchResults.innerHTML = '<div class="empty"><div class="icon">🤷</div>No results for "' + query + '"</div>';
        return;
    }

    searchResults.innerHTML = data.map(p => `
        <div class="result-card">
            <h4>👤 ${p.full_name || "Anonymous"}</h4>
            <div class="meta">
                <strong>Offers:</strong> ${p.skills_offered || "N/A"}<br>
                <strong>Needs:</strong> ${p.skills_needed || "N/A"}
            </div>
        </div>
    `).join("");
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBtn.click();
});

// ============================================
// CHAT
// ============================================
messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from("messages")
        .insert([{ message_text: text, sender_id: user.id }]);

    if (!error) messageInput.value = "";
});

// ============================================
// REALTIME
// ============================================
supabase
    .channel("messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = document.createElement("div");
        msg.className = "msg";
        const sender = (payload.new.sender_id || "s").slice(0, 6);
        msg.innerHTML = `<div class="sender">Student ${sender}</div>${payload.new.message_text}`;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    })
    .subscribe();

// ============================================
// SESSION CHECK
// ============================================
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) showDashboard(session.user);
})();

supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) showDashboard(session.user);
    else if (event === "SIGNED_OUT") showAuth();
});
